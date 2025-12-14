import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** trigger build v1
 * Format log entry for Edge Runtime (middleware runs in Edge, not Node)
 * Edge Runtime doesn't support the full logger module, so we use structured console logs
 */
function logRequest(data: {
  message: string;
  method: string;
  pathname: string;
  status?: number;
  duration?: number;
  ip?: string;
  userAgent?: string;
}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: "info",
    message: data.message,
    context: {
      method: data.method,
      pathname: data.pathname,
      ...(data.status && { status: data.status }),
      ...(data.duration !== undefined && { duration: `${data.duration}ms` }),
      ...(data.ip && { ip: data.ip }),
      ...(data.userAgent && { userAgent: data.userAgent }),
    },
  };
  console.log(JSON.stringify(logEntry));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();

  // Skip proxy for static files and API routes (except auth)
  const isStaticOrAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") ||
    (pathname.startsWith("/api") && !pathname.startsWith("/api/auth"));

  if (isStaticOrAsset) {
    return NextResponse.next();
  }

  // Get client IP and user agent for logging
  const ip =
    request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Add the current pathname to headers so server components can access it
  const response = NextResponse.next();
  response.headers.set("x-pathname", request.nextUrl.pathname + request.nextUrl.search);

  // Calculate request duration
  const duration = Date.now() - startTime;

  // Log all requests with timing information
  logRequest({
    message: `${request.method} ${pathname} ${response.status} - ${duration}ms`,
    method: request.method,
    pathname: pathname,
    status: response.status,
    duration: duration,
    ip: ip,
    userAgent: userAgent,
  });

  // Add security headers
  // Check if we're in remote CrunchyCone production environment
  const isRemoteCrunchyConeProduction = process.env.CRUNCHYCONE_PLATFORM === "1";

  // When NOT in CrunchyCone production: Allow iframe embedding for ALL routes
  // When in CrunchyCone production: Only allow specific routes (components-library, mock pages, admin routes)
  if (!isRemoteCrunchyConeProduction) {
    // Allow all routes to be embedded when not in production
    // Don't set X-Frame-Options (allows embedding), use Content-Security-Policy instead
    response.headers.set("Content-Security-Policy", "frame-ancestors *;");
  } else {
    // In production: Only allow specific routes
    const mockPages = [
      "/add-domain",
      "/dev-home",
      "/dev-landing",
      "/dev-my-projects",
      "/dev-publish-dialog",
      "/dev-version-dropdown",
    ];
    const isMockPage = mockPages.includes(pathname);
    const isAdminFixedHeader = pathname === "/admin/fixed-header";
    const isEmbededVersions = pathname === "/admin/embeded-versions";
    const isAdminRoute = pathname.startsWith("/admin");
    const isAuthRoute = pathname.startsWith("/auth");

    const shouldAllowIframe =
      pathname === "/components-library" ||
      isMockPage ||
      isAdminFixedHeader ||
      isEmbededVersions ||
      isAdminRoute ||
      isAuthRoute;

    if (!shouldAllowIframe) {
      response.headers.set("X-Frame-Options", "DENY");
    } else {
      // Allow embedding for specific routes in production
      response.headers.set("Content-Security-Policy", "frame-ancestors *;");
    }
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

// Configure which routes the proxy should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
