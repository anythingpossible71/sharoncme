"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/admin-ui/button";
import { Rocket, RotateCcw, ArrowLeft, Eye } from "lucide-react";
import { logger } from "@/lib/logger";

interface AdminAppHeaderProps {
  appName?: string;
  appLogoUrl?: string;
}

export function AdminAppHeader({ appName, appLogoUrl: _appLogoUrl }: AdminAppHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bgmode = searchParams.get("bgmode");
  const version = searchParams.get("version");
  const currentVersionParam = searchParams.get("currentVersion");
  const viewVersion = searchParams.get("viewversion");
  const [_isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [fetchedCurrentVersion, setFetchedCurrentVersion] = useState<number | null>(null);
  const [latestVersion, setLatestVersion] = useState<number | null>(null);
  const [isLoadingVersion, setIsLoadingVersion] = useState(true);
  const presentVersion = version ? parseInt(version) : null;
  const currentVersion = currentVersionParam
    ? parseInt(currentVersionParam)
    : fetchedCurrentVersion;

  // Determine which version is being displayed
  const displayedVersion = presentVersion || currentVersion;

  // Check if displayed version is the latest
  const isLatestVersion =
    latestVersion !== null && displayedVersion !== null && displayedVersion === latestVersion;
  const shouldShowRestore = presentVersion && currentVersion && presentVersion !== currentVersion;
  const isViewingVersion = !!viewVersion;

  const handlePublish = () => {
    // If in iframe, trigger publish popover in parent window
    if (window.parent && window.parent !== window) {
      // Send message to parent to open publish popover
      window.parent.postMessage(
        {
          type: "ADMIN_HEADER_CLICK",
          action: "openPublishPopover",
          data: {
            source: "fixed-header-publish",
            bgmode: bgmode,
            timestamp: Date.now(),
          },
        },
        window.location.origin
      );
    } else {
      // Fallback for non-iframe usage
      router.push("/admin");
    }
  };

  // Determine colors based on bgmode parameter
  const getBarBackgroundColor = () => {
    if (bgmode === "light") {
      return "bg-[#000000]"; // Black background for light mode
    } else if (bgmode === "dark") {
      return "bg-[#ffffff]"; // White background for dark mode
    }
    return "bg-[#000000]"; // Default black
  };

  const _getTextColor = () => {
    if (bgmode === "light") {
      return "text-[#ffffff]"; // White text for light mode
    } else if (bgmode === "dark") {
      return "text-[#000000]"; // Black text for dark mode
    }
    return "text-[#ffffff]"; // Default white
  };

  const _getButtonBackgroundColor = () => {
    if (bgmode === "light") {
      return "bg-[#ffffff]/70 hover:bg-[#ffffff]"; // White background at 70% opacity, 100% on hover
    } else if (bgmode === "dark") {
      return "bg-[#000000]/70 hover:bg-[#000000]"; // Black background at 70% opacity, 100% on hover
    }
    return "bg-[#ffffff]/70 hover:bg-[#ffffff]"; // Default white at 70% opacity, 100% on hover
  };

  const _getButtonTextColor = () => {
    if (bgmode === "light") {
      return "text-[#000000]"; // Black text (matches black header background)
    } else if (bgmode === "dark") {
      return "text-[#ffffff]"; // White text (matches white header background)
    }
    return "text-[#000000]"; // Default black
  };

  const getVersionSelectorClasses = () => {
    // Decide outline button style based on bgmode parameter, not user theme
    // bgmode=light means black header, bgmode=dark means white header
    if (bgmode === "light") {
      // bgmode=light: Black header → Use dark mode outline style (dark button on black header)
      // Dark background, light text, dark border
      return "border border-[hsl(217.2_32.6%_17.5%)] bg-[hsl(217.2_32.6%_17.5%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(217.2_32.6%_21%)] hover:text-[hsl(210_40%_98%)]";
    } else {
      // bgmode=dark: White header → Use light outline button style (light outlined button on white header)
      // Use hardcoded light colors with !important to ensure light style regardless of admin theme
      return "border border-[hsl(120_20%_85%)] !bg-[hsl(120_25%_98%)] !text-[#000000] hover:!bg-[hsl(130_50%_60%)] hover:!text-[hsl(120_25%_10%)] dark:!bg-[hsl(120_25%_98%)] dark:!text-[#000000] dark:hover:!bg-[hsl(130_50%_60%)] dark:hover:!text-[hsl(120_25%_10%)]";
    }
  };

  const handleLogoClick = () => {
    // If in iframe, open admin in new tab in parent window
    if (window.parent && window.parent !== window) {
      window.parent.open("/admin", "_blank");
    } else {
      // Fallback for non-iframe usage
      window.open("/admin", "_blank");
    }
  };

  const handleVersionClick = () => {
    // If viewing a version, navigate back to root
    if (isViewingVersion) {
      const rootUrl = window.location.origin;
      const url = `${rootUrl}/`;

      // If in iframe, update parent window
      if (window.parent && window.parent !== window) {
        window.parent.location.href = url;
      } else {
        // Not in iframe, update current window
        router.push("/");
      }
      return;
    }

    // If in iframe, trigger versions dialog in parent window
    if (window.parent && window.parent !== window) {
      // Send message to parent to open versions dialog
      window.parent.postMessage(
        {
          type: "ADMIN_HEADER_CLICK",
          action: "openVersionsDialog",
          data: {
            source: "fixed-header-versions",
            viewedVersion: version ? parseInt(version) : undefined,
            bgmode: bgmode,
            timestamp: Date.now(),
          },
        },
        window.location.origin
      );
    } else {
      // Fallback for non-iframe usage
      router.push("/dev-version-dropdown");
    }
  };

  const handleResetToVersion = () => {
    // Get the viewversion number (use viewVersion from URL param)
    const restoreVersionNumber = viewVersion || "1"; // Use viewVersion if available, otherwise default to '1'

    // If in iframe, trigger versions dialog in parent window with restoreversion parameter
    if (window.parent && window.parent !== window) {
      // Send message to parent to open versions dialog with restoreversion
      window.parent.postMessage(
        {
          type: "ADMIN_HEADER_CLICK",
          action: "openVersionsDialog",
          data: {
            source: "fixed-header-restore",
            restoreversion: restoreVersionNumber,
            bgmode: bgmode,
            timestamp: Date.now(),
          },
        },
        window.location.origin
      );
    }
  };

  const handleRestore = () => {
    // If in iframe, trigger restore dialog in parent window
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "ADMIN_HEADER_CLICK",
          action: "openRestoreDialog",
          data: {
            source: "fixed-header-restore",
            presentVersion: presentVersion,
            currentVersion: currentVersion,
            bgmode: bgmode,
            timestamp: Date.now(),
          },
        },
        window.location.origin
      );
    } else {
      // Fallback for non-iframe usage
      setIsRestoreDialogOpen(true);
    }
  };

  const _handleRestoreConfirm = () => {
    // For now, just close the dialog - actual restore logic will be implemented later
    setIsRestoreDialogOpen(false);
    logger.info("Restore confirmed - functionality to be implemented");
  };

  // Fetch current version and latest version on mount
  useEffect(() => {
    const fetchCurrentVersion = async () => {
      try {
        setIsLoadingVersion(true);
        const response = await fetch("/api/versions/list");
        if (response.ok) {
          const data = await response.json();
          setFetchedCurrentVersion(data.currentVersion);
          setLatestVersion(data.currentVersion); // currentVersion is the latest version (totalCount)
        }
      } catch (error) {
        logger.error(
          "Error fetching current version",
          {},
          error instanceof Error ? error : undefined
        );
      } finally {
        setIsLoadingVersion(false);
      }
    };

    // Always fetch to get latest version for comparison
    fetchCurrentVersion();
  }, [currentVersionParam]);

  // Listen for messages from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "PARENT_RESPONSE") {
        logger.info("Received response from parent:", event.data);
        // Handle parent responses here if needed
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div
      className={`h-[60px] ${getBarBackgroundColor()} flex items-center justify-between px-[10px] relative transition-none`}
    >
      {/* Left side - Back arrow placeholder */}
      <button
        onClick={handleLogoClick}
        className="relative z-10 flex items-center gap-2 pr-2 py-1 rounded cursor-pointer"
      >
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${bgmode === "dark" ? "bg-black/20" : "bg-white/20"}`}
        >
          <ArrowLeft
            className={`h-5 w-5 ${bgmode === "dark" ? "text-[#000000]/60" : "text-[#ffffff]/60"}`}
          />
        </div>
        <div className="flex flex-col min-w-0 justify-center items-start">
          <span
            className={`text-xs font-medium ${bgmode === "dark" ? "text-[#000000]/60" : "text-[#ffffff]/60"} leading-tight`}
          >
            Project Admin
          </span>
          {appName && (
            <span
              className={`text-sm font-medium leading-tight ${bgmode === "dark" ? "text-[#000000]/60" : "text-[#ffffff]/60"}`}
            >
              {appName}
            </span>
          )}
        </div>
      </button>

      {/* Right side - Version button and Publish button */}
      <div className="relative z-10 flex items-center gap-2">
        <Button
          onClick={handleVersionClick}
          variant="outline"
          size="sm"
          className={`text-xs font-medium ${getVersionSelectorClasses()}`}
        >
          {isViewingVersion ? (
            <ArrowLeft
              className={`h-4 w-4 ${bgmode === "dark" ? "!text-[#000000] dark:!text-[#000000]" : ""}`}
            />
          ) : (
            <Eye
              className={`h-4 w-4 ${bgmode === "dark" ? "!text-[#000000] dark:!text-[#000000]" : ""}`}
            />
          )}
          {isViewingVersion
            ? "Back to latest version"
            : isLoadingVersion
              ? "Loading"
              : isLatestVersion
                ? "Latest version"
                : displayedVersion
                  ? `Version #${displayedVersion}`
                  : "Loading"}
        </Button>
        {isViewingVersion ? (
          <Button
            onClick={handleResetToVersion}
            variant="secondary"
            size="sm"
            className="h-8 bg-secondary/80 hover:bg-secondary text-xs font-medium"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Restore version
          </Button>
        ) : shouldShowRestore ? (
          <Button
            onClick={handleRestore}
            size="sm"
            className="h-8 bg-orange-600/80 hover:bg-orange-600 text-white text-xs font-medium"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restore version
          </Button>
        ) : (
          <Button
            onClick={handlePublish}
            variant="default"
            size="sm"
            className="text-xs font-medium"
          >
            <Rocket className="h-4 w-4" />
            Publish
          </Button>
        )}
      </div>
    </div>
  );
}
