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
    const visibility = (formData.get("visibility") as string) || "private";
    const folder = (formData.get("folder") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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

    // Handle folder structure
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    try {
      // Upload file using the storage provider
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      logger.info("Starting file upload", { filePath, size: file.size, type: file.type });

      const uploadResult = await provider.uploadFile({
        external_id: `admin-upload-${uniqueId}`,
        key: filePath,
        filename: file.name,
        buffer: buffer,
        contentType: file.type,
        size: file.size,
        public: visibility === "public",
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: session.user.id,
        },
      });

      logger.info("Upload successful", { filePath, result: uploadResult });
      logger.debug("Upload result details", {
        key: uploadResult.key,
        size: uploadResult.size,
        contentType: uploadResult.contentType,
        publicUrl: uploadResult.publicUrl,
        visibility: uploadResult.visibility,
      });

      // Verify the file was actually saved by checking if it exists
      try {
        const fileExists = await provider.fileExists(uploadResult.key);
        logger.debug("File exists check", { key: uploadResult.key, fileExists });
        if (!fileExists) {
          logger.error("WARNING: File upload reported success but file doesn't exist!", {
            key: uploadResult.key,
          });
        }
      } catch (checkError) {
        logger.error(
          "Error checking if file exists",
          { key: uploadResult.key },
          checkError instanceof Error ? checkError : undefined
        );
      }

      const result: UploadResult = {
        success: true,
        fileName,
        filePath: uploadResult.key,
        size: uploadResult.size,
        contentType: uploadResult.contentType,
        visibility: uploadResult.visibility as "public" | "private",
      };

      // Add URL - prefer publicUrl from provider, but always construct our API URL as fallback
      if (uploadResult.publicUrl) {
        result.url = uploadResult.publicUrl;
      } else {
        // Construct URL using our storage API endpoint
        // The uploadResult.key is the file path (e.g., "website-assets/filename.jpg")
        result.url = `/api/storage/files/${uploadResult.key}`;
      }

      logger.info("File uploaded successfully", {
        key: uploadResult.key,
        url: result.url,
        publicUrl: uploadResult.publicUrl,
      });

      return NextResponse.json(result);
    } catch (error) {
      logger.error(
        "Error uploading file",
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
