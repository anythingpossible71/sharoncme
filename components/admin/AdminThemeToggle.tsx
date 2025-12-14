"use client";

import * as React from "react";
import { Moon, Sun, Palette, Waves, Trees, Clock } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/admin-ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/admin-ui/dropdown-menu";

import { getThemesByCategory } from "@/themes";
import { logger } from "@/lib/logger";

// Icon mapping for dynamic icons
const iconMap = {
  Sun,
  Moon,
  Palette,
  Waves,
  Trees,
  Clock,
} as const;

export function AdminThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const baseThemes = getThemesByCategory("base");
  const customThemes = getThemesByCategory("custom");

  const getIconComponent = (iconName?: string) => {
    if (!iconName || !(iconName in iconMap)) return Palette;
    return iconMap[iconName as keyof typeof iconMap];
  };

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Admin Theme (Current: {theme})</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Base themes */}
        {baseThemes.map((themeOption) => {
          const IconComponent = getIconComponent(themeOption.icon);
          return (
            <DropdownMenuItem
              key={themeOption.name}
              onClick={() => {
                logger.info("[AdminTheme] Setting theme to", { theme: themeOption.name });
                setTheme(themeOption.name);
              }}
            >
              <IconComponent className="mr-2 h-4 w-4" />
              {themeOption.label}
              {theme === themeOption.name && " ✓"}
            </DropdownMenuItem>
          );
        })}

        {/* System theme */}
        <DropdownMenuItem
          onClick={() => {
            logger.info("[AdminTheme] Setting theme to system");
            setTheme("system");
          }}
        >
          <Palette className="mr-2 h-4 w-4" />
          System
          {theme === "system" && " ✓"}
        </DropdownMenuItem>

        {/* Custom themes */}
        {customThemes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Custom Themes</DropdownMenuLabel>
            {customThemes.map((themeOption) => {
              const IconComponent = getIconComponent(themeOption.icon);
              return (
                <DropdownMenuItem
                  key={themeOption.name}
                  onClick={() => {
                    logger.info("[AdminTheme] Setting theme to", { theme: themeOption.name });
                    setTheme(themeOption.name);
                  }}
                >
                  <IconComponent className="mr-2 h-4 w-4" />
                  <span className="flex items-center gap-1">
                    {themeOption.emoji && <span>{themeOption.emoji}</span>}
                    {themeOption.label}
                  </span>
                  {theme === themeOption.name && " ✓"}
                </DropdownMenuItem>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
