import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/permissions";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { logger } from "@/lib/logger";
import { resizeImageWithFFmpeg } from "@/lib/utils/ffmpeg-image";

export const dynamic = "force-dynamic";

const PUBLIC_DIR = join(process.cwd(), "public");
const PREVIEW_IMAGE_FILENAME = "app-preview-image";
// Resize to 1200x630 for optimal OG:Image size (Open Graph standard)
const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 630;

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

    // Validate file size (max 10MB for preview image)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    // Validate file type (images only)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Get file extension
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "png";
    const validExtensions = ["png", "jpg", "jpeg", "gif", "webp", "svg"];

    if (!validExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${validExtensions.join(", ")}` },
        { status: 400 }
      );
    }

    // Ensure public directory exists
    if (!existsSync(PUBLIC_DIR)) {
      await mkdir(PUBLIC_DIR, { recursive: true });
    }

    // Construct filename: app-preview-image.{ext}
    const filename = `${PREVIEW_IMAGE_FILENAME}.${fileExtension}`;
    const filePath = join(PUBLIC_DIR, filename);

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Resize image if it's not an SVG (SVGs are vector graphics and scale automatically)
    let processedBuffer: Buffer = buffer;
    if (fileExtension !== "svg") {
      try {
        processedBuffer = await resizeImageWithFFmpeg(
          buffer,
          TARGET_WIDTH,
          TARGET_HEIGHT,
          fileExtension
        );
        logger.info(`[AppPreviewImage] Resized image to ${TARGET_WIDTH}x${TARGET_HEIGHT}`, {
          originalSize: file.size,
          processedSize: processedBuffer.length,
        });
      } catch (resizeError) {
        logger.warn("[AppPreviewImage] Failed to resize image, using original", {
          error: resizeError instanceof Error ? resizeError.message : String(resizeError),
        });
        // If resize fails, use original buffer
        processedBuffer = buffer;
      }
    }

    // Write file to public directory (overwrites existing)
    await writeFile(filePath, processedBuffer);

    logger.info(`[AppPreviewImage] Preview image uploaded successfully: ${filename}`);

    // Return the public URL path
    const publicUrl = `/${filename}`;

    return NextResponse.json({
      success: true,
      filename,
      url: publicUrl,
      size: file.size,
      contentType: file.type,
    });
  } catch (error) {
    logger.error(
      "[AppPreviewImage] Error uploading preview image",
      {},
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
}
