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

interface AuthenticationLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  tabsComponent?: React.ReactNode;
}

export function AuthenticationLayout({
  children,
  activeTab = "users",
  tabsComponent,
}: AuthenticationLayoutProps) {
  const pathname = usePathname();
  const [showUsersDoc, setShowUsersDoc] = useState(false);
  const [showRolesDoc, setShowRolesDoc] = useState(false);
  const [showAuthDoc, setShowAuthDoc] = useState(false);
  const [showRolesHoverAnimation, setShowRolesHoverAnimation] = useState(false);

  // Derive breadcrumb from navigation structure (dynamic, not hardcoded)
  const { sectionName, sectionHref, subsectionName, subsectionHref } = getBreadcrumbFromNavigation(
    defaultNavigationItems,
    pathname
  );

  useEffect(() => {
    if (activeTab === "roles" && !showRolesDoc) {
      const timer = setTimeout(() => {
        setShowRolesHoverAnimation(true);
        setTimeout(() => {
          setShowRolesHoverAnimation(false);
        }, 1000);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [activeTab, showRolesDoc]);

  // Get left action buttons (help icon) for breadcrumb
  const getLeftActionButtons = () => {
    if (pathname.includes("/authentication")) {
      if (activeTab === "users" && !showUsersDoc) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUsersDoc(true)}
                  className="px-0 hover:bg-transparent translate-y-[1px]"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>How to manage users</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      if (activeTab === "roles" && !showRolesDoc) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRolesDoc(true)}
                  className={`px-0 hover:bg-transparent translate-y-[1px] transition-colors duration-1000 ${
                    showRolesHoverAnimation ? "bg-accent text-accent-foreground" : ""
                  }`}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Managing user roles</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      if (activeTab === "auth" && !showAuthDoc) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuthDoc(true)}
                  className="px-0 hover:bg-transparent translate-y-[1px]"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Authentication settings</p>
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
      {pathname.includes("/authentication") && activeTab === "users" && showUsersDoc && (
        <AdminDocumentationSection
          title="Managing users"
          description="Below is your users table. The app comes ready with two default user roles: Admin and user. You can use the roles tab to add more relevant roles. You can edit users using the add user button or using the dotted menu in the user table. You can also add, remove or edit users directly using prompts. See examples below."
          promptExamples={[
            "Please list all the users in our database",
            "Delete user@email.com from our users list",
            'Add an "Editor" user role',
            "List our admin users",
          ]}
          defaultExpanded={true}
          onToggle={(isExpanded) => setShowUsersDoc(isExpanded)}
        />
      )}

      {pathname.includes("/authentication") && activeTab === "roles" && showRolesDoc && (
        <AdminDocumentationSection
          title="Managing user roles"
          description="User roles enable you to create different user personas. The app comes with two default roles: Admin and users but you can add different user roles. For example if you are creating a blog you might want to have a user type called Editor that would enable specific users to edit posts. You can add a role using the add role button or use prompts. See examples."
          promptExamples={[
            "Add a user role called Editor",
            "List all the users with Editor role",
            "Create an edit post page but ensure that only users with admin or editor roles can access this page",
          ]}
          defaultExpanded={true}
          onToggle={(isExpanded) => setShowRolesDoc(isExpanded)}
        />
      )}

      {pathname.includes("/authentication") && activeTab === "auth" && showAuthDoc && (
        <AdminDocumentationSection
          title="Authentication settings"
          description="Configure your authentication providers and methods. Enable or disable email/password authentication, magic links, and OAuth providers like Google and GitHub. Each provider requires specific configuration and environment variables."
          promptExamples={[
            "Enable Google OAuth authentication",
            "Disable magic link authentication",
            "Show me the required environment variables for GitHub OAuth",
          ]}
          defaultExpanded={true}
          onToggle={(isExpanded) => setShowAuthDoc(isExpanded)}
        />
      )}

      {children}
    </div>
  );
}
