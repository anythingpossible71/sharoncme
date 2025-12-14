/**
 * HTTP Request Logger
 * Provides Apache/Nginx-style access logs for all HTTP requests
 */

import { NextRequest, NextResponse } from "next/server";

export interface RequestLogData {
  method: string;
  path: string;
  status: number;
  duration: number; // milliseconds
  ip: string;
  userAgent?: string;
  referer?: string;
  userId?: string;
  size?: number; // response size in bytes
  query?: string;
  error?: string;
}

export interface LoggerOptions {
  format?: "combined" | "json";
  truncateUserAgent?: number; // Max length for user agent (0 = no truncation)
  truncateReferer?: number; // Max length for referer (0 = no truncation)
}

/**
 * Truncate string if needed
 */
function truncate(str: string | undefined, maxLength: number): string {
  if (!str || maxLength === 0) return str || "-";
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
}

/**
 * Escape quotes in strings for log format
 */
function escapeQuotes(str: string): string {
  return str.replace(/"/g, '\\"');
}

/**
 * Format log in Combined Log Format (Apache/Nginx style)
 * Example: 127.0.0.1 - 01HX5ZRJB8... [20/Nov/2025:14:23:45] "GET /api/admin/users HTTP/1.1" 200 1234 "https://example.com/admin" "Mozilla/5.0..." 45ms
 */
function formatCombinedLog(data: RequestLogData, options?: LoggerOptions): string {
  const { ip, userId, method, path, query, status, size, referer, userAgent, duration } = data;

  const timestamp = new Date()
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d{3}Z$/, "");

  const user = userId || "-";
  const fullPath = query ? `${path}?${query}` : path;
  const sizeStr = size ? size.toString() : "-";

  // Apply truncation if specified (0 = no truncation)
  const truncateUA = options?.truncateUserAgent ?? 0; // Default: no truncation
  const truncateRef = options?.truncateReferer ?? 0; // Default: no truncation

  const refererStr = truncate(referer, truncateRef);
  const uaStr = truncate(userAgent, truncateUA);

  // Escape quotes in strings that go into quoted fields
  const safeReferer = escapeQuotes(refererStr);
  const safeUA = escapeQuotes(uaStr);

  return `${ip} - ${user} [${timestamp}] "${method} ${fullPath} HTTP/1.1" ${status} ${sizeStr} "${safeReferer}" "${safeUA}" ${duration}ms`;
}

/**
 * Format log as structured JSON
 */
function formatJsonLog(data: RequestLogData, options?: LoggerOptions): string {
  // Apply truncation if specified
  const truncateUA = options?.truncateUserAgent ?? 0;
  const truncateRef = options?.truncateReferer ?? 0;

  const logData = {
    timestamp: new Date().toISOString(),
    method: data.method,
    path: data.path,
    query: data.query,
    status: data.status,
    duration: data.duration,
    ip: data.ip,
    userAgent: truncateUA > 0 ? truncate(data.userAgent, truncateUA) : data.userAgent,
    referer: truncateRef > 0 ? truncate(data.referer, truncateRef) : data.referer,
    userId: data.userId,
    size: data.size,
    error: data.error,
  };

  // Remove undefined values
  return JSON.stringify(
    Object.fromEntries(Object.entries(logData).filter(([_, v]) => v !== undefined))
  );
}

/**
 * Log HTTP request
 */
export function logRequest(data: RequestLogData, options?: LoggerOptions): void {
  const format = options?.format || (process.env.LOG_FORMAT === "json" ? "json" : "combined");

  const formatted =
    format === "json" ? formatJsonLog(data, options) : formatCombinedLog(data, options);

  // Determine log level based on status code
  const level = data.status >= 500 ? "error" : data.status >= 400 ? "warn" : "info";

  // Use raw console for consistent formatting
  if (level === "error") {
    console.error(formatted);
  } else if (level === "warn") {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

/**
 * Extract IP address from request headers
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    (request as { ip?: string }).ip ||
    "unknown"
  );
}

/**
 * Extract user ID from authenticated session
 * Returns the actual user ID (ULID) from the database, not email
 * Returns undefined for unauthenticated requests (will show as "-" in logs)
 *
 * NOTE: This function is a placeholder for middleware.
 * The actual user ID extraction should be done in the calling code
 * using auth() from @/lib/auth to avoid webpack build issues.
 */
export async function getUserId(_request: NextRequest): Promise<string | undefined> {
  // This is intentionally empty - user ID should be passed from middleware
  // See middleware.ts for the actual implementation
  return undefined;
}

/**
 * Estimate response size from NextResponse
 */
export function getResponseSize(response: NextResponse): number | undefined {
  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    return parseInt(contentLength, 10);
  }
  return undefined;
}
