import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  logger.debug("[Storage] Test dynamic route hit");
  const params = await context.params;
  logger.debug("[Storage] Slug", { slug: params.slug });

  return NextResponse.json({ message: `Dynamic route working: ${params.slug}` });
}
