"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { ADMIN_HEADER_CONTENT_HEIGHT, ADMIN_HEADER_PADDING } from "@/lib/constants";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { logger } from "@/lib/logger";
import { appThemeConfig } from "@/config/app-theme.config";

interface ConditionalThemeProviderClientProps {
  children: React.ReactNode;
  isAdmin: boolean;
}

/**
 * Preview theme handler - reads preview-theme URL parameter and applies it
 * ZERO PERSISTENCE: Only applies theme visually, no localStorage interaction
 *
 * When preview-theme param is present, it overrides everything and applies that theme
 * When param is removed, theme reverts to default from config
 */
function PreviewThemeHandler() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const previewThemeRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);

    const applyPreviewTheme = (previewTheme: string) => {
      // Resolve system theme to light/dark
      let resolvedTheme = previewTheme;
      if (previewTheme === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        resolvedTheme = prefersDark ? "dark" : "light";
      }

      // Apply theme directly to DOM (bypass next-themes localStorage sync)
      const htmlElement = document.documentElement;

      // Remove all theme classes
      const allThemeClasses = [
        "light",
        "dark",
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
      allThemeClasses.forEach((themeClass) => {
        htmlElement.classList.remove(themeClass);
      });

      // Set preview theme
      htmlElement.setAttribute("data-app-theme", resolvedTheme);
      htmlElement.classList.add(resolvedTheme);

      // CRITICAL: Set previewThemeRef BEFORE calling setTheme
      // This ensures the interceptor is ready to block localStorage writes
      previewThemeRef.current = previewTheme;

      // Update next-themes state (for internal consistency, but we prevent localStorage writes)
      // The interceptor will block any localStorage writes triggered by setTheme
      setTheme(previewTheme);

      logger.info("[AppTheme] Applied preview theme from URL (zero persistence)", {
        previewTheme,
        resolvedTheme,
      });
    };

    // Check for preview-theme URL parameter
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const previewTheme = urlParams.get("preview-theme");

      if (previewTheme) {
        applyPreviewTheme(previewTheme);
      }
    }
  }, [setTheme]);

  // Watch for URL parameter changes (when iframe reloads with new theme)
  useEffect(() => {
    if (!mounted) return;

    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const previewTheme = urlParams.get("preview-theme");

      if (previewTheme && previewTheme !== previewThemeRef.current) {
        // New preview theme - apply it
        let resolvedTheme = previewTheme;
        if (previewTheme === "system") {
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          resolvedTheme = prefersDark ? "dark" : "light";
        }

        const htmlElement = document.documentElement;
        const allThemeClasses = [
          "light",
          "dark",
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
        allThemeClasses.forEach((themeClass) => {
          htmlElement.classList.remove(themeClass);
        });
        htmlElement.setAttribute("data-app-theme", resolvedTheme);
        htmlElement.classList.add(resolvedTheme);

        // CRITICAL: Set previewThemeRef BEFORE calling setTheme
        // This ensures the interceptor is ready to block localStorage writes
        previewThemeRef.current = previewTheme;

        // Update next-themes state (for internal consistency, but we prevent localStorage writes)
        // The interceptor will block any localStorage writes triggered by setTheme
        setTheme(previewTheme);
      } else if (!previewTheme && previewThemeRef.current) {
        // Preview theme removed - revert to localStorage if exists, otherwise config
        const savedTheme = localStorage.getItem("app-theme") || localStorage.getItem("theme");
        const defaultTheme: string = savedTheme || appThemeConfig.currentTheme;
        let resolvedTheme: string = defaultTheme;
        // Check if theme is "system" and resolve to light/dark
        const themeValue = String(defaultTheme);
        if (themeValue === "system") {
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          resolvedTheme = prefersDark ? "dark" : "light";
        }

        const htmlElement = document.documentElement;
        const allThemeClasses = [
          "light",
          "dark",
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
        allThemeClasses.forEach((themeClass) => {
          htmlElement.classList.remove(themeClass);
        });
        htmlElement.setAttribute("data-app-theme", resolvedTheme);
        htmlElement.classList.add(resolvedTheme);
        // Use defaultTheme for setTheme (preserves "system" if that's the default)
        // This will restore from localStorage if it exists, otherwise use config
        setTheme(defaultTheme as "light" | "dark" | "system" | "ocean" | "forest" | "midnight");
        previewThemeRef.current = null;

        logger.info("[AppTheme] Preview theme removed - reverted to saved theme", {
          savedTheme,
          defaultTheme,
          resolvedTheme,
          timestamp: new Date().toISOString(),
        });
      }
    };

    // Check on popstate (back/forward navigation)
    window.addEventListener("popstate", checkUrlParams);
    // Also check periodically for URL changes (when iframe src changes)
    const interval = setInterval(checkUrlParams, 300);

    return () => {
      window.removeEventListener("popstate", checkUrlParams);
      clearInterval(interval);
    };
  }, [mounted, setTheme]);

  // Prevent next-themes from writing to localStorage when in preview mode
  // This ensures zero persistence - preview themes never touch localStorage
  useEffect(() => {
    if (!mounted) return;

    const originalSetItem = Storage.prototype.setItem;
    let isIntercepting = false;

    const interceptSetItem = function (this: Storage, key: string, value: string) {
      // If we're in preview mode and trying to write app-theme, block it
      // Check both previewThemeRef and URL parameter for maximum safety
      const urlParams = new URLSearchParams(window.location.search);
      const previewTheme = urlParams.get("preview-theme");

      if (key === "app-theme" && (previewThemeRef.current || previewTheme)) {
        logger.info("[AppTheme] Blocked localStorage write during preview mode", {
          key,
          attemptedValue: value,
          previewThemeRef: previewThemeRef.current,
          urlParam: previewTheme,
          timestamp: new Date().toISOString(),
        });
        // Don't write anything - zero persistence
        return;
      }
      originalSetItem.call(this, key, value);
    };

    // Only intercept when preview theme is active
    const checkAndIntercept = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const previewTheme = urlParams.get("preview-theme");

      if (previewTheme && !isIntercepting) {
        Storage.prototype.setItem = interceptSetItem as typeof Storage.prototype.setItem;
        isIntercepting = true;
        logger.info("[AppTheme] Activated localStorage interceptor for preview mode", {
          previewTheme,
          timestamp: new Date().toISOString(),
        });
      } else if (!previewTheme && isIntercepting) {
        Storage.prototype.setItem = originalSetItem;
        isIntercepting = false;
        logger.info("[AppTheme] Deactivated localStorage interceptor (preview mode ended)", {
          timestamp: new Date().toISOString(),
        });
      }
    };

    // Check immediately and set up interval
    checkAndIntercept();
    const interval = setInterval(checkAndIntercept, 300);

    return () => {
      clearInterval(interval);
      if (isIntercepting) {
        Storage.prototype.setItem = originalSetItem;
      }
    };
  }, [mounted]);

  return null;
}

