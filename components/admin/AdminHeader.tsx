"use client";

import { Button } from "@/components/admin-ui/button";
import { Sheet, SheetContent } from "@/components/admin-ui/sheet";
import { IframeDialog } from "@/components/admin-ui/iframe-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/admin-ui/popover";
import Link from "next/link";
import { Menu, X, Rocket, Minimize2, Eye } from "lucide-react";
import { AdminAppDetails } from "./AdminAppDetails";
import { AdminSidebar } from "./AdminSidebar";
import { UnsavedChangesContent } from "./UnsavedChangesDialog";
import { DevPublishDialog } from "./DevPublishDialog";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@prisma/client";
import confetti from "canvas-confetti";

interface AdminHeaderProps {
  appName?: string;
  appLogoUrl?: string;
  variant?: "default" | "mock";
  titleText?: string;
  logoHref?: string;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
  currentUser?: User | null; // For mobile sidebar
  hidePublishButton?: boolean;
}

export function AdminHeader({
  appName,
  appLogoUrl,
  variant = "default",
  titleText,
  logoHref,
  sidebarOpen: _sidebarOpen = true,
  onSidebarToggle: _onSidebarToggle,
  currentUser,
  hidePublishButton,
}: AdminHeaderProps) {
  const isMock = variant === "mock";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
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

  // Check if we're in an iframe
  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

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

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-[60]">
      <div className={`h-[60px] flex items-center justify-between px-[10px]`}>
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

        {/* Right side - Preview, Publish buttons, and User Avatar */}
        {!isMock && (
          <div className="flex items-center gap-2">
            {/* Preview Button */}
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm" className="text-xs font-medium">
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            </Link>
            {/* Publish Button with Popover or IframeDialog */}
            {!hidePublishButton && (
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
            )}

            {/* Shrink button - only show when in iframe */}
            {isInIframe && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleCloseIframe}
                aria-label="Shrink admin panel"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
