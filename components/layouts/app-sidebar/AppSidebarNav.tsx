"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import type { NavGroup } from "@/config/app-navigation";

interface AppSidebarNavProps {
  navigationGroups: NavGroup[];
}

export function AppSidebarNav({ navigationGroups }: AppSidebarNavProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  // Initialize open groups based on defaultOpen
  useEffect(() => {
    const defaultOpenGroups = navigationGroups
      .filter((group) => group.defaultOpen)
      .map((group) => group.label);
    setOpenGroups(defaultOpenGroups);
  }, [navigationGroups]);

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const toggleGroup = (groupLabel: string) => {
    setOpenGroups((prev) =>
      prev.includes(groupLabel)
        ? prev.filter((label) => label !== groupLabel)
        : [...prev, groupLabel]
    );
  };

  return (
    <nav className="flex flex-col gap-2 px-3 py-4">
      {navigationGroups.map((group) => {
        const isOpen = openGroups.includes(group.label);

        return (
          <Collapsible
            key={group.label}
            open={isOpen}
            onOpenChange={() => toggleGroup(group.label)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 px-2 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {group.label}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 flex flex-col gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={active ? "secondary" : "ghost"}
                      className="w-full justify-start gap-3 px-2 py-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </nav>
  );
}
