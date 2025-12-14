import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface ClientError {
  type: "runtime" | "build" | "unhandled";
  message: string;
  stack?: string;
  timestamp: string;
  url?: string;
  userAgent?: string;
}

export async function POST(request: NextRequest) {
  // Only allow this endpoint in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const errorData: ClientError = await request.json();

    // Log client-side error in a clear, concise format
    logger.error(`🚨 CLIENT-SIDE ERROR: ${errorData.message}`, {
      type: errorData.type,
      url: errorData.url,
      userAgent: errorData.userAgent,
    });
    if (errorData.stack) {
      logger.error(errorData.stack);
    }

    return NextResponse.json({ success: true, logged: true });
  } catch (error) {
    logger.error(
      "❌ Error processing client-side error report:",
      {},
      error instanceof Error ? error : undefined
    );
    return NextResponse.json({ error: "Failed to process error report" }, { status: 500 });
  }
}

// Only allow POST requests
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  return NextResponse.json({
    message: "Client debug endpoint is active",
    environment: "development",
  });
}
