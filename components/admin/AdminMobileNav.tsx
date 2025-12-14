"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/admin-ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/admin-ui/sheet";
import { Separator } from "@/components/admin-ui/separator";
import {
  LayoutDashboard,
  Users,
  Settings,
  Shield,
  Database,
  Upload,
  Mail,
  Terminal,
  Menu,
  Fingerprint,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Home,
  GraduationCap,
  Stamp,
  Globe,
  Rocket,
  Route,
  IdCard,
  Palette,
  Wrench,
  ScanSearch,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

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

const navigationItems: NavigationItem[] = [
  {
    href: "/admin",
    label: "Pages",
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
    href: "/admin/tools",
    label: "Builder Tools",
    icon: Wrench,
    submenu: [
      {
        href: "/admin/components",
        label: "Component Templates",
        icon: LayoutDashboard,
      },
      {
        href: "/admin/tools/icons-search",
        label: "Icon Search",
        icon: ScanSearch,
      },
    ],
  },
  {
    href: "/admin/getting-started",
    label: "Getting Started",
    icon: GraduationCap,
    exact: true,
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
    href: "/admin/versions-history",
    label: "Preview & Publish",
    icon: Rocket,
  },
];

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    );
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

  const shouldExpand = (item: NavigationItem) => {
    if (!item.submenu || !hasVisibleSubmenuItems(item)) return false;
    return (
      expandedItems.includes(item.href) ||
      getVisibleSubmenuItems(item).some((subitem) => isActive(subitem.href))
    );
  };

  const isMainItemActive = (item: NavigationItem) => {
    if (item.submenu) {
      return isActive(item.href, true);
    }
    return isActive(item.href, item.exact);
  };

  // Filter out hidden items
  const visibleNavigationItems = navigationItems.filter((item) => !item.hidden);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="flex flex-col gap-1">
              {visibleNavigationItems.map((item) => {
                const Icon = item.icon;
                const active = isMainItemActive(item);
                const expanded = shouldExpand(item);

                return (
                  <div key={item.href}>
                    {/* Add separator if needed */}
                    {item.separator && <Separator className="my-2" />}

                    {item.submenu && hasVisibleSubmenuItems(item) ? (
                      <>
                        <Button
                          variant={active ? "secondary" : "ghost"}
                          className="w-full justify-start gap-3 py-[calc(0.5rem-2px)]"
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
                                  onClick={() => setOpen(false)}
                                >
                                  <Button
                                    variant={subActive ? "secondary" : "ghost"}
                                    className="w-full justify-start gap-3 text-sm py-[calc(0.375rem-2px)]"
                                    size="sm"
                                  >
                                    <SubIcon className="h-3.5 w-3.5" />
                                    <span>{subitem.label}</span>
                                    {isExternalLink && (
                                      <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                                    )}
                                  </Button>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        target={
                          item.href === "/admin/versions-history" ||
                          item.href === "/admin/custom-domain"
                            ? "_blank"
                            : undefined
                        }
                        rel={
                          item.href === "/admin/versions-history" ||
                          item.href === "/admin/custom-domain"
                            ? "noopener noreferrer"
                            : undefined
                        }
                        onClick={() => {
                          setOpen(false);
                          setExpandedItems([]);
                        }}
                      >
                        <Button
                          variant={active ? "secondary" : "ghost"}
                          className="w-full justify-start gap-3 py-[calc(0.5rem-2px)]"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="flex-1 text-left">{item.label}</span>
                          {(item.href === "/admin/versions-history" ||
                            item.href === "/admin/custom-domain") && (
                            <ExternalLink className="h-4 w-4" />
                          )}
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
