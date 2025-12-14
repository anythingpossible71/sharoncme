"use client";

import { Button } from "@/components/admin-ui/button";
import { Sheet, SheetContent } from "@/components/admin-ui/sheet";
import { IframeDialog } from "@/components/admin-ui/iframe-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/admin-ui/popover";
import Link from "next/link";
import { Menu, X, Rocket, Maximize } from "lucide-react";
import { AdminAppDetails } from "./AdminAppDetails";
import { AdminSidebar } from "./AdminSidebar";
import { UnsavedChangesContent } from "./UnsavedChangesDialog";
import { DevPublishDialog } from "./DevPublishDialog";
import { PageNavigator } from "./PageNavigator";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@prisma/client";
import confetti from "canvas-confetti";

interface IframeHeaderProps {
  appName?: string;
  appLogoUrl?: string;
  variant?: "default" | "mock";
  titleText?: string;
  logoHref?: string;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
  currentUser?: User | null; // For mobile sidebar
}

export function IframeHeader({
  appName,
  appLogoUrl,
  variant = "default",
  titleText,
  logoHref,
  sidebarOpen: _sidebarOpen = true,
  onSidebarToggle: _onSidebarToggle,
  currentUser,
}: IframeHeaderProps) {
  // Debug: Log when component mounts/renders
  useEffect(() => {
    const mountInfo = {
      timestamp: new Date().toISOString(),
      pathname: typeof window !== "undefined" ? window.location.pathname : "SSR",
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
      renderCount: ((window as any).__iframeHeaderRenderCount =
        ((window as any).__iframeHeaderRenderCount || 0) + 1),
    };
    console.log("🟢 [IframeHeader] COMPONENT MOUNTED/RENDERED", mountInfo);
  }, []);
  const isMock = variant === "mock";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(true); // Default to preview mode
  const [unsavedPopoverOpen, setUnsavedPopoverOpen] = useState(false);
  const [canPublish, setCanPublish] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "waiting" | "building" | "ready">(
    "idle"
  );
  const [publishPopoverOpen, setPublishPopoverOpen] = useState(false);
  const [appDetailsExpanded, setAppDetailsExpanded] = useState(false);
  const [isPublished, setIsPublished] = useState(false); // Track published state from DevPublishDialog
  const [isBuilding, setIsBuilding] = useState(false); // Track building state
  const pathname = usePathname();

  // Update popover height when app details expand or published state changes
  useEffect(() => {
    if (publishPopoverOpen) {
      const popover = document.querySelector("[data-radix-popper-content-wrapper]");
      if (popover) {
        const popoverElement = popover as HTMLElement;
        if (isBuilding) {
          // When building, set to 80px
          popoverElement.style.height = "80px";
          popoverElement.style.maxHeight = "80px";
        } else if (isPublished) {
          // When published, reduce by 200px from default (150px instead of 350px)
          popoverElement.style.height = "150px";
          popoverElement.style.maxHeight = "150px";
        } else if (appDetailsExpanded) {
          // Calculate available space (increased by 50px)
          const maxHeight = Math.min(window.innerHeight - 100, 600);
          popoverElement.style.height = `${maxHeight}px`;
          popoverElement.style.maxHeight = `${window.innerHeight - 100}px`;
        } else {
          // Default height increased by 50px
          popoverElement.style.height = "350px";
          popoverElement.style.maxHeight = "350px";
        }
      }
    }
  }, [appDetailsExpanded, publishPopoverOpen, isPublished, isBuilding]);

  // Check if we're in an iframe and determine if we're in preview mode
  useEffect(() => {
    const checkIframe = window.self !== window.top;
    setIsInIframe(checkIframe);

    // Use refs to store mutable values that persist across renders
    const stateRef = {
      lastPathname: null as string | null,
      lastPreviewMode: null as boolean | null, // Track last preview mode to prevent unnecessary updates
      isNavigating: false,
      navigationTimeout: null as NodeJS.Timeout | null,
      debounceTimeout: null as NodeJS.Timeout | null,
    };

    // Check parent pathname to determine if we're in preview mode (not admin mode)
    const checkPreviewMode = () => {
      // Skip if navigation is in progress
      if (stateRef.isNavigating) {
        return;
      }

      if (checkIframe && window.parent && window.parent !== window) {
        try {
          const parentPath = window.parent.location.pathname;

          // Skip update if pathname hasn't changed (prevents unnecessary re-renders)
          if (parentPath === stateRef.lastPathname) {
            return;
          }

          // Skip redirect page to prevent flicker during navigation
          if (parentPath.startsWith("/admin/redirect")) {
            console.log("🔴 [IframeHeader] NAVIGATION DETECTED: Redirect page", {
              timestamp: new Date().toISOString(),
              parentPath,
              lastPathname: stateRef.lastPathname,
              isNavigating: stateRef.isNavigating,
            });
            stateRef.isNavigating = true;
            // Clear all pending timeouts
            if (stateRef.navigationTimeout) clearTimeout(stateRef.navigationTimeout);
            if (stateRef.debounceTimeout) clearTimeout(stateRef.debounceTimeout);
            // Clear navigation flag after navigation completes (500ms for redirect + target page load + React hydration)
            stateRef.navigationTimeout = setTimeout(() => {
              console.log("🟢 [IframeHeader] NAVIGATION COMPLETE: Resetting navigation flag", {
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
              stateRef.lastPreviewMode = null; // Reset preview mode cache
            }, 500);
            return;
          }

          // Calculate new preview mode
          const newPreviewMode = !parentPath.startsWith("/admin");

          // Skip if preview mode hasn't actually changed (prevents unnecessary re-renders)
          if (stateRef.lastPreviewMode === newPreviewMode) {
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
              stateRef.lastPreviewMode = newPreviewMode;
              // Preview mode = not in admin pages
              const updateInfo = {
                timestamp: new Date().toISOString(),
                newPreviewMode,
                parentPath,
                previousMode: stateRef.lastPreviewMode,
                isNavigating: stateRef.isNavigating,
                updateCount: ((window as any).__iframeHeaderUpdateCount =
                  ((window as any).__iframeHeaderUpdateCount || 0) + 1),
              };
              console.log("🟡 [IframeHeader] STATE UPDATE: setIsPreviewMode", updateInfo);
              setIsPreviewMode(newPreviewMode);
            }
          }, 100); // Increased to 100ms to allow navigation to complete
        } catch {
          // Cross-origin or navigation in progress - don't update state
          // This prevents errors during navigation transitions
          return;
        }
      } else {
        // Not in iframe - check current pathname
        const isPreview = !pathname.startsWith("/admin");
        // Only update if it actually changed
        if (stateRef.lastPreviewMode !== isPreview) {
          console.log("🟡 [IframeHeader] STATE UPDATE: setIsPreviewMode (not in iframe)", {
            timestamp: new Date().toISOString(),
            newPreviewMode: isPreview,
            pathname,
            previousMode: stateRef.lastPreviewMode,
          });
          stateRef.lastPreviewMode = isPreview;
          setIsPreviewMode(isPreview);
        }
      }
    };

    checkPreviewMode();

    // Listen for pathname changes from parent (primary method - no polling needed)
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
            stateRef.lastPreviewMode = null; // Reset preview mode cache
          }, 500);
          return;
        }

        // Calculate new preview mode
        const newPreviewMode = !newPath.startsWith("/admin");

        // Skip if preview mode hasn't actually changed
        if (stateRef.lastPreviewMode === newPreviewMode) {
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
            stateRef.lastPreviewMode = newPreviewMode;
            console.log("🟡 [IframeHeader] STATE UPDATE: setIsPreviewMode (from message)", {
              timestamp: new Date().toISOString(),
              newPreviewMode,
              newPath,
              previousMode: stateRef.lastPreviewMode,
              isNavigating: stateRef.isNavigating,
            });
            setIsPreviewMode(newPreviewMode);
          }
        }, 100);
      }
    };

    window.addEventListener("message", handleMessage);

    // Reduced polling frequency (1000ms instead of 500ms) to reduce flicker
    // Only used as fallback if message events don't fire
    const interval = setInterval(checkPreviewMode, 1000);

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
  }, [pathname]);

  // Close mobile sidebar when pathname changes (navigation occurred)
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // Auto-trigger publish dialog when canPublish becomes true
  useEffect(() => {
    if (canPublish) {
      // Trigger a click on the iframe dialog trigger button
      setTimeout(() => {
        const iframeTrigger = document.querySelector("[data-publish-iframe-trigger]");
        if (iframeTrigger) {
          (iframeTrigger as HTMLElement).click();
          setCanPublish(false); // Reset so next check works
        }
      }, 0);
    }
  }, [canPublish]);

  const handleButtonClick = () => {
    setMobileSidebarOpen((prev) => !prev);
  };

  const handleCloseIframe = () => {
    if (isInIframe && window.parent) {
      window.parent.postMessage({ type: "CLOSE_ADMIN_IFRAME" }, "*");
    }
  };

  const handleFullscreenClick = () => {
    if (isInIframe && window.parent) {
      window.parent.postMessage(
        {
          type: "TOGGLE_FULLSCREEN_MODE",
        },
        window.location.origin
      );
    }
  };

  const handlePublishClick = async () => {
    // Reset published and building states when opening popover from publish button
    setIsPublished(false);
    setIsBuilding(false);

    // Close any open popovers first
    setUnsavedPopoverOpen(false);
    setPublishPopoverOpen(false);

    // Check if ready to publish - if so, open publish dialog popover
    if (publishStatus === "ready") {
      // TODO: Check if there's a version ready for dev
      // For now, simulate having a version ready
      const hasVersionReady = true; // TODO: Check from API

      if (hasVersionReady) {
        setPublishPopoverOpen(true);
        return;
      }

      setCanPublish(true);
      return;
    }

    // For idle status, check publish status from API
    // Check publish status from API
    try {
      const response = await fetch("/api/admin/check-publish-status");
      const data = await response.json();

      const hasPushedVersions = data.hasPushedVersions ?? false;
      const hasUncommittedChanges = data.hasUncommittedChanges ?? false;

      // Show unsaved changes popover if no pushed versions OR there are uncommitted changes
      if (!hasPushedVersions || hasUncommittedChanges) {
        setUnsavedPopoverOpen(true);
        return;
      }
    } catch (error) {
      // On error, assume we need to check - show unsaved popover
      setUnsavedPopoverOpen(true);
      return;
    }

    // If conditions are met, allow the publish dialog to open
    setCanPublish(true);
  };

  const handlePromptRun = async () => {
    // Close unsaved popover
    setUnsavedPopoverOpen(false);

    // Start the listening mode
    setPublishStatus("waiting");

    // After 1 second, change to "Building..."
    setTimeout(() => {
      setPublishStatus("building");
    }, 1000);

    // After 4 seconds total (1s waiting + 3s building), show building popover
    setTimeout(async () => {
      setPublishStatus("ready");

      // Open publish popover with building state
      setPublishPopoverOpen(true);
      setIsBuilding(true);
      setIsPublished(false);

      // After a few seconds (simulating build time), switch to celebration
      // TODO: Replace with actual build status check
      setTimeout(() => {
        setIsBuilding(false);
        setIsPublished(true);

        // Trigger confetti effect
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

        function randomInRange(min: number, max: number) {
          return Math.random() * (max - min) + min;
        }

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          });
        }, 250);
      }, 3000); // Wait 3 seconds for build simulation
    }, 4000);
  };

  // Determine title text based on variant
  const displayTitle =
    titleText || (isMock ? "Crunchy<cone>" : `Project Admin: ${appName || "Your App"}`);

  // Determine logo href based on variant
  const displayLogoHref = logoHref || (isMock ? "/admin/my-projects" : "/admin/dashboard");

  const handleHeaderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if click is outside the page navigator input
    const target = e.target as HTMLElement;
    const pageNavigatorInput = target.closest('input[placeholder="/page-path"]');

    // If click is outside the page navigator input, close the menu
    if (!pageNavigatorInput && window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "CLOSE_PAGE_NAVIGATOR",
        },
        window.location.origin
      );
    }
  };

  return (
    <header
      className="backdrop-blur relative z-[60]"
      style={{
        backgroundColor: "hsl(var(--admin-background) / 0.95)",
      }}
    >
      <div
        className="h-[60px] flex items-center justify-between px-[10px]"
        style={{
          backgroundColor: "hsl(var(--admin-background))",
        }}
        onClick={handleHeaderClick}
      >
        {/* Left side - Mobile Menu (mobile only) and Logo */}
        <div className="flex items-center flex-shrink-0">
          {!isMock && (
            <>
              {/* Mobile Sidebar Toggle Button - Below 1024px */}
              <div className="lg:hidden mr-2 relative z-[61]">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleButtonClick}
                  className="relative z-[62]"
                >
                  {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  <span className="sr-only">Toggle sidebar</span>
                </Button>
                <Sheet
                  open={mobileSidebarOpen}
                  onOpenChange={() => {
                    // Ignore all Sheet-initiated changes - we control state via button only
                    // This prevents the toggle loop when clicking X
                  }}
                  modal={false}
                >
                  <SheetContent
                    side="left"
                    hideOverlay={true}
                    className="w-64 p-0 !top-[50px] !bottom-auto h-[calc(100vh-50px)] [&>button]:hidden z-50"
                    style={{
                      top: "50px",
                      bottom: "auto",
                      height: "calc(100vh - 50px)",
                    }}
                  >
                    <AdminSidebar currentUser={currentUser} appName={appName} />
                  </SheetContent>
                </Sheet>
              </div>
            </>
          )}
          <div className={`flex items-center gap-2`}>
            {!isMock && <AdminAppDetails appName={appName} appLogoUrl={appLogoUrl} />}
            {isMock && (
              <Link href={displayLogoHref}>
                <span
                  className="font-light text-sm"
                  style={{
                    fontFamily: '"Google Sans Code", monospace',
                  }}
                >
                  {displayTitle}
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Middle - Page Navigator (only in preview mode, not in template dashboard mode) */}
        {!isMock && isPreviewMode && <PageNavigator />}

        {/* Right side - Preview, Publish buttons, and User Avatar */}
        {!isMock && (
          <div className="flex items-center gap-2">
            {/* Publish Button with Popover or IframeDialog */}
            <div className="relative">
              <Popover
                open={unsavedPopoverOpen || publishPopoverOpen}
                onOpenChange={(open) => {
                  if (!open) {
                    setUnsavedPopoverOpen(false);
                    setPublishPopoverOpen(false);
                    setAppDetailsExpanded(false); // Reset when popover closes
                  }
                }}
              >
                {canPublish ? (
                  <IframeDialog
                    trigger={
                      <Button
                        variant="default"
                        size="sm"
                        className="text-xs font-medium"
                        data-publish-iframe-trigger
                      >
                        <Rocket className="h-4 w-4" />
                        Publish
                      </Button>
                    }
                    src="/admin/app-details-iframe"
                    title="Publish App"
                    width={600}
                    height={600}
                  />
                ) : (
                  <>
                    <PopoverTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className={`text-xs font-medium relative overflow-hidden ${
                          publishStatus !== "idle" && publishStatus !== "ready"
                            ? "animate-shimmer"
                            : ""
                        }`}
                        onClick={(e) => {
                          // Prevent default popover open, we'll control it manually
                          e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                          // Handle click manually
                          e.preventDefault();
                          handlePublishClick();
                        }}
                        disabled={
                          (publishStatus !== "idle" && publishStatus !== "ready") ||
                          unsavedPopoverOpen ||
                          publishPopoverOpen
                        }
                      >
                        {(publishStatus === "waiting" || publishStatus === "building") && (
                          <div
                            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            style={{
                              animation: "shimmer 2s infinite",
                            }}
                          />
                        )}
                        {publishStatus === "waiting" && (
                          <span className="relative z-10">Waiting...</span>
                        )}
                        {publishStatus === "building" && (
                          <span className="relative z-10">Building...</span>
                        )}
                        {publishStatus === "ready" && (
                          <>
                            <Rocket className="h-4 w-4" />
                            <span>Publish</span>
                          </>
                        )}
                        {publishStatus === "idle" && (
                          <>
                            <Rocket className="h-4 w-4" />
                            <span>Publish</span>
                          </>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[500px] p-0 overflow-hidden flex flex-col"
                      align="end"
                      side="bottom"
                      sideOffset={8}
                      style={{
                        height: unsavedPopoverOpen
                          ? "350px"
                          : isBuilding
                            ? "80px" // Building state height
                            : isPublished
                              ? "150px" // Reduced by 200px when published (from 350px)
                              : appDetailsExpanded
                                ? `${Math.min(window.innerHeight - 100, 600)}px`
                                : "350px",
                        maxHeight: unsavedPopoverOpen
                          ? "350px"
                          : isBuilding
                            ? "80px" // Building state height
                            : isPublished
                              ? "150px" // Reduced by 200px when published
                              : appDetailsExpanded
                                ? `${window.innerHeight - 100}px`
                                : "350px",
                      }}
                    >
                      {unsavedPopoverOpen ? (
                        <UnsavedChangesContent
                          onPromptRun={handlePromptRun}
                          onCancel={() => setUnsavedPopoverOpen(false)}
                        />
                      ) : isBuilding ? (
                        /* Building State */
                        <div className="p-6 flex items-center justify-center h-full">
                          <p className="text-sm text-muted-foreground text-center">
                            Your app is being built. This might take a few minutes
                          </p>
                        </div>
                      ) : isPublished ? (
                        /* Celebration State */
                        <div className="p-6 flex flex-col h-full">
                          <div className="flex-1">
                            <h2 className="text-lg font-semibold mb-2">
                              Your recent version is live 🎉
                            </h2>
                            <p className="text-sm text-muted-foreground mb-4">
                              Click to view your latest version
                            </p>
                            <a
                              href="https://myproject.crunchycone.dev"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-base font-medium text-primary hover:underline transition-colors block"
                            >
                              https://myproject.crunchycone.dev
                            </a>
                          </div>
                        </div>
                      ) : (
                        <DevPublishDialog
                          subdomain="myproject"
                          hasPublished={false}
                          isAvailable={true}
                          showFixedBottomBar={false}
                          onDetailsExpand={(expanded) => {
                            setAppDetailsExpanded(expanded);
                          }}
                          onPublished={(published) => {
                            setIsPublished(published);
                          }}
                        />
                      )}
                    </PopoverContent>
                  </>
                )}
              </Popover>
            </div>

            {/* Fullscreen button - only show when in iframe */}
            {isInIframe && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleFullscreenClick}
                aria-label="Toggle fullscreen mode"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
