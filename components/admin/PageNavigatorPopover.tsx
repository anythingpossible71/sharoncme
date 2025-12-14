"use client";

import React, { useEffect, useState } from "react";
import { getTemplatePages } from "@/app/actions/template-pages";
import { Button } from "@/components/admin-ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageNavigatorPopoverProps {
  isOpen: boolean;
  currentPath: string;
  onClose: () => void;
  sidebarOpen: boolean;
  position?: { top: number; left: number; width: number };
  searchValue?: string;
}

interface AppPage {
  id: string;
  title: string;
  path: string;
  dev_instructions: string;
  preview_image: string | null;
  requires_login: boolean;
}

export function PageNavigatorPopover({
  isOpen,
  currentPath,
  onClose,
  sidebarOpen,
  position,
  searchValue = "",
}: PageNavigatorPopoverProps) {
  const [pages, setPages] = useState<AppPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPosition, setCurrentPosition] = useState(position);

  // Update position when it changes
  useEffect(() => {
    if (position) {
      setCurrentPosition(position);
    }
  }, [position]);

  // Use prop directly for immediate updates - no state delay
  const effectiveSearchValue = searchValue || "";

  // Listen for position updates
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "UPDATE_PAGE_NAVIGATOR_POSITION") {
        setCurrentPosition(event.data.position);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Listen for window resize to update position
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      // Request position update from iframe
      const headerIframe = document.querySelector(
        'iframe[src="/template-dashboard/header-iframe"]'
      ) as HTMLIFrameElement;
      if (headerIframe?.contentWindow) {
        headerIframe.contentWindow.postMessage(
          {
            type: "REQUEST_POSITION_UPDATE",
          },
          window.location.origin
        );
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getTemplatePages()
        .then((result) => {
          if (result.success && result.pages) {
            setPages(result.pages);
          } else {
            setPages([]);
          }
        })
        .catch((error) => {
          console.error("Error fetching pages:", error);
          setPages([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  // No longer need to hide/show header input since it's now a button

  const handlePageClick = (path: string) => {
    // Send close message to iframe
    const headerIframe = document.querySelector(
      'iframe[src="/template-dashboard/header-iframe"]'
    ) as HTMLIFrameElement;
    if (headerIframe?.contentWindow) {
      headerIframe.contentWindow.postMessage(
        {
          type: "PAGE_NAVIGATOR_CLOSED",
        },
        window.location.origin
      );
    }
    // Reload parent page to the selected URL
    if (window.top) {
      window.top.location.href = path;
    }
  };

  const handleClose = () => {
    // Send close message to iframe to reset search value
    const headerIframe = document.querySelector(
      'iframe[src="/template-dashboard/header-iframe"]'
    ) as HTMLIFrameElement;
    if (headerIframe?.contentWindow) {
      headerIframe.contentWindow.postMessage(
        {
          type: "RESET_PAGE_NAVIGATOR_SEARCH",
          currentPath: currentPath,
        },
        window.location.origin
      );
    }
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  // Filter pages based on search value
  // Show all pages if search value matches current path, otherwise filter
  const searchWithoutSlash = effectiveSearchValue.replace(/^\//, ""); // Remove leading "/"
  const isSearchActive = effectiveSearchValue !== currentPath && searchWithoutSlash !== "";

  // Find root page (path === "/")
  const rootPage = pages.find((page) => page.path === "/");

  let filteredPages: AppPage[] = [];

  if (effectiveSearchValue === currentPath) {
    // Show all pages when search matches current path
    filteredPages = pages;
  } else if (!searchWithoutSlash || effectiveSearchValue === "/") {
    // If search is empty (just "/"), show only root page if it exists
    if (rootPage && rootPage.path === "/") {
      filteredPages = [rootPage];
    } else {
      // No valid root page, show nothing
      filteredPages = [];
    }
  } else {
    // Filter when search is different from current path
    // Match if search is the first letter(s) of any word in the path
    const searchLower = searchWithoutSlash.toLowerCase();
    filteredPages = pages.filter((page) => {
      if (!searchLower) return false;

      // Split path by "/" to get individual segments
      const pathSegments = page.path.toLowerCase().split("/").filter(Boolean);

      // For each segment, split by hyphens, underscores, and camelCase boundaries
      // Then check if any word starts with the search string
      return pathSegments.some((segment) => {
        // Split segment by hyphens, underscores, and camelCase boundaries
        // e.g., "builder-app-mode" -> ["builder", "app", "mode"]
        // e.g., "root_backup" -> ["root", "backup"]
        // e.g., "camelCase" -> ["camel", "case"] (after toLowerCase)
        const words = segment
          .split(/[-_]/) // Split by hyphens and underscores
          .flatMap((word) => {
            // Split camelCase words (though segment is already lowercase, this handles edge cases)
            return word.split(/(?=[A-Z])/).filter(Boolean);
          })
          .filter(Boolean);

        // Check if any word starts with the search string
        return words.some((word) => word.startsWith(searchLower));
      });
    });
  }

  // Hide menu if search is active and there are no results
  if (isSearchActive && !loading && filteredPages.length === 0) {
    return null;
  }

  // Center the popover on screen like macOS Finder
  const width = 600;
  const height = 500;
  const top = `calc(50vh - ${height / 2}px)`;
  const left = `calc(50vw - ${width / 2}px)`;

  // Build iframe URL with search params
  const iframeUrl = `/admin/pages-result?search=${encodeURIComponent(
    effectiveSearchValue
  )}&currentPath=${encodeURIComponent(currentPath)}`;

  return (
    <>
      {/* Click outside to close - covers entire page including header iframe */}
      <div className="fixed inset-0 z-[100] bg-black/50" onClick={handleClose} />
      {/* Centered modal with iframe - like macOS Finder */}
      <div
        data-page-navigator-menu
        className="fixed z-[101] rounded-lg border border-border/50 overflow-hidden shadow-2xl bg-background"
        style={{
          top: top,
          left: left,
          width: `${width}px`,
          height: `${height}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          key={iframeUrl}
          src={iframeUrl}
          className="w-full h-full border-0"
          title="Page Navigator Results"
        />
      </div>
    </>
  );
}
