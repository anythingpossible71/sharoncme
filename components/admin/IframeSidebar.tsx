"use client";

import { usePathname, useRouter } from "next/navigation";
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
  Stamp,
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

interface IframeSidebarProps {
  navigationItems?: NavigationItem[];
  currentUser?: User | null;
  appName?: string;
  customDomainUrl?: string | null;
  deploymentsUrl?: string | null;
}

export function IframeSidebar({
  navigationItems = defaultNavigationItems,
  currentUser: _currentUser,
  appName: _appName,
  customDomainUrl,
  deploymentsUrl,
}: IframeSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [activePopoverUrl, setActivePopoverUrl] = useState<string | null>(null);
  const [activeAdminPageUrl, setActiveAdminPageUrl] = useState<string | null>(null);
  const [isInIframe, setIsInIframe] = useState(false);

  // Check if we're in an iframe
  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

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

  // Listen for popover URL and admin page URL changes from parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "POPOVER_URL_CHANGED") {
        setActivePopoverUrl(event.data.url);
      }
      if (event.data.type === "ADMIN_PAGE_URL_CHANGED") {
        setActiveAdminPageUrl(event.data.url);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const isActive = (href: string, exact = false) => {
    // Check if this href matches the active admin page URL (from iframe)
    if (activeAdminPageUrl) {
      const url = new URL(activeAdminPageUrl, window.location.origin);
      const pagePath = url.pathname;
      if (exact) {
        if (pagePath === href) return true;
      } else {
        // Precise matching: exact match or sub-path (not partial word match)
        if (pagePath === href || pagePath.startsWith(href + "/")) return true;
      }
    }

    // Check if this href matches the active popover URL
    if (activePopoverUrl === href) {
      return true;
    }

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

  // Auto-expand parent category when a sub-page is active
  useEffect(() => {
    const itemsToExpand: string[] = [];

    filteredNavigationItems.forEach((item) => {
      if (item.submenu && hasVisibleSubmenuItems(item)) {
        // Check if any visible submenu item matches the current path
        const hasActiveChild = getVisibleSubmenuItems(item).some((subitem) =>
          isActive(subitem.href)
        );
        if (hasActiveChild) {
          itemsToExpand.push(item.href);
        }
      }
    });

    setExpandedItems(itemsToExpand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    );
  };

  // Check if item is manually expanded (no auto-expansion based on active child)
  const shouldExpand = (item: NavigationItem) => {
    if (!item.submenu) return false;
    // Only allow expansion if there are visible submenu items
    if (!hasVisibleSubmenuItems(item)) return false;
    return expandedItems.includes(item.href);
  };

  // Check if main item should be highlighted (only exact match for parent items)
  const isMainItemActive = (item: NavigationItem) => {
    // Always use exact match - parent items only highlight when directly accessed
    return isActive(item.href, true);
  };

  return (
    <aside className="w-full h-full flex flex-col bg-background">
      <nav className="flex flex-col gap-1 px-2 py-4 pb-[20px] flex-1 overflow-y-auto min-h-0 w-full">
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

                        const handleSubmenuClick = () => {
                          // Check if it's an admin page (not external)
                          const isAdminPage = subitem.href.startsWith("/admin") && !isExternalLink;

                          if (isAdminPage) {
                            if (isInIframe) {
                              // Send message to parent to open popover (iframe context)
                              if (window.parent) {
                                window.parent.postMessage(
                                  {
                                    type: "OPEN_ADMIN_PAGE",
                                    url: subitem.href,
                                  },
                                  window.location.origin
                                );
                              }
                            } else {
                              // Direct navigation (flattened layout is now default)
                              router.push(subitem.href);
                            }
                          } else {
                            // External links - open in new tab
                            window.open(subitem.href, "_blank", "noopener,noreferrer");
                          }
                          // Close all expanded submenus when clicking other items
                          setExpandedItems([]);
                        };

                        return (
                          <Button
                            key={subitem.href}
                            variant={subActive ? "secondary" : "ghost"}
                            className="w-full justify-start gap-3 text-sm px-2 py-[calc(0.375rem-2px)]"
                            size="sm"
                            onClick={handleSubmenuClick}
                          >
                            <SubIcon className="h-3.5 w-3.5" />
                            <span>{subitem.label}</span>
                            {isExternalLink && <ExternalLink className="h-3.5 w-3.5 ml-auto" />}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {(() => {
                    // Check if it's an admin page (not external)
                    const isAdminPage =
                      item.href.startsWith("/admin") &&
                      !item.href.startsWith("http://") &&
                      !item.href.startsWith("https://") &&
                      item.href !== "/admin/versions-history" &&
                      item.href !== "/admin/custom-domain";

                    const handleClick = () => {
                      if (isAdminPage) {
                        if (isInIframe) {
                          // Send message to parent to open popover (iframe context)
                          if (window.parent) {
                            window.parent.postMessage(
                              {
                                type: "OPEN_ADMIN_PAGE",
                                url: item.href,
                              },
                              window.location.origin
                            );
                          }
                        } else {
                          // Direct navigation (flattened layout is now default)
                          router.push(item.href);
                        }
                      } else {
                        // External links - open in new tab
                        window.open(item.href, "_blank", "noopener,noreferrer");
                      }
                      // Close all expanded submenus when clicking other items
                      setExpandedItems([]);
                    };

                    return (
                      <Button
                        variant={active ? "secondary" : "ghost"}
                        className="w-full justify-start gap-3 px-2 py-[calc(0.5rem-2px)]"
                        onClick={handleClick}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {(item.href === "/admin/versions-history" ||
                          item.href === "/admin/custom-domain" ||
                          item.href.startsWith("http://") ||
                          item.href.startsWith("https://")) && <ExternalLink className="h-4 w-4" />}
                      </Button>
                    );
                  })()}
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
