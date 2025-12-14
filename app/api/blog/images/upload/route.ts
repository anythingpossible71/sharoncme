import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/permissions";
import { v4 as uuidv4 } from "uuid";
import { initializeStorageProvider, getStorageProvider } from "crunchycone-lib/storage";
import { logger } from "@/lib/logger";

interface UploadResult {
  success: boolean;
  fileName: string;
  filePath: string;
  size: number;
  contentType: string;
  visibility: "public" | "private";
  url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !(await hasRole(session.user.id, "admin"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Only allow image files
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    // Initialize storage provider if not already done
    try {
      initializeStorageProvider();
    } catch {
      // Provider might already be initialized
    }

    const provider = getStorageProvider();

    // Generate unique filename to prevent conflicts
    const fileExtension = file.name.split(".").pop() || "";
    const uniqueId = uuidv4().slice(0, 8);
    const baseFileName = file.name.replace(/\.[^/.]+$/, "");
    const fileName = `${baseFileName}-${uniqueId}${fileExtension ? `.${fileExtension}` : ""}`;

    // Store images in blog/ folder
    const filePath = `blog/${fileName}`;

    try {
      // Upload file using the storage provider
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      logger.info("Starting blog image upload", { filePath, size: file.size, type: file.type });

      const uploadResult = await provider.uploadFile({
        external_id: `blog-image-${uniqueId}`,
        key: filePath,
        filename: file.name,
        buffer: buffer,
        contentType: file.type,
        size: file.size,
        public: true, // Blog images should be public
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: session.user.id,
          source: "blog-editor",
        },
      });

      logger.info("Blog image upload successful", { filePath, result: uploadResult });

      const result: UploadResult = {
        success: true,
        fileName,
        filePath: uploadResult.key,
        size: uploadResult.size,
        contentType: uploadResult.contentType,
        visibility: "public",
      };

      // Add URL - prefer publicUrl from provider, but always construct our API URL as fallback
      if (uploadResult.publicUrl) {
        result.url = uploadResult.publicUrl;
      } else {
        // Construct URL using our storage API endpoint
        result.url = `/api/storage/files/${uploadResult.key}`;
      }

      logger.info("Blog image uploaded successfully", {
        key: uploadResult.key,
        url: result.url,
        publicUrl: uploadResult.publicUrl,
      });

      return NextResponse.json(result);
    } catch (error) {
      logger.error(
        "Error uploading blog image",
        {
          filePath,
          message: error instanceof Error ? error.message : "Unknown error",
        },
        error instanceof Error ? error : undefined
      );
      return NextResponse.json(
        {
          error: "Upload failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch {
    // Error handled silently
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
