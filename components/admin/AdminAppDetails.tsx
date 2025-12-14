"use client";

import { PanelLeft, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/admin-ui/tabs";

interface AdminAppDetailsProps {
  appName?: string;
  appLogoUrl?: string;
  logoClassName?: string;
  textClassName?: string;
}

export function AdminAppDetails({
  appName: _appName,
  appLogoUrl: _appLogoUrl,
  logoClassName = "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden",
  textClassName: _textClassName = "text-muted-foreground",
}: AdminAppDetailsProps) {
  // Always use base classes for CrunchyCone logo
  const logoContainerClasses = logoClassName.replace("bg-muted", "").trim();
  const router = useRouter();
  const iframePathname = usePathname();
  const [isInIframe, setIsInIframe] = useState(false);
  const [parentPathname, setParentPathname] = useState<string | null>(null);

  // Initialize activeTab synchronously based on current pathname to prevent flicker
  // This runs on every render, but useState only uses the initial value on first mount
  const getInitialTab = (): "dashboard" | "preview" => {
    if (typeof window === "undefined") {
      // SSR: default to dashboard
      return "dashboard";
    }

    // Check if we're in an iframe
    const inIframe = window.self !== window.top;

    if (inIframe && window.parent && window.parent !== window) {
      try {
        const parentPath = window.parent.location.pathname;
        // Skip redirect page - default to preview (most common case when iframe loads)
        if (parentPath.startsWith("/admin/redirect")) {
          return "preview"; // Usually navigating to app, not admin
        }
        return parentPath.startsWith("/admin") ? "dashboard" : "preview";
      } catch {
        // Cross-origin or not ready - default to preview (most common case)
        // The useEffect will correct it if needed
        return "preview";
      }
    } else {
      // Not in iframe - use current pathname
      return iframePathname.startsWith("/admin") ? "dashboard" : "preview";
    }
  };

  const [activeTab, setActiveTab] = useState<"dashboard" | "preview">(() => getInitialTab());

  // Debug: Log when component mounts/renders
  useEffect(() => {
    console.log("🟢 [AdminAppDetails] COMPONENT MOUNTED/RENDERED", {
      timestamp: new Date().toISOString(),
      iframePathname,
      isInIframe: typeof window !== "undefined" ? window.self !== window.top : false,
      parentPathname:
        typeof window !== "undefined" && window.parent && window.parent !== window
          ? (() => {
              try {
                return window.parent.location.pathname;
              } catch {
                return "cross-origin";
              }
            })()
          : "N/A",
    });
  }, []);

  // Check if we're in an iframe
  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

  // Get parent window's pathname when in iframe, otherwise use current pathname
  useEffect(() => {
    // Use refs to store mutable values that persist across renders
    const stateRef = {
      lastPathname: null as string | null,
      lastActiveTab: null as "dashboard" | "preview" | null, // Track last active tab to prevent unnecessary updates
      isNavigating: false,
      navigationTimeout: null as NodeJS.Timeout | null,
      debounceTimeout: null as NodeJS.Timeout | null,
    };

    const updatePathname = () => {
      // Skip if navigation is in progress
      if (stateRef.isNavigating) {
        return;
      }

      let pathToUse: string;

      if (isInIframe && window.parent && window.parent !== window) {
        try {
          const parentPath = window.parent.location.pathname;

          // Skip update if pathname hasn't changed (prevents unnecessary re-renders)
          if (parentPath === stateRef.lastPathname) {
            return;
          }

          // Skip redirect page to prevent flicker during navigation
          if (parentPath.startsWith("/admin/redirect")) {
            console.log("🔴 [AdminAppDetails] NAVIGATION DETECTED: Redirect page", {
              timestamp: new Date().toISOString(),
              parentPath,
              lastPathname: stateRef.lastPathname,
              isNavigating: stateRef.isNavigating,
            });
            stateRef.isNavigating = true;
            // Clear all pending timeouts
            if (stateRef.navigationTimeout) clearTimeout(stateRef.navigationTimeout);
            if (stateRef.debounceTimeout) clearTimeout(stateRef.debounceTimeout);
            // Clear navigation flag after navigation completes (300ms for redirect + target page load)
            stateRef.navigationTimeout = setTimeout(() => {
              console.log("🟢 [AdminAppDetails] NAVIGATION COMPLETE: Resetting navigation flag", {
                timestamp: new Date().toISOString(),
                currentParentPath: (() => {
                  try {
                    return window.parent.location.pathname;
                  } catch {
                    return "cross-origin";
                  }
                })(),
              });
              stateRef.isNavigating = false;
              stateRef.lastPathname = null; // Reset to allow next navigation
              stateRef.lastActiveTab = null; // Reset active tab cache
            }, 500);
            return;
          }

          // Calculate new active tab
          const newActiveTab = parentPath.startsWith("/admin") ? "dashboard" : "preview";

          // Skip if active tab hasn't actually changed (prevents unnecessary re-renders)
          if (stateRef.lastActiveTab === newActiveTab) {
            stateRef.lastPathname = parentPath; // Update pathname but don't update state
            return;
          }

          // Clear any pending debounce
          if (stateRef.debounceTimeout) clearTimeout(stateRef.debounceTimeout);

          // Debounce pathname updates to prevent rapid re-renders
          stateRef.debounceTimeout = setTimeout(() => {
            // Double-check we're not navigating (might have changed during debounce)
            if (!stateRef.isNavigating) {
              stateRef.lastPathname = parentPath;
              stateRef.lastActiveTab = newActiveTab;
              pathToUse = parentPath;
              console.log("🟡 [AdminAppDetails] STATE UPDATE: setActiveTab", {
                timestamp: new Date().toISOString(),
                newActiveTab,
                parentPath,
                previousTab: stateRef.lastActiveTab,
                isNavigating: stateRef.isNavigating,
              });
              setParentPathname(pathToUse);

              // Set tab immediately based on pathname (no flicker)
              setActiveTab(newActiveTab);
            }
          }, 100); // Increased to 100ms to allow navigation to complete
        } catch {
          // Cross-origin or navigation in progress - don't update state
          // This prevents errors during navigation transitions
          return;
        }
      } else {
        // Not in iframe, use current pathname
        pathToUse = iframePathname;
        setParentPathname(pathToUse);

        // Set tab immediately based on pathname (no flicker)
        if (pathToUse.startsWith("/admin")) {
          setActiveTab("dashboard");
        } else {
          setActiveTab("preview");
        }
      }
    };

    // Initial update (no debounce for initial load)
    // Only update if the pathname has changed from the initial state
    // This prevents flicker by ensuring we only update when necessary
    if (isInIframe && window.parent && window.parent !== window) {
      try {
        const parentPath = window.parent.location.pathname;
        if (!parentPath.startsWith("/admin/redirect")) {
          stateRef.lastPathname = parentPath;
          setParentPathname(parentPath);
          const newActiveTab = parentPath.startsWith("/admin") ? "dashboard" : "preview";
          // Only update if different from current state (prevents unnecessary re-render and flicker)
          if (newActiveTab !== activeTab) {
            console.log("🟡 [AdminAppDetails] INITIAL UPDATE: Correcting tab", {
              timestamp: new Date().toISOString(),
              newActiveTab,
              currentTab: activeTab,
              parentPath,
            });
            setActiveTab(newActiveTab);
            stateRef.lastActiveTab = newActiveTab;
          } else {
            // Tab is already correct, just update the ref
            stateRef.lastActiveTab = newActiveTab;
          }
        }
      } catch {
        // Fallback to iframe pathname
        setParentPathname(iframePathname);
        const newActiveTab = iframePathname.startsWith("/admin") ? "dashboard" : "preview";
        // Only update if different from current state
        if (newActiveTab !== activeTab) {
          setActiveTab(newActiveTab);
          stateRef.lastActiveTab = newActiveTab;
        } else {
          stateRef.lastActiveTab = newActiveTab;
        }
      }
    } else {
      // Not in iframe - check if we need to update
      const newActiveTab = iframePathname.startsWith("/admin") ? "dashboard" : "preview";
      if (newActiveTab !== activeTab) {
        setActiveTab(newActiveTab);
        stateRef.lastActiveTab = newActiveTab;
      } else {
        stateRef.lastActiveTab = newActiveTab;
      }
      updatePathname();
    }

    // Listen for navigation changes from parent (primary method - no polling needed)
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "PAGE_PATH_CHANGED") {
        const newPath = event.data.path;
        // Skip redirect page updates
        if (newPath.startsWith("/admin/redirect")) {
          stateRef.isNavigating = true;
          // Clear all pending timeouts
          if (stateRef.navigationTimeout) clearTimeout(stateRef.navigationTimeout);
          if (stateRef.debounceTimeout) clearTimeout(stateRef.debounceTimeout);
          // Clear navigation flag after navigation completes
          stateRef.navigationTimeout = setTimeout(() => {
            stateRef.isNavigating = false;
            stateRef.lastPathname = null; // Reset to allow next navigation
            stateRef.lastActiveTab = null; // Reset active tab cache
          }, 500);
          return;
        }
        // Calculate new active tab
        const newActiveTab = newPath.startsWith("/admin") ? "dashboard" : "preview";

        // Skip if active tab hasn't actually changed
        if (stateRef.lastActiveTab === newActiveTab) {
          stateRef.lastPathname = newPath;
          return;
        }

        // Clear any pending debounce
        if (stateRef.debounceTimeout) clearTimeout(stateRef.debounceTimeout);
        // Debounce message-based updates too
        stateRef.debounceTimeout = setTimeout(() => {
          // Double-check we're not navigating
          if (!stateRef.isNavigating) {
            stateRef.lastPathname = newPath;
            stateRef.lastActiveTab = newActiveTab;
            console.log("🟡 [AdminAppDetails] STATE UPDATE: setActiveTab (from message)", {
              timestamp: new Date().toISOString(),
              newActiveTab,
              newPath,
              previousTab: stateRef.lastActiveTab,
              isNavigating: stateRef.isNavigating,
            });
            setParentPathname(newPath);
            // Update tab immediately
            setActiveTab(newActiveTab);
          }
        }, 100);
      }
    };

    window.addEventListener("message", handleMessage);

    // Reduced polling frequency (1000ms instead of 500ms) to reduce flicker
    // Only used as fallback if message events don't fire
    const interval = setInterval(updatePathname, 1000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(interval);
      // Clear all timeouts on cleanup
      if (stateRef.navigationTimeout) clearTimeout(stateRef.navigationTimeout);
      if (stateRef.debounceTimeout) clearTimeout(stateRef.debounceTimeout);
      // Reset state
      stateRef.isNavigating = false;
      stateRef.lastPathname = null;
    };
  }, [isInIframe, iframePathname]);

  const handleTabChange = (value: string) => {
    const tab = value as "dashboard" | "preview";
    console.log("🔵 [AdminAppDetails] TAB CLICKED", {
      timestamp: new Date().toISOString(),
      tab,
      isInIframe,
      currentParentPath:
        isInIframe && window.parent && window.parent !== window
          ? (() => {
              try {
                return window.parent.location.pathname;
              } catch {
                return "cross-origin";
              }
            })()
          : "N/A",
    });
    setActiveTab(tab);

    if (isInIframe) {
      // Iframe context (header iframe): navigate via redirect page for clean theme transition
      if (tab === "dashboard") {
        // Navigate parent window via redirect page to ensure clean theme state
        // Use replace() to avoid history entry
        if (window.parent) {
          const redirectUrl = `/admin/redirect?url=${encodeURIComponent("/admin")}`;
          window.parent.location.replace(redirectUrl);
        }
      }
      // Preview tab: navigate parent window via redirect page
      if (tab === "preview") {
        if (window.parent) {
          const redirectUrl = `/admin/redirect?url=${encodeURIComponent("/")}`;
          window.parent.location.replace(redirectUrl);
        }
      }
    } else {
      // Flattened layout context: redirect via redirect page for clean theme transition
      if (tab === "dashboard") {
        // Navigate via redirect page to ensure clean theme state
        const redirectUrl = `/admin/redirect?url=${encodeURIComponent("/admin")}`;
        router.push(redirectUrl);
      } else if (tab === "preview") {
        // Navigate via redirect page to ensure clean theme state
        const redirectUrl = `/admin/redirect?url=${encodeURIComponent("/")}`;
        router.push(redirectUrl);
      }
    }
  };

  // activeTab is now always set (never null), so we always render

  return (
    <>
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger
            value="dashboard"
            className="flex items-center gap-2 data-[state=active]:bg-red-500"
          >
            <PanelLeft className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="flex items-center gap-2 data-[state=active]:bg-red-500"
          >
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </>
  );
}
