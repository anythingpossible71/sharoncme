"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { PageNavigatorPopover } from "@/components/admin/PageNavigatorPopover";
import { FullscreenToast } from "@/components/admin/FullscreenToast";

interface SidebarToggleProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export function SidebarToggle({ children, isAdmin = false }: SidebarToggleProps) {
  const pathname = usePathname();
  const [pageNavigatorOpen, setPageNavigatorOpen] = useState(false);

  // Check for temporary fullscreen mode from URL parameter
  const [tempFullscreenMode, setTempFullscreenMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("mode") === "temp-full-screen";
    }
    return false;
  });

  const [fullscreenMode, setFullscreenMode] = useState<boolean>(() => {
    // Don't load from localStorage if temp fullscreen is active (check URL param directly)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("mode") === "temp-full-screen") {
        return false; // Temp fullscreen takes precedence
      }
      const stored = localStorage.getItem("admin-fullscreen-mode");
      return stored === "true";
    }
    return false;
  });

  // Watch for URL parameter changes
  useEffect(() => {
    const checkUrlParam = () => {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const isTempFullscreen = urlParams.get("mode") === "temp-full-screen";
        setTempFullscreenMode(isTempFullscreen);
        // If temp fullscreen is active, disable regular fullscreen
        if (isTempFullscreen && fullscreenMode) {
          setFullscreenMode(false);
        }
      }
    };

    checkUrlParam();
    // Check on popstate (back/forward navigation)
    window.addEventListener("popstate", checkUrlParam);
    // Also check periodically in case URL changes via Next.js navigation
    const interval = setInterval(checkUrlParam, 500);

    return () => {
      window.removeEventListener("popstate", checkUrlParam);
      clearInterval(interval);
    };
  }, [fullscreenMode]);

  // Also check when pathname changes (Next.js navigation)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const isTempFullscreen = urlParams.get("mode") === "temp-full-screen";
      setTempFullscreenMode(isTempFullscreen);
      if (isTempFullscreen && fullscreenMode) {
        setFullscreenMode(false);
      }
    }
  }, [pathname, fullscreenMode]);
  const [currentPagePath, setCurrentPagePath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname;
    }
    return "/";
  });
  const [pageNavigatorPosition, setPageNavigatorPosition] = useState<
    | {
        top: number;
        left: number;
        width: number;
      }
    | undefined
  >(undefined);
  const [pageNavigatorSearchValue, setPageNavigatorSearchValue] = useState<string>("/");
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [adminBackgroundColor, setAdminBackgroundColor] = useState<string | null>(null);

  // Get admin background color when user is admin (hardcoded to match admin theme)
  useEffect(() => {
    if (!isAdmin || typeof window === "undefined") return;

    const getAdminBackgroundColor = () => {
      // Get admin theme from localStorage or data attribute
      const htmlElement = document.documentElement;
      const adminTheme =
        htmlElement.getAttribute("data-admin-theme") ||
        localStorage.getItem("admin-theme") ||
        "light";

      // Try to read the CSS variable directly from the computed styles first
      // This ensures we always use the actual CSS value, not a hardcoded one
      let cssVariableValue: string | null = null;
      try {
        const computedStyle = getComputedStyle(htmlElement);
        const adminBgHsl = computedStyle.getPropertyValue("--admin-background").trim();
        if (adminBgHsl) {
          cssVariableValue = `hsl(${adminBgHsl})`;
        }
      } catch (e) {
        console.warn("🟡 [SidebarToggle] Could not read --admin-background CSS variable", e);
      }

      // Fallback to hardcoded values if CSS variable is not available
      // These values match exactly what's defined in app/admin/admin.css
      const adminBackgrounds: Record<string, string> = {
        light: "hsl(216 19% 95%)", // Light theme value (#eff1f4)
        dark: "hsl(222.2 84% 4.9%)", // Dark theme value
      };

      // Use CSS variable if available, otherwise use hardcoded value
      const identifiedColor =
        cssVariableValue || adminBackgrounds[adminTheme] || adminBackgrounds.light;

      return identifiedColor;
    };

    // Read admin background color once on mount - it doesn't change dynamically
    const initialColor = getAdminBackgroundColor();
    setAdminBackgroundColor(initialColor);

    // No polling needed - admin theme is set once and doesn't change
    // No storage listener needed - admin theme doesn't change via localStorage
  }, [isAdmin]);

  // Update current page path when pathname changes
  useEffect(() => {
    setCurrentPagePath(pathname);

    // Notify header iframe of pathname change
    const headerIframe = document.querySelector(
      'iframe[src="/admin/header-iframe"]'
    ) as HTMLIFrameElement;
    if (headerIframe?.contentWindow) {
      headerIframe.contentWindow.postMessage(
        {
          type: "PAGE_PATH_CHANGED",
          path: pathname,
        },
        window.location.origin
      );
    }
  }, [pathname]);

  // Persist fullscreen mode to localStorage and notify AdminIframesClient when it changes
  // Skip persistence if temp fullscreen mode is active
  useEffect(() => {
    // Don't persist if temp fullscreen is active
    if (tempFullscreenMode) return;

    // Store in localStorage for persistence across navigation
    if (typeof window !== "undefined") {
      localStorage.setItem("admin-fullscreen-mode", fullscreenMode ? "true" : "false");
    }
    // Dispatch custom event to notify AdminIframesClient
    window.dispatchEvent(
      new CustomEvent("fullscreenModeChanged", {
        detail: { fullscreenMode },
      })
    );
  }, [fullscreenMode, tempFullscreenMode]);

  // Listen for clicks outside the page navigator to close it
  useEffect(() => {
    if (!pageNavigatorOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if click is on the menu
      const clickedOnMenu = target.closest("[data-page-navigator-menu]");

      // Check if click is on the header iframe (which contains the input)
      const clickedOnHeaderIframe = target.closest('iframe[src="/admin/header-iframe"]');

      // If click is outside both, close the menu
      if (!clickedOnMenu && !clickedOnHeaderIframe) {
        setPageNavigatorOpen(false);
        // Reset search value
        const headerIframe = document.querySelector(
          'iframe[src="/admin/header-iframe"]'
        ) as HTMLIFrameElement;
        if (headerIframe?.contentWindow) {
          headerIframe.contentWindow.postMessage(
            {
              type: "RESET_PAGE_NAVIGATOR_SEARCH",
              currentPath: currentPagePath,
            },
            window.location.origin
          );
        }
      }
    };

    // Use capture phase to catch clicks before they bubble
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, [pageNavigatorOpen, currentPagePath]);

  // Listen for messages from header iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "TOGGLE_FULLSCREEN_MODE") {
        // Don't toggle if temp fullscreen is active (URL param takes precedence)
        if (tempFullscreenMode) return;

        // Toggle fullscreen mode
        setFullscreenMode((prev) => {
          const newValue = !prev;
          // Store in localStorage immediately
          if (typeof window !== "undefined") {
            localStorage.setItem("admin-fullscreen-mode", newValue ? "true" : "false");
          }
          return newValue;
        });
      } else if (event.data.type === "OPEN_PAGE_NAVIGATOR") {
        // Open page navigator popover
        const path = event.data.currentPath || window.location.pathname;
        setCurrentPagePath(path);
        setPageNavigatorPosition(event.data.position);
        setPageNavigatorSearchValue(event.data.searchValue || path);
        setPageNavigatorOpen(true);
      } else if (event.data.type === "UPDATE_PAGE_NAVIGATOR_POSITION") {
        // Update position and search value immediately
        setPageNavigatorPosition(event.data.position);
        if (event.data.searchValue !== undefined) {
          setPageNavigatorSearchValue(event.data.searchValue);
        }
        if (!pageNavigatorOpen) {
          setPageNavigatorOpen(true);
        }
      } else if (event.data.type === "UPDATE_PAGE_NAVIGATOR_SEARCH") {
        // Immediate search value update (for real-time typing)
        if (event.data.searchValue !== undefined) {
          setPageNavigatorSearchValue(event.data.searchValue);
        }
        if (!pageNavigatorOpen) {
          setPageNavigatorOpen(true);
        }
      } else if (event.data.type === "PAGE_NAVIGATOR_OPENED") {
        // Menu is now open - ensure it's open
        setPageNavigatorOpen(true);
      } else if (event.data.type === "CLOSE_PAGE_NAVIGATOR_ON_BLUR") {
        // Close menu when input loses focus
        setPageNavigatorOpen(false);
        // Reset search value
        const headerIframe = document.querySelector(
          'iframe[src="/admin/header-iframe"]'
        ) as HTMLIFrameElement;
        if (headerIframe?.contentWindow) {
          headerIframe.contentWindow.postMessage(
            {
              type: "RESET_PAGE_NAVIGATOR_SEARCH",
              currentPath: currentPagePath,
            },
            window.location.origin
          );
        }
      } else if (event.data.type === "CLOSE_PAGE_NAVIGATOR") {
        // Close page navigator and reset search value to current path
        setPageNavigatorOpen(false);
        // Send reset message to iframe to reset search value
        const headerIframe = document.querySelector(
          'iframe[src="/admin/header-iframe"]'
        ) as HTMLIFrameElement;
        if (headerIframe?.contentWindow) {
          headerIframe.contentWindow.postMessage(
            {
              type: "RESET_PAGE_NAVIGATOR_SEARCH",
              currentPath: currentPagePath,
            },
            window.location.origin
          );
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [currentPagePath, pageNavigatorOpen, tempFullscreenMode]);

  // Function to exit fullscreen mode
  const exitFullscreen = () => {
    setFullscreenMode(false);
    // Remove from localStorage when exiting fullscreen
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin-fullscreen-mode");
    }
  };

  // Listen for Escape key to exit fullscreen mode (only for persistent fullscreen, not temp)
  useEffect(() => {
    if (!fullscreenMode || tempFullscreenMode) return; // Don't handle Escape for temp fullscreen

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        exitFullscreen();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [fullscreenMode, tempFullscreenMode]);

  // Combine fullscreen modes: use temp fullscreen if active, otherwise use persistent fullscreen
  const effectiveFullscreenMode = tempFullscreenMode || fullscreenMode;

  return (
    <>
      {/* Invisible header area for hover detection - only for persistent fullscreen */}
      {fullscreenMode && !tempFullscreenMode && (
        <div
          className="fixed top-0 left-0 w-full h-[100px] z-[99]"
          onMouseEnter={() => setIsHeaderHovered(true)}
          onMouseLeave={() => setIsHeaderHovered(false)}
        />
      )}
      {/* Fullscreen Toast - only for persistent fullscreen, not temp */}
      {!tempFullscreenMode && (
        <FullscreenToast
          isOpen={fullscreenMode}
          onClose={() => setFullscreenMode(false)}
          showOnHover={isHeaderHovered}
        />
      )}
      {/* Main content area */}
      <div
        className="flex-1 transition-all duration-300 h-full min-w-0 bg-background"
        style={{
          padding: effectiveFullscreenMode ? 0 : undefined,
          // When user is admin, use hardcoded admin-background color to match admin theme
          ...(isAdmin && adminBackgroundColor
            ? {
                backgroundColor: adminBackgroundColor,
              }
            : {}),
        }}
      >
        {isAdmin ? (
          <div
            className={
              effectiveFullscreenMode ? "overflow-hidden h-full" : "rounded-[10px] overflow-hidden"
            }
            style={{
              margin: effectiveFullscreenMode ? 0 : "0px 10px 10px 10px",
              height: effectiveFullscreenMode ? "100%" : "calc(100% - 10px)",
              border: effectiveFullscreenMode ? "none" : "1px solid rgba(0, 0, 0, 0.08)",
              borderTop: effectiveFullscreenMode ? "none" : "1px solid rgba(0, 0, 0, 0.08)",
              borderRight: effectiveFullscreenMode ? "none" : "1px solid rgba(0, 0, 0, 0.08)",
              borderBottom: effectiveFullscreenMode ? "none" : "1px solid rgba(0, 0, 0, 0.08)",
              borderLeft: effectiveFullscreenMode ? "none" : "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "none",
              borderRadius: effectiveFullscreenMode ? 0 : 10,
            }}
          >
            {/* App mode: show app content */}
            <div
              className="h-full overflow-y-auto bg-background"
              style={{
                padding: effectiveFullscreenMode ? 0 : undefined,
              }}
            >
              {children}
            </div>
          </div>
        ) : (
          children
        )}
      </div>
      {/* Page Navigator Popover (only in preview mode, not in template dashboard mode) */}
      {!pathname.startsWith("/admin") && (
        <PageNavigatorPopover
          isOpen={pageNavigatorOpen}
          currentPath={currentPagePath}
          onClose={() => {
            setPageNavigatorOpen(false);
            // Reset search value when closing
            const headerIframe = document.querySelector(
              'iframe[src="/admin/header-iframe"]'
            ) as HTMLIFrameElement;
            if (headerIframe?.contentWindow) {
              headerIframe.contentWindow.postMessage(
                {
                  type: "RESET_PAGE_NAVIGATOR_SEARCH",
                  currentPath: currentPagePath,
                },
                window.location.origin
              );
            }
          }}
          sidebarOpen={false}
          position={pageNavigatorPosition}
          searchValue={pageNavigatorSearchValue}
        />
      )}
    </>
  );
}
