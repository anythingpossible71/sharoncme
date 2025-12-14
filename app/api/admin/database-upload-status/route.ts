import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/permissions";
import { getUploadStatus } from "@/app/actions/database-upload";
import { logger } from "@/lib/logger";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check authentication and admin status
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(session.user.id);
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const status = await getUploadStatus();

    return NextResponse.json({
      success: true,
      status: status.status,
      startedAt: status.startedAt,
      completedAt: status.completedAt,
      error: status.error,
    });
  } catch (error) {
    logger.error("Error getting upload status", {}, error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
