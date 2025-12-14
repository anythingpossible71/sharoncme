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

interface EmailLayoutTabsProps {
  children: React.ReactNode;
  activeTab?: string;
  tabsComponent?: React.ReactNode;
}

export function EmailLayoutTabs({
  children,
  activeTab = "templates",
  tabsComponent,
}: EmailLayoutTabsProps) {
  const pathname = usePathname();
  const [showTemplatesDoc, setShowTemplatesDoc] = useState(false);
  const [showProviderDoc, setShowProviderDoc] = useState(false);
  const [showTemplatesHoverAnimation, setShowTemplatesHoverAnimation] = useState(false);

  // Derive breadcrumb from navigation structure (dynamic, not hardcoded)
  const { sectionName, sectionHref, subsectionName, subsectionHref } = getBreadcrumbFromNavigation(
    defaultNavigationItems,
    pathname
  );

  useEffect(() => {
    if (activeTab === "templates" && !showTemplatesDoc) {
      const timer = setTimeout(() => {
        setShowTemplatesHoverAnimation(true);
        setTimeout(() => {
          setShowTemplatesHoverAnimation(false);
        }, 1000);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [activeTab, showTemplatesDoc]);

  // Get left action buttons (help icon) for breadcrumb
  const getLeftActionButtons = () => {
    if (pathname.includes("/email")) {
      if (activeTab === "templates" && !showTemplatesDoc) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplatesDoc(true)}
                  className={`px-0 hover:bg-transparent translate-y-[1px] transition-colors duration-1000 ${
                    showTemplatesHoverAnimation ? "bg-accent text-accent-foreground" : ""
                  }`}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Email templates</p>
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
                <p>Email provider configuration</p>
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
      {pathname.includes("/email") && activeTab === "templates" && showTemplatesDoc && (
        <AdminDocumentationSection
          title="Email templates"
          description="Below are the email templates currently available in your app. These are transactional emails sent automatically by the system. You can preview how each template looks and customize them as needed. You can also add new templates or create localized versions for different languages."
          promptExamples={[
            "Create a new email template for order confirmation",
            "Add a Spanish version of the verification email template",
            "Create a welcome email template that is sent when a user signs up",
            "Add a German version of the password reset email",
          ]}
          defaultExpanded={true}
          onToggle={(isExpanded) => setShowTemplatesDoc(isExpanded)}
        />
      )}

      {pathname.includes("/email") && activeTab === "provider" && showProviderDoc && (
        <AdminDocumentationSection
          title="Email provider configuration"
          description="Configure your email provider settings. Choose from multiple email providers like SendGrid, Resend, AWS SES, SMTP, or CrunchyCone. Each provider requires specific configuration and environment variables. Test your email configuration to ensure emails are being sent correctly."
          promptExamples={[
            "Configure SendGrid email provider",
            "Test the email configuration",
            "Show me the required environment variables for AWS SES",
            "Switch to Resend email provider",
          ]}
          defaultExpanded={true}
          onToggle={(isExpanded) => setShowProviderDoc(isExpanded)}
        />
      )}

      {children}
    </div>
  );
}
