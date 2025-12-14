"use client";

import { Button } from "@/components/admin-ui/button";
import { IframeDialog } from "@/components/admin-ui/iframe-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/admin-ui/popover";
import Link from "next/link";
import { Rocket, Maximize, PanelLeft, Eye } from "lucide-react";
import { UnsavedChangesContent } from "./UnsavedChangesDialog";
import { DevPublishDialog } from "./DevPublishDialog";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@prisma/client";
import confetti from "canvas-confetti";

interface HeaderCloneProps {
  appName?: string;
  appLogoUrl?: string;
  variant?: "default" | "mock";
  titleText?: string;
  logoHref?: string;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
  currentUser?: User | null;
  activeTab?: "dashboard" | "preview"; // Explicit prop to control which tab is selected
  hidePublishButton?: boolean;
}

// Admin theme CSS variable values stored in refs (read once, never change)
interface AdminThemeVars {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  radius: string;
}

export function HeaderClone({
  appName,
  appLogoUrl,
  variant = "default",
  titleText,
  logoHref,
  sidebarOpen: _sidebarOpen = true,
  onSidebarToggle: _onSidebarToggle,
  currentUser,
  activeTab: activeTabProp,
  hidePublishButton,
}: HeaderCloneProps) {
  const isMock = variant === "mock";
  const router = useRouter();
  const pathname = usePathname();
  const [isInIframe, setIsInIframe] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [unsavedPopoverOpen, setUnsavedPopoverOpen] = useState(false);
  const [canPublish, setCanPublish] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "waiting" | "building" | "ready">(
    "idle"
  );
  const [publishPopoverOpen, setPublishPopoverOpen] = useState(false);
  const [appDetailsExpanded, setAppDetailsExpanded] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);

  // Determine active navigation link - use prop if provided, otherwise fall back to isPreviewMode
  // This allows each instance to have its own tab selection independent of external logic
  const activeNav: "dashboard" | "preview" =
    activeTabProp !== undefined ? activeTabProp : isPreviewMode ? "preview" : "dashboard";

  // Hardcoded page navigator state (replacing PageNavigator)
  const [currentPath, setCurrentPath] = useState<string>("/");

  // HARDCODED admin theme values - completely agnostic to app theme
  // These values are taken directly from app/admin/admin.css [data-admin-theme="light"]
  // They never change regardless of app theme changes - 100% protection
  const adminThemeVars: AdminThemeVars = {
    background: "216 19% 95%",
    foreground: "222.2 84% 4.9%",
    card: "0 0% 100%",
    cardForeground: "222.2 84% 4.9%",
    popover: "0 0% 100%",
    popoverForeground: "222.2 84% 4.9%",
    primary: "210 81% 17%",
    primaryForeground: "210 40% 98%",
    secondary: "210 40% 91.7%",
    secondaryForeground: "210 81% 17%",
    muted: "210 40% 91.7%",
    mutedForeground: "215.4 16.3% 46.9%",
    accent: "210 40% 96.1%",
    accentForeground: "210 81% 17%",
    destructive: "0 84.2% 60.2%",
    destructiveForeground: "210 40% 98%",
    border: "214.3 31.8% 91.4%",
    input: "214.3 31.8% 91.4%",
    ring: "210 81% 17%",
    radius: "0.5rem",
  };

  // Helper to get HSL color from hardcoded admin theme values
  const getHsl = (varName: keyof AdminThemeVars, opacity?: number) => {
    const value = adminThemeVars[varName];
    return opacity !== undefined ? `hsl(${value} / ${opacity})` : `hsl(${value})`;
  };

  // Update popover height when app details expand or published state changes
  useEffect(() => {
    if (publishPopoverOpen) {
      const popover = document.querySelector("[data-radix-popper-content-wrapper]");
      if (popover) {
        const popoverElement = popover as HTMLElement;
        if (isBuilding) {
          popoverElement.style.height = "80px";
          popoverElement.style.maxHeight = "80px";
        } else if (isPublished) {
          popoverElement.style.height = "150px";
          popoverElement.style.maxHeight = "150px";
        } else if (appDetailsExpanded) {
          const maxHeight = Math.min(window.innerHeight - 100, 600);
          popoverElement.style.height = `${maxHeight}px`;
          popoverElement.style.maxHeight = `${window.innerHeight - 100}px`;
        } else {
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

    const stateRef = {
      lastPathname: null as string | null,
      lastPreviewMode: null as boolean | null,
      isNavigating: false,
      navigationTimeout: null as NodeJS.Timeout | null,
      debounceTimeout: null as NodeJS.Timeout | null,
    };

    const checkPreviewMode = () => {
      if (stateRef.isNavigating) {
        return;
      }

      if (checkIframe && window.parent && window.parent !== window) {
        try {
          const parentPath = window.parent.location.pathname;

          if (parentPath === stateRef.lastPathname) {
            return;
          }

          if (parentPath.startsWith("/admin/redirect")) {
            stateRef.isNavigating = true;
            if (stateRef.navigationTimeout) clearTimeout(stateRef.navigationTimeout);
            if (stateRef.debounceTimeout) clearTimeout(stateRef.debounceTimeout);
            stateRef.navigationTimeout = setTimeout(() => {
              stateRef.isNavigating = false;
              stateRef.lastPathname = null;
              stateRef.lastPreviewMode = null;
            }, 500);
            return;
          }

          const newPreviewMode = !parentPath.startsWith("/admin");

          if (stateRef.lastPreviewMode === newPreviewMode) {
            stateRef.lastPathname = parentPath;
            return;
          }

          if (stateRef.debounceTimeout) clearTimeout(stateRef.debounceTimeout);

          stateRef.debounceTimeout = setTimeout(() => {
            if (!stateRef.isNavigating) {
              stateRef.lastPathname = parentPath;
              stateRef.lastPreviewMode = newPreviewMode;
              setIsPreviewMode(newPreviewMode);
            }
          }, 100);
        } catch {
          return;
        }
      } else {
        const isPreview = !pathname.startsWith("/admin");
        if (stateRef.lastPreviewMode !== isPreview) {
          stateRef.lastPreviewMode = isPreview;
          setIsPreviewMode(isPreview);
        }
      }
    };

    checkPreviewMode();

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "PAGE_PATH_CHANGED") {
        const newPath = event.data.path;
        if (newPath.startsWith("/admin/redirect")) {
          stateRef.isNavigating = true;
          if (stateRef.navigationTimeout) clearTimeout(stateRef.navigationTimeout);
          if (stateRef.debounceTimeout) clearTimeout(stateRef.debounceTimeout);
          stateRef.navigationTimeout = setTimeout(() => {
            stateRef.isNavigating = false;
            stateRef.lastPathname = null;
            stateRef.lastPreviewMode = null;
          }, 500);
          return;
        }

        const newPreviewMode = !newPath.startsWith("/admin");

        if (stateRef.lastPreviewMode === newPreviewMode) {
          stateRef.lastPathname = newPath;
          return;
        }

        if (stateRef.debounceTimeout) clearTimeout(stateRef.debounceTimeout);
        stateRef.debounceTimeout = setTimeout(() => {
          if (!stateRef.isNavigating) {
            stateRef.lastPathname = newPath;
            stateRef.lastPreviewMode = newPreviewMode;
            setIsPreviewMode(newPreviewMode);
          }
        }, 100);
      }
    };

    window.addEventListener("message", handleMessage);
    const interval = setInterval(checkPreviewMode, 1000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(interval);
      if (stateRef.navigationTimeout) clearTimeout(stateRef.navigationTimeout);
      if (stateRef.debounceTimeout) clearTimeout(stateRef.debounceTimeout);
      stateRef.isNavigating = false;
      stateRef.lastPathname = null;
    };
  }, [pathname]);

  useEffect(() => {
    if (canPublish) {
      setTimeout(() => {
        const iframeTrigger = document.querySelector("[data-publish-iframe-trigger]");
        if (iframeTrigger) {
          (iframeTrigger as HTMLElement).click();
          setCanPublish(false);
        }
      }, 0);
    }
  }, [canPublish]);

  const handleCloseIframe = () => {
    if (isInIframe && window.parent) {
      window.parent.postMessage({ type: "CLOSE_ADMIN_IFRAME" }, "*");
    }
  };

  const handleFullscreenClick = () => {
    // Send message to toggle fullscreen mode (AdminIframesClient and SidebarToggle listen for this)
    window.postMessage(
      {
        type: "TOGGLE_FULLSCREEN_MODE",
      },
      window.location.origin
    );
  };

  const handlePublishClick = async () => {
    setIsPublished(false);
    setIsBuilding(false);
    setUnsavedPopoverOpen(false);
    setPublishPopoverOpen(false);

    if (publishStatus === "ready") {
      const hasVersionReady = true;
      if (hasVersionReady) {
        setPublishPopoverOpen(true);
        return;
      }
      setCanPublish(true);
      return;
    }

    try {
      const response = await fetch("/api/admin/check-publish-status");
      const data = await response.json();
      const hasPushedVersions = data.hasPushedVersions ?? false;
      const hasUncommittedChanges = data.hasUncommittedChanges ?? false;

      if (!hasPushedVersions || hasUncommittedChanges) {
        setUnsavedPopoverOpen(true);
        return;
      }
    } catch (error) {
      setUnsavedPopoverOpen(true);
      return;
    }

    setCanPublish(true);
  };

  const handlePromptRun = async () => {
    setUnsavedPopoverOpen(false);
    setPublishStatus("waiting");

    setTimeout(() => {
      setPublishStatus("building");
    }, 1000);

    setTimeout(async () => {
      setPublishStatus("ready");
      setPublishPopoverOpen(true);
      setIsBuilding(true);
      setIsPublished(false);

      setTimeout(() => {
        setIsBuilding(false);
        setIsPublished(true);

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
      }, 3000);
    }, 4000);
  };

  const displayTitle =
    titleText || (isMock ? "Crunchy<cone>" : `Project Admin: ${appName || "Your App"}`);

  const displayLogoHref = logoHref || (isMock ? "/admin/my-projects" : "/admin/dashboard");

  const handleHeaderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const pageNavigatorInput = target.closest('input[placeholder="/page-path"]');

    if (!pageNavigatorInput && window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "CLOSE_PAGE_NAVIGATOR",
        },
        window.location.origin
      );
    }
  };

  // Update current path for page navigator
  useEffect(() => {
    const updatePath = () => {
      if (window.parent && window.parent !== window) {
        try {
          const parentPath = window.parent.location.pathname;
          setCurrentPath(parentPath);
        } catch {
          setCurrentPath("/");
        }
      } else {
        setCurrentPath(pathname);
      }
    };

    updatePath();
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "PAGE_PATH_CHANGED") {
        setCurrentPath(event.data.path);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [pathname]);

  // Handle navigation link click - navigate to the appropriate route
  const handleNavClick = (nav: "dashboard" | "preview") => {
    if (isInIframe && window.parent) {
      const redirectUrl = `/admin/redirect?url=${encodeURIComponent(nav === "dashboard" ? "/admin" : "/")}`;
      window.parent.location.replace(redirectUrl);
    } else {
      const redirectUrl = `/admin/redirect?url=${encodeURIComponent(nav === "dashboard" ? "/admin" : "/")}`;
      router.push(redirectUrl);
    }
  };

  // Get admin theme colors for inline styles - HARDCODED VALUES
  const bgColor = getHsl("background");
  const bgColorWithOpacity = getHsl("background", 0.95);
  const textColor = getHsl("foreground");
  const primaryColor = getHsl("primary");
  const primaryFgColor = getHsl("primaryForeground");
  const borderColor = getHsl("border");
  const mutedColor = getHsl("muted");
  const mutedFgColor = getHsl("mutedForeground");
  const popoverBg = getHsl("popover");
  const popoverFg = getHsl("popoverForeground");
  const cardColor = getHsl("card");
  const accentColor = getHsl("accent");

  // Hardcoded tab colors based on admin theme - matching exact admin tab styling
  // TabsList: bg-muted background with text-muted-foreground
  // Active tab: bg-background (light grey, NOT white!) text-foreground (dark) with shadow-sm
  // Inactive tab: transparent background, text-muted-foreground
  const tabsListBg = getHsl("muted"); // Light grey background for tabs container
  const tabsListText = getHsl("mutedForeground"); // Muted text color
  const activeTabBg = bgColor; // bg-background = admin background (light grey): hsl(216 19% 95%)
  const activeTabText = textColor; // Dark text: hsl(222.2 84% 4.9%)
  const inactiveTabText = mutedFgColor; // Muted text: hsl(215.4 16.3% 46.9%)

  // Hardcoded input colors
  const inputBg = cardColor; // White: hsl(0 0% 100%)
  const inputBorder = borderColor; // Light grey: hsl(214.3 31.8% 91.4%)

  // HARDCODED font family and sizes - completely isolated from app theme
  // Admin theme uses: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
  const adminFontFamily =
    'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const adminFontSizeBase = "0.875rem"; // text-sm = 14px
  const adminFontSizeSmall = "0.75rem"; // text-xs = 12px
  const adminFontWeightMedium = 500; // font-medium
  const adminFontWeightNormal = 400; // font-normal

  return (
    <header
      style={{
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        position: "relative",
        zIndex: 60,
        backgroundColor: bgColorWithOpacity,
        fontFamily: adminFontFamily,
        fontSize: adminFontSizeBase,
      }}
    >
      <div
        style={{
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: "10px",
          paddingRight: "10px",
          backgroundColor: bgColor,
          fontFamily: adminFontFamily,
          fontSize: adminFontSizeBase,
        }}
        onClick={handleHeaderClick}
      >
        {/* Left side - Mobile Menu (mobile only) and Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            fontFamily: adminFontFamily, // HARDCODED
            fontSize: adminFontSizeBase, // HARDCODED
          }}
        >
          {/* No menu button in inline header - removed per user request */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: adminFontFamily, // HARDCODED
              fontSize: adminFontSizeBase, // HARDCODED
            }}
          >
            {!isMock && (
              // Hardcoded tabs (replacing AdminAppDetails) - EXACT match to header iframe tabs
              // TabsList: h-10 (40px), rounded-md (0.375rem), bg-muted, p-1 (4px padding)
              // TabsTrigger: px-3 (12px) py-1.5 (6px), rounded-sm (0.125rem)
              // Active: bg-background (white), text-foreground, shadow-sm
              <div
                style={{
                  display: "inline-flex",
                  height: "40px",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "0.375rem", // rounded-md
                  backgroundColor: tabsListBg, // bg-muted
                  color: tabsListText, // text-muted-foreground
                  padding: "4px", // p-1
                  fontFamily: adminFontFamily, // HARDCODED
                  fontSize: adminFontSizeBase, // HARDCODED
                }}
              >
                <button
                  type="button"
                  onClick={() => handleNavClick("dashboard")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px", // gap-2
                    whiteSpace: "nowrap",
                    borderRadius: "0.125rem", // rounded-sm
                    fontSize: adminFontSizeBase, // text-sm = 0.875rem
                    fontWeight: adminFontWeightMedium, // font-medium = 500
                    transition: "all 0.2s",
                    cursor: "pointer",
                    border: "none",
                    fontFamily: adminFontFamily, // HARDCODED - not inherit
                    paddingLeft: "12px", // px-3
                    paddingRight: "12px", // px-3
                    paddingTop: "6px", // py-1.5
                    paddingBottom: "6px", // py-1.5
                    backgroundColor: activeNav === "dashboard" ? activeTabBg : "transparent", // Active state based on route
                    color: activeNav === "dashboard" ? activeTabText : inactiveTabText, // Active state based on route
                    boxShadow:
                      activeNav === "dashboard" ? "0 1px 2px 0 rgba(0, 0, 0, 0.05)" : "none", // shadow-sm
                  }}
                >
                  <PanelLeft style={{ width: "16px", height: "16px" }} />
                  <span style={{ fontFamily: adminFontFamily, fontSize: adminFontSizeBase }}>
                    Dashboard
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick("preview")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px", // gap-2
                    whiteSpace: "nowrap",
                    borderRadius: "0.125rem", // rounded-sm
                    fontSize: adminFontSizeBase, // text-sm = 0.875rem
                    fontWeight: adminFontWeightMedium, // font-medium = 500
                    transition: "all 0.2s",
                    cursor: "pointer",
                    border: "none",
                    fontFamily: adminFontFamily, // HARDCODED - not inherit
                    paddingLeft: "12px", // px-3
                    paddingRight: "12px", // px-3
                    paddingTop: "6px", // py-1.5
                    paddingBottom: "6px", // py-1.5
                    backgroundColor: activeNav === "preview" ? activeTabBg : "transparent", // Active state based on route
                    color: activeNav === "preview" ? activeTabText : inactiveTabText, // Active state based on route
                    boxShadow: activeNav === "preview" ? "0 1px 2px 0 rgba(0, 0, 0, 0.05)" : "none", // shadow-sm
                  }}
                >
                  <Eye style={{ width: "16px", height: "16px" }} />
                  <span style={{ fontFamily: adminFontFamily, fontSize: adminFontSizeBase }}>
                    Preview
                  </span>
                </button>
              </div>
            )}
            {isMock && (
              <Link href={displayLogoHref}>
                <span
                  style={{
                    fontFamily: '"Google Sans Code", monospace', // HARDCODED - specific font
                    fontSize: adminFontSizeBase, // HARDCODED - 0.875rem
                    fontWeight: 300, // HARDCODED
                    color: textColor,
                  }}
                >
                  {displayTitle}
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Middle - Page Navigator (only in preview mode, not in template dashboard mode) */}
        {!isMock && isPreviewMode && (
          // Hardcoded page navigator input (replacing PageNavigator) - all inline styles with admin theme
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              paddingLeft: "16px",
              paddingRight: "16px",
              gap: "8px",
              fontFamily: adminFontFamily, // HARDCODED
              fontSize: adminFontSizeBase, // HARDCODED
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={currentPath}
              readOnly
              placeholder="/page-path"
              style={{
                width: "50%",
                maxWidth: "20rem",
                height: "36px",
                paddingLeft: "12px",
                paddingRight: "12px",
                fontSize: adminFontSizeBase, // HARDCODED - 0.875rem
                lineHeight: "1.25rem",
                borderRadius: "0.5rem",
                border: `1px solid ${inputBorder}`,
                backgroundColor: inputBg,
                color: textColor,
                cursor: "pointer",
                fontFamily: adminFontFamily, // HARDCODED - not inherit
                fontWeight: adminFontWeightNormal, // HARDCODED
                outline: "none",
              }}
              onClick={() => {
                // Send message to open page navigator popover (SidebarToggle listens for this)
                window.postMessage(
                  {
                    type: "OPEN_PAGE_NAVIGATOR",
                    currentPath: currentPath,
                    position: { top: 0, left: 0 }, // Will be calculated by SidebarToggle
                    searchValue: currentPath,
                  },
                  window.location.origin
                );
              }}
            />
            {/* Fullscreen button - matches header iframe behavior */}
            <button
              type="button"
              onClick={handleFullscreenClick}
              aria-label="Toggle fullscreen mode"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "0.5rem",
                border: `1px solid ${borderColor}`,
                backgroundColor: inputBg,
                color: textColor,
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: adminFontFamily, // HARDCODED - not inherit
                fontSize: adminFontSizeBase, // HARDCODED
                outline: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = mutedColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = inputBg;
              }}
            >
              <Maximize style={{ width: "16px", height: "16px" }} />
            </button>
          </div>
        )}

        {/* Right side - Preview, Publish buttons, and User Avatar */}
        {!isMock && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: adminFontFamily, // HARDCODED
              fontSize: adminFontSizeBase, // HARDCODED
            }}
          >
            {/* Publish Button with Popover or IframeDialog */}
            {!hidePublishButton && (
              <div
                style={{
                  position: "relative",
                  fontFamily: adminFontFamily,
                  fontSize: adminFontSizeBase,
                }}
              >
                <Popover
                  open={unsavedPopoverOpen || publishPopoverOpen}
                  onOpenChange={(open) => {
                    if (!open) {
                      setUnsavedPopoverOpen(false);
                      setPublishPopoverOpen(false);
                      setAppDetailsExpanded(false);
                    }
                  }}
                >
                  {canPublish ? (
                    <IframeDialog
                      trigger={
                        <button
                          type="button"
                          data-publish-iframe-trigger
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            whiteSpace: "nowrap",
                            borderRadius: "0.375rem", // rounded-md
                            fontSize: adminFontSizeSmall, // text-xs = 0.75rem
                            fontWeight: adminFontWeightMedium, // font-medium = 500
                            height: "36px", // h-9
                            paddingLeft: "12px", // px-3
                            paddingRight: "12px", // px-3
                            transition: "all 0.2s",
                            cursor: "pointer",
                            border: "none",
                            fontFamily: adminFontFamily, // HARDCODED
                            backgroundColor: primaryColor,
                            color: primaryFgColor,
                            outline: "none",
                          }}
                        >
                          <Rocket style={{ width: "16px", height: "16px" }} />
                          <span
                            style={{ fontFamily: adminFontFamily, fontSize: adminFontSizeSmall }}
                          >
                            Publish
                          </span>
                        </button>
                      }
                      src="/admin/app-details-iframe"
                      title="Publish App"
                      width={600}
                      height={600}
                    />
                  ) : (
                    <>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            whiteSpace: "nowrap",
                            borderRadius: "0.375rem", // rounded-md
                            fontSize: adminFontSizeSmall, // text-xs = 0.75rem
                            fontWeight: adminFontWeightMedium, // font-medium = 500
                            height: "36px", // h-9
                            paddingLeft: "12px", // px-3
                            paddingRight: "12px", // px-3
                            transition: "all 0.2s",
                            cursor: "pointer",
                            border: "none",
                            fontFamily: adminFontFamily, // HARDCODED
                            backgroundColor: primaryColor,
                            color: primaryFgColor,
                            position: "relative",
                            overflow: "hidden",
                            outline: "none",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          onMouseDown={(e) => {
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
                              style={{
                                position: "absolute",
                                inset: 0,
                                transform: "translateX(-100%)",
                                background:
                                  "linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent)",
                                animation: "shimmer 2s infinite",
                              }}
                            />
                          )}
                          {publishStatus === "waiting" && (
                            <span
                              style={{
                                position: "relative",
                                zIndex: 10,
                                fontFamily: adminFontFamily,
                                fontSize: adminFontSizeSmall,
                              }}
                            >
                              Waiting...
                            </span>
                          )}
                          {publishStatus === "building" && (
                            <span
                              style={{
                                position: "relative",
                                zIndex: 10,
                                fontFamily: adminFontFamily,
                                fontSize: adminFontSizeSmall,
                              }}
                            >
                              Building...
                            </span>
                          )}
                          {publishStatus === "ready" && (
                            <>
                              <Rocket style={{ width: "16px", height: "16px" }} />
                              <span
                                style={{
                                  fontFamily: adminFontFamily,
                                  fontSize: adminFontSizeSmall,
                                }}
                              >
                                Publish
                              </span>
                            </>
                          )}
                          {publishStatus === "idle" && (
                            <>
                              <Rocket style={{ width: "16px", height: "16px" }} />
                              <span
                                style={{
                                  fontFamily: adminFontFamily,
                                  fontSize: adminFontSizeSmall,
                                }}
                              >
                                Publish
                              </span>
                            </>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        style={{
                          width: "500px",
                          padding: 0,
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          backgroundColor: popoverBg,
                          color: popoverFg,
                          borderColor: borderColor,
                          fontFamily: adminFontFamily, // HARDCODED
                          fontSize: adminFontSizeBase, // HARDCODED
                          height: unsavedPopoverOpen
                            ? "350px"
                            : isBuilding
                              ? "80px"
                              : isPublished
                                ? "150px"
                                : appDetailsExpanded
                                  ? `${Math.min(window.innerHeight - 100, 600)}px`
                                  : "350px",
                          maxHeight: unsavedPopoverOpen
                            ? "350px"
                            : isBuilding
                              ? "80px"
                              : isPublished
                                ? "150px"
                                : appDetailsExpanded
                                  ? `${window.innerHeight - 100}px`
                                  : "350px",
                        }}
                        align="end"
                        side="bottom"
                        sideOffset={8}
                      >
                        {unsavedPopoverOpen ? (
                          <div style={{ fontFamily: adminFontFamily, fontSize: adminFontSizeBase }}>
                            <UnsavedChangesContent
                              onPromptRun={handlePromptRun}
                              onCancel={() => setUnsavedPopoverOpen(false)}
                            />
                          </div>
                        ) : isBuilding ? (
                          <div
                            style={{
                              padding: "24px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: "100%",
                              fontFamily: adminFontFamily, // HARDCODED
                            }}
                          >
                            <p
                              style={{
                                fontSize: adminFontSizeBase, // HARDCODED - 0.875rem
                                color: mutedFgColor,
                                textAlign: "center",
                                fontFamily: adminFontFamily, // HARDCODED
                                fontWeight: adminFontWeightNormal, // HARDCODED
                              }}
                            >
                              Your app is being built. This might take a few minutes
                            </p>
                          </div>
                        ) : isPublished ? (
                          <div
                            style={{
                              padding: "24px",
                              display: "flex",
                              flexDirection: "column",
                              height: "100%",
                              fontFamily: adminFontFamily, // HARDCODED
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <h2
                                style={{
                                  fontSize: "1.125rem", // HARDCODED
                                  fontWeight: 600, // HARDCODED
                                  marginBottom: "8px",
                                  color: textColor,
                                  fontFamily: adminFontFamily, // HARDCODED
                                  lineHeight: "1.75rem", // HARDCODED
                                }}
                              >
                                Your recent version is live 🎉
                              </h2>
                              <p
                                style={{
                                  fontSize: adminFontSizeBase, // HARDCODED - 0.875rem
                                  color: mutedFgColor,
                                  marginBottom: "16px",
                                  fontFamily: adminFontFamily, // HARDCODED
                                  fontWeight: adminFontWeightNormal, // HARDCODED
                                  lineHeight: "1.25rem", // HARDCODED
                                }}
                              >
                                Click to view your latest version
                              </p>
                              <a
                                href="https://myproject.crunchycone.dev"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: "1rem", // HARDCODED
                                  fontWeight: adminFontWeightMedium, // HARDCODED - 500
                                  color: primaryColor,
                                  textDecoration: "none",
                                  display: "block",
                                  fontFamily: adminFontFamily, // HARDCODED
                                  lineHeight: "1.5rem", // HARDCODED
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.textDecoration = "underline";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.textDecoration = "none";
                                }}
                              >
                                https://myproject.crunchycone.dev
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontFamily: adminFontFamily, fontSize: adminFontSizeBase }}>
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
                          </div>
                        )}
                      </PopoverContent>
                    </>
                  )}
                </Popover>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
