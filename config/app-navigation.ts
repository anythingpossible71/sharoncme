import { LucideIcon, LayoutDashboard } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
};

export const appNavigation: NavGroup[] = [
  {
    label: "Overview",
    defaultOpen: true,
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
];
