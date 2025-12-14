import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/permissions";
import { checkBuildStatus } from "@/app/actions/check-build-status";
import { logger } from "@/lib/logger";
import { isPlatformEnvironment } from "@/lib/platform-utils";

// Force dynamic rendering - this route uses CLI commands
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Require admin role
    await requireRole("admin");

    // Don't check build status in production (platform environment)
    if (isPlatformEnvironment()) {
      return NextResponse.json({
        success: false,
        status: null,
        error: "Build status not available in production",
      });
    }

    const result = await checkBuildStatus();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.debug("Build status not available", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        success: false,
        status: null,
        error: error instanceof Error ? error.message : "Failed to check build status",
      },
      { status: 200 } // Return 200 so client doesn't treat as error - just no status available
    );
  }
}
