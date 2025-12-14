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
const LOGO_FILENAME = "app-logo";
const ICON_FILENAME = "app-icon";

export async function POST(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !(await hasRole(session.user.id, "admin"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all app-logo.* and app-icon.* files (both are used as logo)
    if (!existsSync(PUBLIC_DIR)) {
      return NextResponse.json({ success: true, message: "No logo files found" });
    }

    const files = readdirSync(PUBLIC_DIR);
    const logoFiles = files.filter(
      (file) => file.startsWith(LOGO_FILENAME + ".") || file.startsWith(ICON_FILENAME + ".")
    );

    if (logoFiles.length === 0) {
      return NextResponse.json({ success: true, message: "No logo files found" });
    }

    // Delete all matching files
    for (const file of logoFiles) {
      const filePath = join(PUBLIC_DIR, file);
      await unlink(filePath);
      logger.info(`[AppLogo] Deleted logo file: ${file}`);
    }

    // Clear logo URL from database
    const APP_SETTINGS_ID = "app-settings-singleton";
    await prisma.appSettings.update({
      where: { id: APP_SETTINGS_ID },
      data: { app_logo_url: null },
    });

    logger.info(`[AppLogo] Logo deleted successfully: ${logoFiles.join(", ")}`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${logoFiles.length} logo file(s)`,
      deletedFiles: logoFiles,
    });
  } catch (error) {
    logger.error("[AppLogo] Error deleting logo", {}, error instanceof Error ? error : undefined);
    return NextResponse.json(
      {
        error: "Delete failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
