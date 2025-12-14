import { headers } from "next/headers";
import { isCurrentUserAdmin } from "@/lib/auth/permissions";
import { ConditionalThemeProviderClient } from "./ConditionalThemeProviderClient";

/**
 * Conditional theme provider that excludes admin routes
 * Admin routes have their own AdminThemeProvider
 */
export async function ConditionalThemeProvider({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAdminRoute = pathname.startsWith("/admin");
  const isMockRoute = pathname.startsWith("/dev-") || pathname.startsWith("/backups");
  const isRedirectRoute = pathname.startsWith("/redirect");

  // Admin routes, mock routes, and redirect route handle their own theming (or have no theming)
  if (isAdminRoute || isMockRoute || isRedirectRoute) {
    return <>{children}</>;
  }

  // Check admin status server-side for padding
  const isAdmin = await isCurrentUserAdmin();

  return (
    <ConditionalThemeProviderClient isAdmin={isAdmin}>{children}</ConditionalThemeProviderClient>
  );
}
