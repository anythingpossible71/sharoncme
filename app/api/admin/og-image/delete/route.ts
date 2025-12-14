import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync, readdirSync } from "fs";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const PUBLIC_DIR = join(process.cwd(), "public");
const OG_IMAGE_FILENAME = "og-image";

export async function POST(__request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !(await hasRole(session.user.id, "admin"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the og-image file
    if (!existsSync(PUBLIC_DIR)) {
      return NextResponse.json({ success: true, message: "No preview image file found" });
    }

    const files = readdirSync(PUBLIC_DIR);
    const imageFile = files.find((file) => file.startsWith(OG_IMAGE_FILENAME + "."));

    if (!imageFile) {
      return NextResponse.json({ success: true, message: "No preview image file found" });
    }

    // Delete the file
    const filePath = join(PUBLIC_DIR, imageFile);
    await unlink(filePath);

    // Clear preview image URL from database
    const APP_SETTINGS_ID = "app-settings-singleton";
    await prisma.appSettings.update({
      where: { id: APP_SETTINGS_ID },
      data: { app_preview_image_url: null },
    });

    logger.info(`[OGImage] Preview image deleted successfully: ${imageFile}`);

    return NextResponse.json({
      success: true,
      message: "Preview image deleted successfully",
    });
  } catch (error) {
    logger.error(
      "[OGImage] Error deleting preview image:",
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
