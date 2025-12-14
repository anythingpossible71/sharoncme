import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ segments: string[] }> }
) {
  logger.debug("[Storage] Catch-all route hit");
  const params = await context.params;
  logger.debug("[Storage] Segments", { segments: params.segments });

  return NextResponse.json({
    message: "Catch-all route working",
    segments: params.segments,
  });
}
