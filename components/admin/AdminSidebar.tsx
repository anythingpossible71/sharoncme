"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/admin-ui/button";
import { Separator } from "@/components/admin-ui/separator";
import { IframeDialog } from "@/components/admin-ui/iframe-dialog";
import {
  LayoutDashboard,
  Users,
  Settings as SettingsIcon,
  Shield,
  Database,
  Upload,
  Mail,
  Terminal,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Fingerprint,
  Globe,
  FolderKanban,
  CreditCard,
  HelpCircle,
  Rocket,
  Route,
  IdCard,
  Palette,
  Wrench,
  ScanSearch,
  SquareDashedMousePointer,
  Stamp,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import type { User } from "@prisma/client";

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  submenu?: {
    href: string;
    label: string;
    icon: LucideIcon;
  }[];
  separator?: boolean;
  hidden?: boolean; // If true, item is functional but not visible in sidebar
  onClick?: (e: React.MouseEvent) => void; // Custom click handler
};

export const defaultNavigationItems: NavigationItem[] = [
  {
    href: "/admin/pages-and-components",
    label: "Pages & Components",
    icon: Stamp,
  },
  {
    href: "/admin/theme",
    label: "Theme",
    icon: Palette,
  },
  {
    href: "/admin/useful-commands",
    label: "Useful commands",
    icon: Terminal,
  },
  {
    href: "/admin/storage",
    label: "Storage",
    icon: Upload,
    separator: true,
  },
  {
    href: "/admin/database",
    label: "Database",
    icon: Database,
  },
  {
    href: "/admin/authentication",
    label: "Authentication",
    icon: Users,
  },
  {
    href: "/admin/email",
    label: "Email",
    icon: Mail,
  },
  {
    href: "/admin/deployment",
    label: "Deployment",
    icon: Rocket,
    submenu: [
      {
        href: "/admin/app-details",
        label: "App Details",
        icon: IdCard,
      },
      {
        href: "/admin/custom-domain",
        label: "Custom Domain",
        icon: Globe,
      },
      {
        href: "/admin/versions-history",
        label: "Version History",
        icon: Route,
      },
    ],
  },
  {
    href: "#visual-edits",
    label: "Visual edits",
    icon: SquareDashedMousePointer,
    onClick: (e) => {
      e.preventDefault();
      const isCursor = navigator.userAgent.includes("Cursor");
      if (!isCursor) {
        alert("Visual edits work only in Cursor browser tab");
        return;
      }
      // Get current iframe URL from any iframe on the page, or default to root
      let iframeUrl = "/";
      const iframe = document.querySelector("iframe[src]");
      if (iframe && iframe instanceof HTMLIFrameElement) {
        iframeUrl = iframe.src || "/";
      }
      // Handle both relative and absolute URLs
      let targetUrl;
      if (iframeUrl.startsWith("http://") || iframeUrl.startsWith("https://")) {
        // Full URL - extract pathname and search, then add our param
        const url = new URL(iframeUrl);
        url.searchParams.set("mode", "visual-edits");
        targetUrl = url.toString();
      } else {
        // Relative URL - construct properly
        const url = new URL(iframeUrl, window.location.origin);
        url.searchParams.set("mode", "visual-edits");
        targetUrl = url.pathname + url.search;
      }
      window.open(targetUrl, "_blank");
    },
  },
  {
    href: "/admin/storage/configuration",
    label: "Storage Settings",
    icon: Upload,
    hidden: true,
  },
  {
    href: "/admin/email-configuration",
    label: "Email Configuration",
    icon: Mail,
    hidden: true,
  },
  {
    href: "/admin/connected-services",
    label: "Connected Services",
    icon: Route,
    separator: true,
  },
  {
    href: "/admin/environment",
    label: "Environment Variables",
    icon: Terminal,
  },
  {
    href: "/admin/components-settings",
    label: "Components settings",
    icon: LayoutDashboard,
    separator: true,
    submenu: [
      {
        href: "/admin/components-settings/team",
        label: "Team",
        icon: Users,
      },
    ],
  },
  {
    href: "/admin/tools",
    label: "Builder Tools",
    icon: Wrench,
    submenu: [
      {
        href: "/admin/tools/icons-search",
        label: "Icon Search",
        icon: ScanSearch,
      },
    ],
  },
];

export const mockNavigationItems: NavigationItem[] = [
  {
    href: "/admin/my-projects",
    label: "My Projects",
    icon: FolderKanban,
  },
  {
    href: "/admin/account",
    label: "Account & Billing",
    icon: CreditCard,
  },
  {
    href: "/admin/faq",
    label: "FAQs",
    icon: HelpCircle,
  },
  {
    href: "/admin/builder-settings",
    label: "Builder Settings",
    icon: SettingsIcon,
  },
];

