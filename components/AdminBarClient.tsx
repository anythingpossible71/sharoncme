"use client";

import { useSearchParams } from "next/navigation";
import { useBackgroundColor } from "@/hooks/use-background-color";
import { useState, useEffect, useRef } from "react";
import { AdminPopover, PopoverContext } from "@/components/AdminPopover";
import { ADMIN_HEADER_CONTENT_HEIGHT, ADMIN_HEADER_PADDING } from "@/lib/constants";
import { logger } from "@/lib/logger";
// Version management removed - worktree functionality disabled

export function AdminBarClient() {
  const searchParams = useSearchParams();
  const { isLight, mounted } = useBackgroundColor();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverContext, setPopoverContext] = useState<PopoverContext>("publish");
  const [triggerPosition, setTriggerPosition] = useState({ top: 0, left: 0 });
  const [currentVersion, setCurrentVersion] = useState<number | undefined>(undefined);
  const [restoreVersion, setRestoreVersion] = useState<string | undefined>(undefined);
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Use manual bgmode parameter if provided, otherwise auto-detect
  const manualBgmode = searchParams.get("bgmode");
  const autoBgmode = mounted ? (isLight ? "light" : "dark") : null;
  const bgmode = manualBgmode || autoBgmode;

  // Get version parameter from parent URL
  const version = searchParams.get("version");
  // Get viewversion parameter from URL
  const viewVersion = searchParams.get("viewversion");

  // Version manager subscription removed - worktree functionality disabled

  // Build iframe URL with bgmode, version, and viewversion parameters
  let iframeSrc = "/admin/fixed-header";
  const params = new URLSearchParams();
  if (bgmode) params.append("bgmode", bgmode);
  if (version) params.append("version", version);
  if (viewVersion) params.append("viewversion", viewVersion);
  if (params.toString()) {
    iframeSrc += `?${params.toString()}`;
  }

  // Track scroll position for header animation
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcut: Command+H (Mac) or Control+H (Windows) to toggle header
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Command+H (Mac) or Control+H (Windows/Linux)
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;

      if (modifierKey && event.key === "h") {
        event.preventDefault();
        setIsVisible((prev) => {
          const newState = !prev;
          // Set data attribute on html element so ConditionalThemeProviderClient can adjust padding
          document.documentElement.setAttribute(
            "data-admin-bar-hidden",
            newState ? "true" : "false"
          );
          logger.info("[AdminBar] Toggled visibility via keyboard shortcut (Cmd/Ctrl+H)", {
            state: newState ? "hidden" : "visible",
          });
          return newState;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Set initial data attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-admin-bar-hidden", isVisible ? "false" : "true");
  }, [isVisible]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "ADMIN_HEADER_CLICK") {
        // Calculate position relative to iframe
        if (iframeRef.current) {
          const iframeRect = iframeRef.current.getBoundingClientRect();
          const triggerPos = {
            top: iframeRect.top + iframeRect.height - 40,
            left: iframeRect.right - 200,
          };

          if (event.data.action === "openPublishPopover") {
            // Switch to publish context or open if closed
            setPopoverContext("publish");
            setTriggerPosition(triggerPos);
            setIsPopoverOpen(true);
          } else if (event.data.action === "openVersionsDialog") {
            // Switch to versions context or open if closed
            setPopoverContext("versions");
            setTriggerPosition(triggerPos);
            setCurrentVersion(event.data.data?.viewedVersion);
            // Store restoreversion if provided
            if (event.data.data?.restoreversion) {
              setRestoreVersion(event.data.data.restoreversion);
              sessionStorage.setItem("restoreversion", event.data.data.restoreversion);
            } else {
              setRestoreVersion(undefined);
            }
            setIsPopoverOpen(true);
          } else if (event.data.action === "openRestoreDialog") {
            // Switch to restore context
            setPopoverContext("restore");
            setTriggerPosition(triggerPos);
            setRestoreVersion(event.data.data?.restoreversion || undefined);
            setIsPopoverOpen(true);
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Calculate animated values based on scroll position
  // Animation starts immediately and completes at 50px scroll
  const scrollThreshold = 50;
  const animationProgress = Math.min(scrollY / scrollThreshold, 1);
  const animatedPadding = ADMIN_HEADER_PADDING * (1 - animationProgress);
  const animatedBorderRadius = 10 * (1 - animationProgress);
  // When padding is 0, height should be content height (50px)
  // When padding is full, height should be total height (60px)
  const animatedHeight =
    ADMIN_HEADER_CONTENT_HEIGHT + ADMIN_HEADER_PADDING * 2 * (1 - animationProgress);

  // Don't render if hidden
  if (!isVisible) {
    return (
      <AdminPopover
        isOpen={isPopoverOpen}
        onClose={() => {
          setIsPopoverOpen(false);
          setRestoreVersion(undefined);
        }}
        context={popoverContext}
        triggerPosition={triggerPosition}
        currentVersion={currentVersion}
        restoreVersion={restoreVersion}
        viewVersion={viewVersion || undefined}
      />
    );
  }

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out"
        style={{
          height: `${animatedHeight}px`,
          padding: `${animatedPadding}px`,
          boxSizing: "border-box",
        }}
      >
        <iframe
          key={`admin-header-${version || "latest"}`}
          ref={iframeRef}
          src={iframeSrc}
          className="w-full h-full overflow-hidden transition-all duration-300 ease-out"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            overflow: "hidden",
            borderRadius: `${animatedBorderRadius}px`,
          }}
          title="Admin Header"
        />
      </div>

      {/* Unified Admin Popover - handles publish, versions, and restore contexts */}
      <AdminPopover
        isOpen={isPopoverOpen}
        onClose={() => {
          setIsPopoverOpen(false);
          setRestoreVersion(undefined);
        }}
        context={popoverContext}
        triggerPosition={triggerPosition}
        currentVersion={currentVersion}
        restoreVersion={restoreVersion}
        viewVersion={viewVersion || undefined}
      />
    </>
  );
}
