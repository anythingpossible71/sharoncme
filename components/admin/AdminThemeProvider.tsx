"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { logger } from "@/lib/logger";

/**
 * Theme debug component to log theme changes and force system theme
 * Also ensures app theme classes are removed to maintain complete isolation
 */
function ThemeDebugger() {
  const { theme, resolvedTheme, systemTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Force theme to 'light' on mount if it's not already
  React.useEffect(() => {
    if (mounted && theme !== "light") {
      logger.info("[AdminTheme] Forcing theme to 'light'", { previousTheme: theme });
      setTheme("light");
    }
  }, [mounted, theme, setTheme]);

  // Continuously monitor and remove app theme classes to ensure isolation
  React.useEffect(() => {
    if (!mounted) return;

    const removeAppThemeClasses = () => {
      const htmlElement = document.documentElement;
      const appThemeClasses = [
        "ocean",
        "forest",
        "midnight",
        "strawberry-swirl",
        "sunset-sorbet",
        "lavender-honey",
        "matcha-latte",
        "blueberry-cheesecake",
        "rocky-road",
        "orange-creamsicle",
        "caramel-drizzle",
        "cotton-candy",
        "birthday-cake",
        "ube",
        "lemon-meringue",
        "pistachio-almond",
        "tutti-frutti",
        "electric-mango",
        "raspberry-rush",
        "lime-zing",
        "grape-soda",
        "cherry-bomb",
        "blue-lagoon",
        "supercharged-orange",
        "vivid-violet",
        "kiwi-splash",
        "passion-fruit-punch",
      ];

      // Remove custom app theme classes (but keep light/dark as those are system-resolved)
      let removedAny = false;
      appThemeClasses.forEach((themeClass) => {
        if (htmlElement.classList.contains(themeClass)) {
          htmlElement.classList.remove(themeClass);
          removedAny = true;
        }
      });

      if (removedAny) {
        logger.info("[AdminTheme] Removed app theme classes to maintain isolation");
      }
    };

    // Remove app theme classes immediately
    removeAppThemeClasses();

    // Set up a MutationObserver to watch for theme class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          removeAppThemeClasses();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, [mounted]);

  React.useEffect(() => {
    if (mounted) {
      logger.info("[AdminTheme] Theme changed:", {
        theme,
        resolvedTheme,
        systemTheme,
        timestamp: new Date().toISOString(),
      });
    }
  }, [theme, resolvedTheme, systemTheme, mounted]);

  return null;
}

/**
 * Admin-specific theme provider that always uses system theme
 * The admin theme follows the system's light/dark mode preference
 */
export function AdminThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  // Clear any saved theme from localStorage on mount to force system theme
  // Also remove any app theme classes from HTML element to ensure complete isolation
  // Note: The root layout has a blocking script that runs before React hydrates,
  // but this useEffect ensures cleanup happens after React mounts as well
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // Clear admin theme from localStorage and force light
      const savedTheme = localStorage.getItem("admin-theme");
      logger.info("[AdminTheme] AdminThemeProvider initialized with defaultTheme: light", {
        savedTheme,
        appThemeBefore: localStorage.getItem("app-theme"),
        timestamp: new Date().toISOString(),
      });

      if (savedTheme && savedTheme !== "light") {
        logger.info("[AdminTheme] Clearing saved theme from localStorage, forcing 'light'");
        localStorage.setItem("admin-theme", "light");
      }

      // Remove any app theme classes from HTML element to ensure complete isolation
      // App themes use storageKey="theme" or "app-theme", admin uses "admin-theme"
      // Note: We keep "light" and "dark" as those are needed for system theme resolution
      const htmlElement = document.documentElement;
      const appThemeClasses = [
        "ocean",
        "forest",
        "midnight",
        "strawberry-swirl",
        "sunset-sorbet",
        "lavender-honey",
        "matcha-latte",
        "blueberry-cheesecake",
        "rocky-road",
        "orange-creamsicle",
        "caramel-drizzle",
        "cotton-candy",
        "birthday-cake",
        "ube",
        "lemon-meringue",
        "pistachio-almond",
        "tutti-frutti",
        "electric-mango",
        "raspberry-rush",
        "lime-zing",
        "grape-soda",
        "cherry-bomb",
        "blue-lagoon",
        "supercharged-orange",
        "vivid-violet",
        "kiwi-splash",
        "passion-fruit-punch",
      ];

      // Remove custom app theme classes (but keep light/dark as those are system-resolved)
      appThemeClasses.forEach((themeClass) => {
        htmlElement.classList.remove(themeClass);
      });

      // DO NOT clear app theme storage keys - preserve user's theme choice
      // Separation is DOM-based (data-admin-theme vs data-app-theme), not localStorage-based
      const appThemeBefore = localStorage.getItem("app-theme");
      const themeBefore = localStorage.getItem("theme");
      logger.info("[AdminTheme] Preserving app theme localStorage", {
        appThemeBefore,
        themeBefore,
        timestamp: new Date().toISOString(),
      });

      // Ensure only admin theme is applied visually (DOM attributes)
      logger.info("[AdminTheme] Removed app theme classes, ensuring admin theme isolation");
    }
  }, []);

  return (
    <NextThemesProvider
      attribute="data-admin-theme"
      defaultTheme="light"
      enableSystem
      themes={[
        "light",
        "dark",
        "system",
        "ocean",
        "forest",
        "midnight",
        "strawberry-swirl",
        "sunset-sorbet",
        "lavender-honey",
        "matcha-latte",
        "blueberry-cheesecake",
        "rocky-road",
        "orange-creamsicle",
        "caramel-drizzle",
        "cotton-candy",
        "birthday-cake",
        "ube",
        "lemon-meringue",
        "pistachio-almond",
        "tutti-frutti",
        "electric-mango",
        "raspberry-rush",
        "lime-zing",
        "grape-soda",
        "cherry-bomb",
        "blue-lagoon",
        "supercharged-orange",
        "vivid-violet",
        "kiwi-splash",
        "passion-fruit-punch",
      ]}
      disableTransitionOnChange
      storageKey="admin-theme" // Separate from app's 'theme' key
      {...props}
    >
      <ThemeDebugger />
      {children}
    </NextThemesProvider>
  );
}
