"use client";

import * as React from "react";
import { Moon, Sun, Palette, Waves, Trees, Clock } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import { getTheme } from "@/themes";
import { midnightAppTheme } from "@/themes/custom/midnight";
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

// App themes - limited set for non-admin users
const APP_THEMES = ["light", "dark", "system", "ocean", "forest", "midnight"];

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Only show themes that are configured for the app (not admin)
  const availableThemes = APP_THEMES.map((themeName) => {
    // Use app-specific midnight theme (yellow) instead of admin version (purple)
    if (themeName === "midnight") {
      return midnightAppTheme;
    }
    return getTheme(themeName);
  }).filter((theme): theme is NonNullable<typeof theme> => theme !== null && theme !== undefined);

  const baseThemes = availableThemes.filter((theme) => theme.category === "base");
  const customThemes = availableThemes.filter((theme) => theme.category === "custom");

  const getIconComponent = (iconName?: string) => {
    if (!iconName || !(iconName in iconMap)) return Palette;
    return iconMap[iconName as keyof typeof iconMap];
  };

  const handleThemeChange = (themeName: string) => {
    if (!mounted) return;

    const currentSavedTheme = localStorage.getItem("app-theme");
    logger.info("[AppTheme] ThemeToggle: User clicked theme", {
      requestedTheme: themeName,
      currentTheme: theme,
      resolvedTheme,
      savedThemeBeforeChange: currentSavedTheme,
      timestamp: new Date().toISOString(),
    });

    setTheme(themeName);

    // Check immediately after setting
    setTimeout(() => {
      const newSavedTheme = localStorage.getItem("app-theme");
      logger.info("[AppTheme] ThemeToggle: After setTheme", {
        requestedTheme: themeName,
        savedThemeAfterChange: newSavedTheme,
        timestamp: new Date().toISOString(),
      });
    }, 100);
  };

  // Don't render until mounted to avoid hydration issues
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
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Base themes */}
        {baseThemes.map((theme) => {
          const IconComponent = getIconComponent(theme.icon);
          return (
            <DropdownMenuItem key={theme.name} onClick={() => handleThemeChange(theme.name)}>
              <IconComponent className="mr-2 h-4 w-4" />
              {theme.label}
            </DropdownMenuItem>
          );
        })}

        {/* System theme */}
        {APP_THEMES.includes("system") && (
          <DropdownMenuItem onClick={() => handleThemeChange("system")}>
            <Palette className="mr-2 h-4 w-4" />
            System
          </DropdownMenuItem>
        )}

        {/* Custom themes */}
        {customThemes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Custom Themes</DropdownMenuLabel>
            {customThemes.map((theme) => {
              const IconComponent = getIconComponent(theme.icon);
              return (
                <DropdownMenuItem key={theme.name} onClick={() => handleThemeChange(theme.name)}>
                  <IconComponent className="mr-2 h-4 w-4" />
                  <span className="flex items-center gap-1">
                    {theme.emoji && <span>{theme.emoji}</span>}
                    {theme.label}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
