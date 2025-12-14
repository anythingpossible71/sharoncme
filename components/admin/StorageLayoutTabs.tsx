"use client";

import { useState, useEffect } from "react";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminDocumentationSection } from "@/components/admin/AdminDocumentationSection";
import { usePathname } from "next/navigation";
import { Button } from "@/components/admin-ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/admin-ui/tooltip";
import { HelpCircle } from "lucide-react";
import { defaultNavigationItems } from "@/components/admin/AdminSidebar";
import { getBreadcrumbFromNavigation } from "@/lib/admin/breadcrumb-utils";

interface StorageLayoutTabsProps {
  children: React.ReactNode;
  activeTab?: string;
  tabsComponent?: React.ReactNode;
}

export function StorageLayoutTabs({
  children,
  activeTab = "media",
  tabsComponent,
}: StorageLayoutTabsProps) {
  const pathname = usePathname();
  const [showMediaDoc, setShowMediaDoc] = useState(false);
  const [showProviderDoc, setShowProviderDoc] = useState(false);
  const [showMediaHoverAnimation, setShowMediaHoverAnimation] = useState(false);

  // Derive breadcrumb from navigation structure (dynamic, not hardcoded)
  const { sectionName, sectionHref, subsectionName, subsectionHref } = getBreadcrumbFromNavigation(
    defaultNavigationItems,
    pathname
  );

  useEffect(() => {
    if (activeTab === "media" && !showMediaDoc) {
      const timer = setTimeout(() => {
        setShowMediaHoverAnimation(true);
        setTimeout(() => {
          setShowMediaHoverAnimation(false);
        }, 1000);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [activeTab, showMediaDoc]);

  // Get left action buttons (help icon) for breadcrumb
  const getLeftActionButtons = () => {
    if (pathname.includes("/storage")) {
      if (activeTab === "media" && !showMediaDoc) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMediaDoc(true)}
                  className={`px-0 hover:bg-transparent translate-y-[1px] transition-colors duration-1000 ${
                    showMediaHoverAnimation ? "bg-accent text-accent-foreground" : ""
                  }`}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Media management</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      if (activeTab === "provider" && !showProviderDoc) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProviderDoc(true)}
                  className="px-0 hover:bg-transparent translate-y-[1px]"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Storage provider configuration</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    }
    return null;
  };

  // Get action buttons for breadcrumb - show tabs if provided
  const getActionButtons = () => {
    return tabsComponent || null;
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        sectionName={sectionName}
        sectionHref={sectionHref}
        subsectionName={subsectionName}
        subsectionHref={subsectionHref}
        leftActionButtons={getLeftActionButtons()}
        actionButtons={getActionButtons()}
      />

      {/* Documentation Section */}
      {pathname.includes("/storage") && activeTab === "media" && showMediaDoc && (
        <AdminDocumentationSection
          title="Media management"
          description="Upload and manage files for your application. Files can be stored locally or in cloud storage providers like AWS S3, DigitalOcean Spaces, Azure Blob Storage, Google Cloud Storage, or CrunchyCone. You can organize files, set visibility (public/private), and manage storage settings."
          promptExamples={[
            "Upload a new image file",
            "Make all uploaded files public",
            "Delete files older than 30 days",
            "Show me all files in the storage",
          ]}
          defaultExpanded={true}
          onToggle={(isExpanded) => setShowMediaDoc(isExpanded)}
        />
      )}

      {pathname.includes("/storage") && activeTab === "provider" && showProviderDoc && (
        <AdminDocumentationSection
          title="Storage provider configuration"
          description="Configure your storage provider settings. Choose from multiple storage providers like LocalStorage, AWS S3, DigitalOcean Spaces, Azure Blob Storage, Google Cloud Storage, or CrunchyCone. Each provider requires specific configuration and environment variables. Test your storage configuration to ensure files are being stored correctly."
          promptExamples={[
            "Configure AWS S3 storage provider",
            "Test the storage configuration",
            "Show me the required environment variables for DigitalOcean Spaces",
            "Switch to Google Cloud Storage provider",
          ]}
          defaultExpanded={true}
          onToggle={(isExpanded) => setShowProviderDoc(isExpanded)}
        />
      )}

      {children}
    </div>
  );
}
