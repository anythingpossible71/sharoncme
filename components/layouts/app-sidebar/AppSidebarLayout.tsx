"use client";

import { useState } from "react";
import { AppSidebarHeader } from "./AppSidebarHeader";
import { AppSidebar } from "./AppSidebar";
import { appNavigation } from "@/config/app-navigation";
import type { NavGroup } from "@/config/app-navigation";

interface AppSidebarLayoutProps {
  children: React.ReactNode;
  appName?: string;
  userName?: string;
  userEmail?: string;
  userImage?: string;
  navigationGroups?: NavGroup[];
  onSignOut?: () => void;
}

export function AppSidebarLayout({
  children,
  appName = "App",
  userName,
  userEmail,
  userImage,
  navigationGroups = appNavigation,
  onSignOut,
}: AppSidebarLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <AppSidebarHeader
          appName={appName}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
          onSignOut={onSignOut}
        />
      </div>

      {/* Content Area with Sidebar and Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - Always visible on large screens */}
        <div className="hidden lg:block flex-shrink-0">
          <AppSidebar navigationGroups={navigationGroups} />
        </div>

        {/* Mobile Sidebar - Toggleable overlay */}
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 w-64 z-50 lg:hidden top-14">
              <AppSidebar navigationGroups={navigationGroups} />
            </div>
          </>
        )}

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-4 py-6 lg:container lg:mx-auto lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
