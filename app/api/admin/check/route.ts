import { NextResponse } from "next/server";
import { checkAdminExists } from "@/app/actions/admin";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const adminExists = await checkAdminExists();

    return NextResponse.json({
      adminExists,
    });
  } catch (error) {
    logger.error("Error in admin check API", {}, error instanceof Error ? error : undefined);

    return NextResponse.json(
      {
        adminExists: false,
        error: "Failed to check admin status",
      },
      { status: 500 }
    );
  }
}
