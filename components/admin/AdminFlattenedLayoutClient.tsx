"use client";

import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";
import { HeaderClone } from "@/components/admin/HeaderClone";
import { IframeSidebar } from "@/components/admin/IframeSidebar";
import type { User } from "@prisma/client";

interface AdminFlattenedLayoutClientProps {
  children: React.ReactNode;
  currentUser: User | null;
  defaultTheme?: string;
  appName?: string;
  appLogoUrl?: string;
  projectFolderName?: string;
  customDomainUrl?: string | null;
  deploymentsUrl?: string | null;
  hidePublishButton?: boolean;
}

export function AdminFlattenedLayoutClient({
  children,
  currentUser,
  defaultTheme = "light",
  appName,
  appLogoUrl,
  projectFolderName,
  customDomainUrl,
  deploymentsUrl,
  hidePublishButton,
}: AdminFlattenedLayoutClientProps) {
  return (
    <AdminThemeProvider defaultTheme={defaultTheme}>
      <div
        className="flex flex-col h-screen"
        style={{ backgroundColor: "hsl(var(--admin-background))" }}
      >
        {/* Header - using inline HeaderClone component */}
        <div
          className="m-0 p-0 min-h-[60px] h-[60px] w-full flex flex-col"
          style={{ backgroundColor: "hsl(var(--admin-background))" }}
        >
          <HeaderClone
            appName={appName}
            appLogoUrl={appLogoUrl}
            currentUser={currentUser}
            activeTab="dashboard" // Admin template pages always show dashboard tab
            hidePublishButton={hidePublishButton}
          />
        </div>

        {/* Main area */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar - copied from sidebar-iframe/page.tsx - ALWAYS VISIBLE */}
          <div className="w-[258px] flex-shrink-0">
            <div className="h-full w-full" style={{ margin: 0, padding: 0 }}>
              <IframeSidebar
                appName={appName}
                projectFolderName={projectFolderName}
                currentUser={currentUser}
                customDomainUrl={customDomainUrl}
                deploymentsUrl={deploymentsUrl}
              />
            </div>
          </div>

          {/* Content - styled like admin content iframe with rounded corners, border, and padding */}
          <div
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
            style={{ backgroundColor: "hsl(var(--admin-background))" }}
          >
            <div
              className="rounded-[10px] overflow-y-auto overflow-x-hidden flex-1 flex flex-col"
              style={{
                margin: "0px 10px 10px 10px",
                height: "calc(100% - 10px)",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                borderTop: "none",
                borderRight: "1px solid rgba(0, 0, 0, 0.08)",
                borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                borderLeft: "none",
                boxShadow: "none",
                borderRadius: 10,
                backgroundColor: "hsl(var(--admin-card))",
              }}
            >
              <main
                className="flex-1 w-full px-4 lg:px-[30px] pt-6"
                style={{ backgroundColor: "hsl(var(--admin-card))" }}
              >
                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
    </AdminThemeProvider>
  );
}