interface AdminSidebarProps {
  navigationItems?: NavigationItem[];
  currentUser?: User | null;
  appName?: string;
  projectFolderName?: string;
  customDomainUrl?: string | null;
  deploymentsUrl?: string | null;
}

export function AdminSidebar({
  navigationItems = defaultNavigationItems,
  currentUser: _currentUser,
  appName,
  projectFolderName,
  customDomainUrl,
  deploymentsUrl,
}: AdminSidebarProps) {
  const pathname = usePathname();

  // Helper to check if path matches
  const isActivePath = (href: string, currentPath: string, exact = false) => {
    if (exact) {
      return currentPath === href;
    }
    return currentPath === href || currentPath.startsWith(href + "/");
  };

  // Calculate initial expanded items based on current pathname
  const getExpandedItemsForPath = (currentPath: string) => {
    const itemsToExpand: string[] = [];
    navigationItems.forEach((item) => {
      if (item.submenu && !item.hidden) {
        const hasActiveChild = item.submenu.some((subitem) =>
          isActivePath(subitem.href, currentPath)
        );
        if (hasActiveChild) {
          itemsToExpand.push(item.href);
        }
      }
    });
    return itemsToExpand;
  };

  // Initialize with correct expanded state based on current pathname
  const [expandedItems, setExpandedItems] = useState<string[]>(() =>
    getExpandedItemsForPath(pathname)
  );

  // Filter navigation items based on customDomainUrl and deploymentsUrl
  const filteredNavigationItems = navigationItems
    .map((item) => {
      // Update custom domain href in submenu if URL is available
      if (item.submenu) {
        item.submenu = item.submenu.map((subItem) => {
          if (subItem.href === "/admin/custom-domain" && customDomainUrl) {
            return { ...subItem, href: customDomainUrl };
          }
          // Update versions-history href in submenu if deployments URL is available
          if (subItem.href === "/admin/versions-history" && deploymentsUrl) {
            return { ...subItem, href: deploymentsUrl };
          }
          return subItem;
        });
      }
      // Update custom domain href if URL is available (for backward compatibility)
      if (item.href === "/admin/custom-domain" && customDomainUrl) {
        return { ...item, href: customDomainUrl };
      }
      // Update versions-history href if deployments URL is available (for backward compatibility)
      if (item.href === "/admin/versions-history" && deploymentsUrl) {
        return { ...item, href: deploymentsUrl };
      }
      return item;
    })
    .filter((item) => {
      // Hide hidden items (they're functional but not visible)
      if (item.hidden) {
        return false;
      }
      // Filter submenu items
      if (item.submenu) {
        item.submenu = item.submenu.filter((subItem) => {
          // Hide custom domain if no URL is available
          if (subItem.href === "/admin/custom-domain" && !customDomainUrl) {
            return false;
          }
          // Hide versions-history if no deployments URL is available
          if (subItem.href === "/admin/versions-history" && !deploymentsUrl) {
            return false;
          }
          return true;
        });
      }
      // Hide custom domain if no URL is available (for backward compatibility)
      if (item.href === "/admin/custom-domain" && !customDomainUrl) {
        return false;
      }
      // Hide versions-history if no deployments URL is available (for backward compatibility)
      if (item.href === "/admin/versions-history" && !deploymentsUrl) {
        return false;
      }
      return true;
    });

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    // Precise matching: exact match or sub-path (not partial word match)
    // This prevents /admin/components from matching /admin/components-settings
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Check if a submenu item should be visible (not hidden)
  const isSubmenuItemVisible = (subitem: NonNullable<NavigationItem["submenu"]>[number]) => {
    // Check if this submenu item is also a top-level item that's hidden
    const topLevelItem = navigationItems.find((item) => item.href === subitem.href);
    return !topLevelItem?.hidden;
  };

  // Get visible submenu items for a parent
  const getVisibleSubmenuItems = (item: NavigationItem) => {
    if (!item.submenu) return [];
    return item.submenu.filter(isSubmenuItemVisible);
  };

  // Check if item has any visible submenu items
  const hasVisibleSubmenuItems = (item: NavigationItem) => {
    return getVisibleSubmenuItems(item).length > 0;
  };

  // Auto-expand parent category when navigating to a sub-page
  useEffect(() => {
    // Find which parent items should be expanded based on current path
    const neededExpansions: string[] = [];

    filteredNavigationItems.forEach((item) => {
      if (item.submenu && hasVisibleSubmenuItems(item)) {
        const hasActiveChild = getVisibleSubmenuItems(item).some((subitem) =>
          isActive(subitem.href)
        );
        if (hasActiveChild) {
          neededExpansions.push(item.href);
        }
      }
    });

    // Only update if we need to add expansions that aren't already there
    setExpandedItems((prev) => {
      const newItems = neededExpansions.filter((item) => !prev.includes(item));
      if (newItems.length > 0) {
        return [...prev, ...newItems];
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    );
  };

  // Check if item should be expanded - either manually or because a child is active
  const shouldExpand = (item: NavigationItem) => {
    if (!item.submenu) return false;
    // Only allow expansion if there are visible submenu items
    if (!hasVisibleSubmenuItems(item)) return false;

    // Expand if manually expanded via state
    if (expandedItems.includes(item.href)) return true;

    // Also expand if any visible child is currently active (auto-expand)
    const hasActiveChild = getVisibleSubmenuItems(item).some((subitem) => isActive(subitem.href));
    return hasActiveChild;
  };

  // Check if main item should be highlighted (only exact match for parent items)
  const isMainItemActive = (item: NavigationItem) => {
    // Always use exact match - parent items only highlight when directly accessed
    return isActive(item.href, true);
  };

  return (
    <aside className="w-64 h-full bg-background flex flex-col">
      {(appName || projectFolderName) && (
        <div className="px-3 pt-4 pb-2 border-b border-border">
          {appName && (
            <span className="font-semibold text-sm text-foreground truncate block">{appName}</span>
          )}
          {projectFolderName && (
            <span className="text-xs text-muted-foreground truncate block mt-0.5">
              projects/{projectFolderName}
            </span>
          )}
        </div>
      )}
      <nav className="flex flex-col gap-1 px-2 py-4 pb-[20px] flex-1 overflow-y-auto">
        {filteredNavigationItems.map((item) => {
          const Icon = item.icon;
          const active = isMainItemActive(item);
          const expanded = shouldExpand(item);

          return (
            <div key={item.href}>
              {/* Add separator if needed */}
              {item.separator && <Separator className="my-2 bg-muted-foreground/40" />}

              {item.submenu && hasVisibleSubmenuItems(item) ? (
                <>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 px-2 py-[calc(0.5rem-2px)]"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleExpanded(item.href);
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    ) : (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </Button>
                  {expanded && (
                    <div className="ml-4 mt-1 flex flex-col gap-1">
                      {getVisibleSubmenuItems(item).map((subitem) => {
                        const SubIcon = subitem.icon;
                        const subActive = isActive(subitem.href);
                        const isExternalLink =
                          subitem.href === "/admin/versions-history" ||
                          subitem.href === "/admin/custom-domain" ||
                          subitem.href.startsWith("http://") ||
                          subitem.href.startsWith("https://");

                        return (
                          <Link
                            key={subitem.href}
                            href={subitem.href}
                            target={isExternalLink ? "_blank" : undefined}
                            rel={isExternalLink ? "noopener noreferrer" : undefined}
                          >
                            <Button
                              variant={subActive ? "secondary" : "ghost"}
                              className="w-full justify-start gap-3 text-sm px-2 py-[calc(0.375rem-2px)]"
                              size="sm"
                            >
                              <SubIcon className="h-3.5 w-3.5" />
                              <span>{subitem.label}</span>
                              {isExternalLink && <ExternalLink className="h-3.5 w-3.5 ml-auto" />}
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {item.onClick ? (
                    <Button
                      variant={active ? "secondary" : "ghost"}
                      className="w-full justify-start gap-3 px-2 py-[calc(0.5rem-2px)]"
                      onClick={(e) => {
                        // Close all expanded submenus when clicking other items
                        setExpandedItems([]);
                        item.onClick?.(e);
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{item.label}</span>
                    </Button>
                  ) : (
                    <Link
                      href={item.href}
                      target={
                        item.href === "/admin/versions-history" ||
                        item.href.startsWith("http://") ||
                        item.href.startsWith("https://")
                          ? "_blank"
                          : undefined
                      }
                      rel={
                        item.href === "/admin/versions-history" ||
                        item.href.startsWith("http://") ||
                        item.href.startsWith("https://")
                          ? "noopener noreferrer"
                          : undefined
                      }
                    >
                      <Button
                        variant={active ? "secondary" : "ghost"}
                        className="w-full justify-start gap-3 px-2 py-[calc(0.5rem-2px)]"
                        onClick={() => {
                          // Close all expanded submenus when clicking other items
                          setExpandedItems([]);
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {(item.href === "/admin/versions-history" ||
                          item.href === "/admin/custom-domain" ||
                          item.href.startsWith("http://") ||
                          item.href.startsWith("https://")) && <ExternalLink className="h-4 w-4" />}
                      </Button>
                    </Link>
                  )}
                </>
              )}
              {/* Add Publish App button below Deployment when versions-history is visible */}
              {item.href === "/admin/deployment" &&
                item.submenu?.some((sub) => sub.href === "/admin/versions-history") && (
                  <div className="mt-2 px-2">
                    <IframeDialog
                      trigger={
                        <Button variant="default" size="sm" className="w-full">
                          <Rocket className="h-4 w-4 mr-2" />
                          Publish App
                        </Button>
                      }
                      src="/admin/app-details-iframe"
                      title="Publish App"
                      width={800}
                      height={600}
                    />
                  </div>
                )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
