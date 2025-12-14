"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/admin-ui/button";
import {
  LayoutDashboard,
  Database,
  Upload,
  Mail,
  Terminal,
  Fingerprint,
  Home,
  GraduationCap,
  Stamp,
} from "lucide-react";

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    href: "/admin",
    label: "Pages",
    icon: Stamp,
  },
  {
    href: "/admin/getting-started",
    label: "Getting Started",
    icon: GraduationCap,
  },
  {
    href: "/admin/authentication",
    label: "Authentication",
    icon: Fingerprint,
  },
  {
    href: "/admin/database",
    label: "Database",
    icon: Database,
  },
  {
    href: "/admin/storage",
    label: "Storage",
    icon: Upload,
  },
  {
    href: "/admin/email",
    label: "Email",
    icon: Mail,
  },
  {
    href: "/admin/environment",
    label: "Environment",
    icon: Terminal,
  },
  {
    href: "/admin/components",
    label: "Component Templates",
    icon: LayoutDashboard,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex-1 space-y-1 px-2 pb-4">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href, item.exact);

        return (
          <Link key={item.href} href={item.href}>
            <Button variant={active ? "secondary" : "ghost"} className="w-full justify-start">
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}
