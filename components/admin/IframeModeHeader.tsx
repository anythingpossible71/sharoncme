"use client";

import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/admin-ui/button";
import { getBreadcrumbFromNavigation } from "@/lib/admin/breadcrumb-utils";
import { defaultNavigationItems } from "@/components/admin/IframeSidebar";

export function IframeModeHeader() {
  const pathname = usePathname();
  const { sectionName, subsectionName } = getBreadcrumbFromNavigation(
    defaultNavigationItems,
    pathname
  );

  // Get the last element of breadcrumb (subsection if exists, otherwise section)
  const title = subsectionName || sectionName;

  const handleClose = () => {
    // Send message to parent to close the popover
    if (window.parent) {
      window.parent.postMessage(
        {
          type: "CLOSE_ADMIN_PAGE",
        },
        window.location.origin
      );
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/50 h-[60px] flex items-center justify-between px-4">
      <h1 className="text-lg font-semibold">{title}</h1>
      <Button variant="ghost" size="icon" onClick={handleClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