/**
 * Theme debugger component to track theme changes
 */
function AppThemeDebugger() {
  const { theme, setTheme: _setTheme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Log initial state
  useEffect(() => {
    if (mounted) {
      const savedTheme = localStorage.getItem("app-theme");
      logger.info("[AppTheme] ConditionalThemeProviderClient mounted", {
        savedThemeFromStorage: savedTheme,
        currentTheme: theme,
        resolvedTheme,
        systemTheme,
        timestamp: new Date().toISOString(),
      });
    }
  }, [mounted]);

  // Log theme changes
  useEffect(() => {
    if (mounted) {
      logger.info("[AppTheme] Theme changed", {
        theme,
        resolvedTheme,
        systemTheme,
        localStorageValue: localStorage.getItem("app-theme"),
        timestamp: new Date().toISOString(),
      });
    }
  }, [theme, resolvedTheme, systemTheme, mounted]);

  // Monitor localStorage changes
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "app-theme") {
        logger.info("[AppTheme] localStorage changed", {
          oldValue: e.oldValue,
          newValue: e.newValue,
          currentTheme: theme,
          timestamp: new Date().toISOString(),
        });
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [mounted, theme]);

  return null;
}

export function ConditionalThemeProviderClient({
  children,
  isAdmin,
}: ConditionalThemeProviderClientProps) {
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Track scroll position for header animation (same as AdminBarClient)
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Ensure component is mounted before rendering theme provider to avoid hydration issues
  useEffect(() => {
    logger.info("[AppTheme] ConditionalThemeProviderClient mounting", {
      isAdmin,
      pathname: typeof window !== "undefined" ? window.location.pathname : "unknown",
      savedThemeBeforeMount:
        typeof window !== "undefined" ? localStorage.getItem("app-theme") : null,
      timestamp: new Date().toISOString(),
    });
    setMounted(true);
  }, [isAdmin]);

  // Check localStorage before rendering (must be before early return)
  useEffect(() => {
    if (mounted) {
      const savedTheme = typeof window !== "undefined" ? localStorage.getItem("app-theme") : null;
      logger.info("[AppTheme] About to render ThemeProvider", {
        savedTheme,
        defaultTheme: "system",
        storageKey: "app-theme",
        timestamp: new Date().toISOString(),
      });
    }
  }, [mounted]);

  // Check if admin bar is hidden via keyboard shortcut
  const [adminBarHidden, setAdminBarHidden] = useState(false);

  useEffect(() => {
    if (!mounted) return;

    const checkAdminBarVisibility = () => {
      const hidden = document.documentElement.getAttribute("data-admin-bar-hidden") === "true";
      setAdminBarHidden(hidden);
    };

    // Check initially
    checkAdminBarVisibility();

    // Watch for changes via MutationObserver
    const observer = new MutationObserver(checkAdminBarVisibility);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-admin-bar-hidden"],
    });

    return () => observer.disconnect();
  }, [mounted]);

  // Calculate animated height based on scroll position (same calculation as AdminBarClient)
  const scrollThreshold = 50;
  const animationProgress = Math.min(scrollY / scrollThreshold, 1);
  const animatedHeight =
    ADMIN_HEADER_CONTENT_HEIGHT + ADMIN_HEADER_PADDING * 2 * (1 - animationProgress);

  // Ensure localStorage is preserved before ThemeProvider initializes
  // This prevents next-themes from overwriting user's choice on mount
  // MUST be before early return to follow Rules of Hooks
  useEffect(() => {
    if (!mounted) return;

    // If localStorage has a value, ensure it's preserved
    // next-themes will read it correctly, but we want to prevent any overwrites
    const savedTheme = localStorage.getItem("app-theme") || localStorage.getItem("theme");
    if (savedTheme) {
      // Ensure the saved theme is in localStorage before next-themes initializes
      // This prevents next-themes from writing defaultTheme if there's a timing issue
      if (!localStorage.getItem("app-theme")) {
        localStorage.setItem("app-theme", savedTheme);
      }
    }
  }, [mounted]);

  // Don't render theme provider until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div
        style={
          isAdmin && !adminBarHidden
            ? { paddingTop: `${ADMIN_HEADER_CONTENT_HEIGHT + ADMIN_HEADER_PADDING * 2}px` }
            : undefined
        }
      >
        {children}
      </div>
    );
  }

  return (
    <ThemeProvider
      attribute="data-app-theme"
      defaultTheme={appThemeConfig.currentTheme}
      enableSystem
      themes={["light", "dark", "system", "ocean", "forest", "midnight"]}
      disableTransitionOnChange
      storageKey="app-theme"
    >
      <PreviewThemeHandler />
      <ThemeSync />
      <AppThemeDebugger />
      <div
        className="transition-all duration-300 ease-out"
        style={isAdmin && !adminBarHidden ? { paddingTop: `${animatedHeight}px` } : undefined}
      >
        {children}
      </div>
    </ThemeProvider>
  );
}

