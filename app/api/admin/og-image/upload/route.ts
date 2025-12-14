import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync, readdirSync } from "fs";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const PUBLIC_DIR = join(process.cwd(), "public");
const OG_IMAGE_FILENAME = "og-image";
const APP_SETTINGS_ID = "app-settings-singleton";

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

    // Delete all existing og-image.* files before uploading new one
    try {
      if (existsSync(PUBLIC_DIR)) {
        const files = readdirSync(PUBLIC_DIR);
        const oldImageFiles = files.filter((file) => file.startsWith(OG_IMAGE_FILENAME + "."));

        for (const oldFile of oldImageFiles) {
          const oldFilePath = join(PUBLIC_DIR, oldFile);
          await unlink(oldFilePath);
          logger.info(`[OGImage] Deleted old preview image file: ${oldFile}`);
        }
      }
    } catch (error) {
      logger.error(
        "[OGImage] Error deleting old preview image files:",
        {},
        error instanceof Error ? error : undefined
      );
      // Continue with upload even if deletion fails
    }

    // Construct filename: og-image.{ext}
    const filename = `${OG_IMAGE_FILENAME}.${fileExtension}`;
    const filePath = join(PUBLIC_DIR, filename);

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file to public directory
    await writeFile(filePath, buffer);

    logger.info(`[OGImage] Preview image uploaded successfully: ${filename}`);

    // Return the public URL path
    const publicUrl = `/${filename}`;

    // Update database with new preview image URL
    try {
      await prisma.appSettings.update({
        where: { id: APP_SETTINGS_ID },
        data: { app_preview_image_url: publicUrl },
      });
      logger.info(`[OGImage] Database updated with new preview image URL: ${publicUrl}`);
    } catch (error) {
      logger.error(
        "[OGImage] Error updating database:",
        {},
        error instanceof Error ? error : undefined
      );
      // Continue even if database update fails
    }

    return NextResponse.json({
      success: true,
      filename,
      url: publicUrl,
      size: file.size,
      contentType: file.type,
    });
  } catch (error) {
    logger.error(
      "[OGImage] Error uploading preview image:",
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
