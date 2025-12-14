"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { DebugBubble } from "@/components/DebugBubble";
import { AdminBackBubble } from "@/components/AdminBackBubble";

function DebugBubbleWrapper() {
  return <DebugBubble />;
}

function AdminBackBubbleWrapper() {
  return <AdminBackBubble />;
}

export function ConditionalDebugBubble() {
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith("/admin");
  const isAppDetailsIframePage = pathname === "/admin/app-details-iframe";
  const isDevBuildProgressIframePage = pathname === "/admin/dev-build-progress-iframe";
  const isDevPublishDialogPage = pathname === "/admin/dev-publish-dialog";
  const isHeaderIframePage = pathname === "/admin/header-iframe";
  const isSidebarIframePage = pathname === "/admin/sidebar-iframe";
  const isMockRoute =
    pathname.startsWith("/dev-") ||
    pathname.startsWith("/backups") ||
    pathname.startsWith("/add-domain");

  // Show admin back bubble on admin routes (except app-details-iframe, dev-build-progress-iframe, dev-publish-dialog, header-iframe, and sidebar-iframe)
  if (
    isAdminRoute &&
    !isAppDetailsIframePage &&
    !isDevBuildProgressIframePage &&
    !isDevPublishDialogPage &&
    !isHeaderIframePage &&
    !isSidebarIframePage
  ) {
    return (
      <Suspense fallback={null}>
        <AdminBackBubbleWrapper />
      </Suspense>
    );
  }

  // Don't render debug bubble on mock routes, header-iframe page, or sidebar-iframe page
  if (isMockRoute || isHeaderIframePage || isSidebarIframePage) {
    return null;
  }

  // Show regular debug bubble on app routes
  return (
    <Suspense fallback={null}>
      <DebugBubbleWrapper />
    </Suspense>
  );
}
