import { NextRequest, NextResponse } from "next/server";
import { logRequest, getClientIp } from "./request-logger";
import { auth } from "@/lib/auth";

type RouteHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function to add request logging to API route handlers
 *
 * Usage:
 * export const GET = withRequestLogging(async (request) => {
 *   // Your handler code
 * });
 */
export function withRequestLogging(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    const startTime = Date.now();
    const pathname = new URL(request.url).pathname;
    const query = new URL(request.url).search.substring(1) || undefined;

    // Get user ID from session (if authenticated)
    let userId: string | undefined;
    try {
      const session = await auth();
      userId = session?.user?.id;
    } catch {
      userId = undefined;
    }

    try {
      const response = await handler(request, context);
      const duration = Date.now() - startTime;

      // Log successful request
      logRequest(
        {
          method: request.method,
          path: pathname,
          query,
          status: response.status,
          duration,
          ip: getClientIp(request),
          userAgent: request.headers.get("user-agent") || undefined,
          referer: request.headers.get("referer") || undefined,
          userId, // Actual user ID (ULID) or undefined
          size: parseInt(response.headers.get("content-length") || "0", 10) || undefined,
        },
        {
          format: process.env.LOG_FORMAT === "json" ? "json" : "combined",
          truncateUserAgent: 0,
          truncateReferer: 0,
        }
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error request
      logRequest(
        {
          method: request.method,
          path: pathname,
          query,
          status: 500,
          duration,
          ip: getClientIp(request),
          userAgent: request.headers.get("user-agent") || undefined,
          referer: request.headers.get("referer") || undefined,
          userId, // Actual user ID (ULID) or undefined
          error: error instanceof Error ? error.message : "Unknown error",
        },
        {
          format: process.env.LOG_FORMAT === "json" ? "json" : "combined",
          truncateUserAgent: 0,
          truncateReferer: 0,
        }
      );

      throw error;
    }
  };
}
