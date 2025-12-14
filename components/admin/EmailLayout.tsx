"use client";

import { useState, useEffect } from "react";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminDocumentationSection } from "@/components/admin/AdminDocumentationSection";
import { usePathname } from "next/navigation";
import { Button } from "@/components/admin-ui/button";
import { HelpCircle } from "lucide-react";
import { defaultNavigationItems } from "@/components/admin/AdminSidebar";
import { getBreadcrumbFromNavigation } from "@/lib/admin/breadcrumb-utils";

interface EmailLayoutProps {
  children: React.ReactNode;
}

export function EmailLayout({ children }: EmailLayoutProps) {
  const pathname = usePathname();
  const [showTemplatesDoc, setShowTemplatesDoc] = useState(true);
  const [showTemplatesHoverAnimation, setShowTemplatesHoverAnimation] = useState(false);

  // Derive breadcrumb from navigation structure (dynamic, not hardcoded)
  const { sectionName, sectionHref, subsectionName, subsectionHref } = getBreadcrumbFromNavigation(
    defaultNavigationItems,
    pathname
  );

  // Trigger hover animation on page load
  useEffect(() => {
    if (pathname.includes("/templates") && !showTemplatesDoc) {
      const timer = setTimeout(() => {
        setShowTemplatesHoverAnimation(true);
        setTimeout(() => {
          setShowTemplatesHoverAnimation(false);
        }, 1000);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [pathname, showTemplatesDoc]);

  // Get action buttons for breadcrumb
  const getActionButtons = () => {
    if (pathname.includes("/templates") && !showTemplatesDoc) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTemplatesDoc(true)}
          className={`flex items-center gap-2 transition-colors duration-1000 ${
            showTemplatesHoverAnimation ? "bg-accent text-accent-foreground" : ""
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          Email templates
        </Button>
      );
    }
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

      {/* Documentation Section */}
      {pathname.includes("/templates") && showTemplatesDoc && (
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

      {children}
    </div>
  );
}
