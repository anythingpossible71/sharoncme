"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { usePathname } from "next/navigation";
import { defaultNavigationItems } from "@/components/admin/AdminSidebar";
import { getBreadcrumbFromNavigation } from "@/lib/admin/breadcrumb-utils";

interface StorageLayoutProps {
  children: React.ReactNode;
}

export function StorageLayout({ children }: StorageLayoutProps) {
  const pathname = usePathname();

  // Derive breadcrumb from navigation structure (dynamic, not hardcoded)
  const { sectionName, sectionHref, subsectionName, subsectionHref } = getBreadcrumbFromNavigation(
    defaultNavigationItems,
    pathname
  );

  // No action buttons in breadcrumb - they're now positioned in the panels themselves
  const getActionButtons = () => {
    return null;
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        sectionName={sectionName}
        sectionHref={sectionHref}
        subsectionName={subsectionName}
        subsectionHref={subsectionHref}
        actionButtons={getActionButtons()}
      />

      {children}
    </div>
  );
}
