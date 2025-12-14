"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar, mockNavigationItems } from "@/components/admin/AdminSidebar";
import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";
import { AdminAppHeader } from "@/components/admin/AdminAppHeader";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useIframeMode } from "@/hooks/use-iframe-mode";
import type { User } from "@prisma/client";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  currentUser: User | null;
  defaultTheme?: string;
  appName?: string;
  appLogoUrl?: string;
  customDomainUrl?: string | null;
  deploymentsUrl?: string | null;
  hidePublishButton?: boolean;
}

export function AdminLayoutClient({
  children,
  currentUser,
  defaultTheme = "light",
  appName,
  appLogoUrl,
  customDomainUrl,
  deploymentsUrl,
  hidePublishButton,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isIframeMode = useIframeMode();

  // Remove body bottom padding when in iframe mode
  useEffect(() => {
    if (isIframeMode) {
      document.body.style.paddingBottom = "0";
      document.body.style.marginBottom = "0";
      return () => {
        document.body.style.paddingBottom = "";
        document.body.style.marginBottom = "";
      };
    }
  }, [isIframeMode]);
  const isVersionsPage = pathname === "/admin/versions-history";
  const isFixedHeaderPage = pathname === "/admin/fixed-header";
  const isMockCCAuthPage = pathname === "/admin/mock-cc-auth";
  const isEmbededVersionsPage = pathname === "/admin/embeded-versions";
  const isDevBuildProgressPage = pathname === "/admin/dev-build-progress";
  const isDevBuildProgressIframePage = pathname === "/admin/dev-build-progress-iframe";
  const isAppDetailsIframePage = pathname === "/admin/app-details-iframe";
  const isAppDetailsPage = pathname === "/admin/app-details";
  const isDevPublishDialogPage = pathname === "/admin/dev-publish-dialog";
  const isManageAppDomainPage = pathname === "/admin/manage-app-domain";
  const isHeaderIframePage = pathname === "/admin/header-iframe";
  const isSidebarIframePage = pathname === "/admin/sidebar-iframe";
  const isMockProjectsPage =
    pathname === "/admin/my-projects" ||
    pathname === "/admin/account" ||
    pathname === "/admin/faq" ||
    pathname === "/admin/builder-settings";

  // Handle iframe mode separately - hide header/sidebar but add proper container with background and padding
  if (isIframeMode) {
    return (
      <AdminThemeProvider defaultTheme={defaultTheme}>
        <div
          className="h-screen flex flex-col overflow-hidden"
          style={{ backgroundColor: "hsl(var(--admin-background))" }}
        >
          {/* Scrollable Main Content with admin theme background and padding */}
          <main
            className="flex-1 overflow-y-auto px-4 lg:container lg:mx-0 lg:px-[30px] pt-6"
            style={{ backgroundColor: "hsl(var(--admin-card))" }}
          >
            {children}
          </main>
        </div>
      </AdminThemeProvider>
    );
  }

  // For mock CC auth page, embeded versions page, dev-build-progress page, dev-build-progress-iframe page, app-details-iframe page, dev-publish-dialog page, and manage-app-domain page, and header-iframe page, and sidebar-iframe page, render without header/sidebar (they have their own full layout)
  if (
    isMockCCAuthPage ||
    isEmbededVersionsPage ||
    isDevBuildProgressPage ||
    isDevBuildProgressIframePage ||
    isAppDetailsIframePage ||
    isDevPublishDialogPage ||
    isManageAppDomainPage ||
    isHeaderIframePage ||
    isSidebarIframePage
  ) {
    return <AdminThemeProvider defaultTheme={defaultTheme}>{children}</AdminThemeProvider>;
  }

  // For mock projects pages, use AdminHeader with mock variant and AdminSidebar with mock navigation
  // Hide header/sidebar in iframe mode
  if (isMockProjectsPage) {
    if (isIframeMode) {
      return (
        <AdminThemeProvider defaultTheme={defaultTheme}>
          <div className="h-screen flex flex-col bg-background overflow-hidden">
            {/* Scrollable Main Content with admin theme background and padding */}
            <main className="flex-1 overflow-y-auto bg-card p-5">{children}</main>
          </div>
        </AdminThemeProvider>
      );
    }

    return (
      <AdminThemeProvider defaultTheme={defaultTheme}>
        <div className="h-screen flex flex-col bg-background overflow-hidden">
          {/* Fixed Header */}
          <div className="flex-shrink-0">
            <AdminHeader
              variant="mock"
              titleText="Crunchy<cone>"
              logoHref="/admin/my-projects"
              sidebarOpen={sidebarOpen}
              onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
              currentUser={currentUser}
            />
          </div>

          {/* Content Area with Fixed Sidebar and Scrollable Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Fixed Left Sidebar - using AdminSidebar with mock navigation items */}
            {sidebarOpen && (
              <div className="hidden lg:block flex-shrink-0">
                <AdminSidebar
                  navigationItems={mockNavigationItems}
                  currentUser={currentUser}
                  appName={appName}
                  customDomainUrl={customDomainUrl}
                  deploymentsUrl={deploymentsUrl}
                />
              </div>
            )}

            {/* Scrollable Main Content */}
            <main className={`flex-1 overflow-y-auto bg-card rounded-tl-[10px] `}>
              {false ? (
                children
              ) : (
                <div className="w-full px-4 py-6 lg:container lg:mx-0 lg:px-[30px]">{children}</div>
              )}
            </main>
          </div>
        </div>
      </AdminThemeProvider>
    );
  }

  return (
    <AdminThemeProvider defaultTheme={defaultTheme}>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Fixed Header - Hidden in iframe mode */}
        {!isIframeMode && (
          <div className="flex-shrink-0">
            {isFixedHeaderPage ? (
              <AdminAppHeader appName={appName} appLogoUrl={appLogoUrl} />
            ) : (
              <AdminHeader
                appName={appName}
                appLogoUrl={appLogoUrl}
                sidebarOpen={sidebarOpen}
                onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                currentUser={currentUser}
                hidePublishButton={hidePublishButton}
              />
            )}
          </div>
        )}

        {/* Content Area with Fixed Sidebar and Scrollable Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Fixed Left Sidebar - Hidden on mobile, fixed-header page, and iframe mode */}
          {!isFixedHeaderPage && !isIframeMode && sidebarOpen && (
            <div className="hidden lg:block flex-shrink-0">
              <AdminSidebar
                currentUser={currentUser}
                appName={appName}
                customDomainUrl={customDomainUrl}
                deploymentsUrl={deploymentsUrl}
              />
            </div>
          )}

          {/* Scrollable Main Content */}
          <main className={`flex-1 overflow-y-auto bg-[hsl(270_25%_98%)] rounded-tl-[10px] `}>
            {isVersionsPage || isFixedHeaderPage ? (
              children
            ) : (
              <div
                className={`w-full px-4 lg:container lg:mx-auto lg:px-[30px] ${
                  isAppDetailsPage ? "pt-6 pb-0" : "py-6"
                }`}
              >
                {children}
              </div>
            )}
          </main>
        </div>
      </div>
    </AdminThemeProvider>
  );
}
