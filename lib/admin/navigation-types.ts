import type { LucideIcon } from "lucide-react";

export type NavigationItem = {
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
