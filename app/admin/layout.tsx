import path from "path";
import { getCurrentUser, isAdmin } from "@/lib/auth/permissions";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import { AdminFlattenedLayoutClient } from "@/components/admin/AdminFlattenedLayoutClient";
import { getAppSettings } from "@/app/actions/app-settings";
import {
  getCrunchyConeCustomDomainUrl,
  getCrunchyConeDeploymentsUrl,
} from "@/lib/crunchycone-config";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import "@/app/admin/admin.css";

const projectFolderName = path.basename(process.cwd());

function isPlatformEnvironment(): boolean {
  const value = process.env.CRUNCHYCONE_PLATFORM;
  return value === "1" || value === "true";
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Require authentication and admin role for all admin pages
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/signin?callbackUrl=" + encodeURIComponent("/admin"));
  }

  // Check if user is admin
  const isUserAdmin = await isAdmin(currentUser.id);
  if (!isUserAdmin) {
    redirect("/");
  }

  // Check if this is an iframe sub-route (error/not-found) - skip AdminLayoutClient wrapper
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isHeaderIframeSubRoute =
    pathname.startsWith("/admin/header-iframe/") && pathname !== "/admin/header-iframe";
  const isSidebarIframeSubRoute =
    pathname.startsWith("/admin/sidebar-iframe/") && pathname !== "/admin/sidebar-iframe";

  // For iframe error/not-found sub-routes, return children directly without AdminLayoutClient wrapper
  if (isHeaderIframeSubRoute || isSidebarIframeSubRoute) {
    return <>{children}</>;
  }

  // Check layout parameter from URL (for backward compatibility)
  const pathnameParts = pathname.split("?");
  const cleanPathname = pathnameParts[0];
  const searchParams = new URLSearchParams(pathnameParts[1] || "");
  const layout = searchParams.get("layout");

  // Exempt header-iframe, sidebar-iframe, and pages-result pages (they're meant to be embedded)
  const isHeaderIframePage = cleanPathname === "/admin/header-iframe";
  const isSidebarIframePage = cleanPathname === "/admin/sidebar-iframe";
  const isPagesResultPage = cleanPathname === "/admin/pages-result";

  // Header-iframe, sidebar-iframe, and pages-result pages should skip layout wrapper
  // They have their own layouts and are meant to be embedded
  if (isHeaderIframePage || isSidebarIframePage || isPagesResultPage) {
    return <>{children}</>;
  }

  const appSettings = await getAppSettings();
  const customDomainUrl = getCrunchyConeCustomDomainUrl();
  const deploymentsUrl = getCrunchyConeDeploymentsUrl();
  const hidePublishButton = isPlatformEnvironment();

  // Use legacy layout only if explicitly requested (for backward compatibility)
  if (layout === "legacy") {
    return (
      <AdminLayoutClient
        currentUser={currentUser}
        defaultTheme="light"
        appName={appSettings.appName}
        appLogoUrl={appSettings.appLogoUrl}
        projectFolderName={projectFolderName}
        customDomainUrl={customDomainUrl}
        deploymentsUrl={deploymentsUrl}
        hidePublishButton={hidePublishButton}
      >
        {children}
      </AdminLayoutClient>
    );
  }

  // Default: Use new flattened layout (no iframes, single React tree)
  return (
    <AdminFlattenedLayoutClient
      currentUser={currentUser}
      defaultTheme="dark"
      appName={appSettings.appName}
      appLogoUrl={appSettings.appLogoUrl}
      projectFolderName={projectFolderName}
      customDomainUrl={customDomainUrl}
      deploymentsUrl={deploymentsUrl}
      hidePublishButton={hidePublishButton}
    >
      {children}
    </AdminFlattenedLayoutClient>
  );
}
