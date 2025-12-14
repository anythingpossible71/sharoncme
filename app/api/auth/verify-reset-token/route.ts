import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      throw new Error("AUTH_SECRET not configured");
    }

    const decoded = jwt.verify(token, secret) as { userId: string; type: string };

    if (!decoded || decoded.type !== "reset") {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      userId: decoded.userId,
    });
  } catch (error) {
    logger.error("Token verification error:", {}, error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Token verification failed" }, { status: 400 });
  }
}
