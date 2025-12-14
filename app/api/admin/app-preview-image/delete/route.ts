import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/permissions";
import { unlink } from "fs/promises";
import { readdirSync, existsSync } from "fs";
import { join } from "path";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const PUBLIC_DIR = join(process.cwd(), "public");
const PREVIEW_IMAGE_FILENAME = "app-preview-image";

export async function POST(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !(await hasRole(session.user.id, "admin"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all existing app-preview-image.* files
    if (!existsSync(PUBLIC_DIR)) {
      return NextResponse.json({ success: true, message: "No files to delete" });
    }

    const files = readdirSync(PUBLIC_DIR);
    const previewImageFiles = files.filter((file) => file.startsWith(PREVIEW_IMAGE_FILENAME + "."));

    if (previewImageFiles.length === 0) {
      return NextResponse.json({ success: true, message: "No preview image files found" });
    }

    // Delete all matching files
    for (const file of previewImageFiles) {
      const filePath = join(PUBLIC_DIR, file);
      await unlink(filePath);
      logger.info(`[AppPreviewImage] Deleted preview image file: ${file}`);
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${previewImageFiles.length} preview image file(s)`,
      deletedFiles: previewImageFiles,
    });
  } catch (error) {
    logger.error(
      "[AppPreviewImage] Error deleting preview image",
      {},
      error instanceof Error ? error : undefined
    );
    return NextResponse.json(
      {
        error: "Delete failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