/**
 * Syncs the data-app-theme attribute with the class for CSS variable support
 */
function ThemeSync() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const htmlElement = document.documentElement;

    // CRITICAL: Remove admin theme attribute to prevent admin CSS from affecting app pages
    // Admin CSS maps --admin-* variables to --* variables, which would override app theme
    if (htmlElement.hasAttribute("data-admin-theme")) {
      htmlElement.removeAttribute("data-admin-theme");
      logger.info(
        "[ThemeSync] Removed data-admin-theme attribute to prevent admin CSS from affecting app pages"
      );
    }

    // Use theme directly (not resolvedTheme) to preserve custom theme names like "ocean", "forest", "midnight"
    // Only use resolvedTheme when theme is "system" to get the actual light/dark preference
    const currentTheme =
      theme === "system" ? resolvedTheme || "light" : theme || resolvedTheme || "light";

    // data-app-theme is now set automatically by next-themes since we use attribute="data-app-theme"
    // But we also need to set .dark class for Tailwind dark mode support
    // Tailwind uses darkMode: ["class"] which requires .dark class
    if (currentTheme === "dark" || (theme === "system" && resolvedTheme === "dark")) {
      htmlElement.classList.add("dark");
      // Remove light class if present
      htmlElement.classList.remove("light");
    } else if (currentTheme === "light" || (theme === "system" && resolvedTheme === "light")) {
      htmlElement.classList.remove("dark");
      htmlElement.classList.add("light");
    } else {
      // For custom themes, remove both dark and light classes
      htmlElement.classList.remove("dark", "light");
    }

    logger.info("[ThemeSync] Synced theme", {
      theme,
      resolvedTheme,
      currentTheme,
      dataAppTheme: htmlElement.getAttribute("data-app-theme"),
      dataAdminTheme: htmlElement.getAttribute("data-admin-theme"),
      hasDarkClass: htmlElement.classList.contains("dark"),
      hasLightClass: htmlElement.classList.contains("light"),
      timestamp: new Date().toISOString(),
    });
  }, [theme, resolvedTheme, mounted]);

  return null;
}
