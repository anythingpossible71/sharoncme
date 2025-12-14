/**
 * URL utility functions for dynamic base URL detection
 *
 * Handles the case where AUTH_URL and NEXT_PUBLIC_APP_URL are not set
 * by detecting the actual server port at runtime.
 */

/**
 * Get the base URL for the application
 *
 * Priority:
 * 1. Client-side: use window.location.origin (actual browser URL)
 * 2. NEXT_PUBLIC_APP_URL environment variable
 * 3. AUTH_URL environment variable
 * 4. Default to http://localhost with detected port
 *
 * @param headers - Optional headers object from request (for server-side port detection)
 * @returns The base URL (e.g., "http://localhost:3000")
 */
export function getBaseUrl(headers?: Headers): string {
  // Client-side: use actual browser URL
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Server-side: check environment variables first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL;
  }

  // Try to detect from request headers if provided
  if (headers) {
    const host = headers.get("host");
    const protocol = headers.get("x-forwarded-proto") || "http";
    if (host) {
      return `${protocol}://${host}`;
    }
  }

  // Default fallback with PORT detection
  const port = process.env.PORT || "3000";
  return `http://localhost:${port}`;
}

/**
 * Get the base URL from Next.js headers (for use in Server Components and Route Handlers)
 *
 * @returns The base URL detected from request headers
 */
export async function getBaseUrlFromRequest(): Promise<string> {
  // Check environment variables first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL;
  }

  // Try to import headers from next/headers (only works in Server Components/Route Handlers)
  try {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = headersList.get("x-forwarded-proto") || "http";

    if (host) {
      return `${protocol}://${host}`;
    }
  } catch {
    // headers() not available in this context
  }

  // Fallback
  const port = process.env.PORT || "3000";
  return `http://localhost:${port}`;
}

/**
 * Synchronous version for use in non-async contexts
 * Uses environment variables and PORT fallback
 *
 * @returns The base URL from env vars or localhost with PORT
 */
export function getBaseUrlSync(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL;
  }

  const port = process.env.PORT || "3000";
  return `http://localhost:${port}`;
}
