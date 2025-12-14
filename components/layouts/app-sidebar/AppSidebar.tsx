"use client";

import { AppSidebarNav } from "./AppSidebarNav";
import type { NavGroup } from "@/config/app-navigation";

interface AppSidebarProps {
  navigationGroups: NavGroup[];
}

export function AppSidebar({ navigationGroups }: AppSidebarProps) {
  return (
    <aside className="w-64 h-full border-r bg-muted/50 flex flex-col overflow-y-auto">
      <AppSidebarNav navigationGroups={navigationGroups} />
    </aside>
  );
}
