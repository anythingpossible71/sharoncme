"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { logger } from "@/lib/logger";

export type PopoverContext = "publish" | "versions" | "restore";

interface AdminPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  context: PopoverContext;
  triggerPosition?: { top: number; left: number };
  className?: string;
  // Context-specific props
  currentVersion?: number;
  restoreVersion?: string;
  viewVersion?: string;
}

export function AdminPopover({
  isOpen,
  onClose,
  context,
  triggerPosition,
  className = "",
  currentVersion,
  restoreVersion,
  viewVersion,
}: AdminPopoverProps) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Context-specific dimensions
  const width = 500;

  // Calculate height based on context and position (recalculates when position changes)
  const height = useMemo(() => {
    switch (context) {
      case "restore":
        return 140; // Very compact height for restore dialog
      case "versions":
      case "publish":
      default:
        // Maximize to screen height with some padding
        if (typeof window !== "undefined" && position.top > 0) {
          return window.innerHeight - position.top - 30;
        }
        return 600; // Fallback height
    }
  }, [context, position.top]);

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update position when trigger position changes
  useEffect(() => {
    if (triggerPosition) {
      setPosition({
        top: triggerPosition.top + 45, // 45px below button
        left: window.innerWidth - width - 20, // 20px from right edge
      });
    }
  }, [triggerPosition, width]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "VERSION_DIALOG_CLOSE") {
        onClose();
      } else if (
        event.data.type === "IFRAME_CONTENT_READY" &&
        event.data.source === "version-selector"
      ) {
        // Iframe content is ready, ensure proper sizing
        logger.info("Iframe content ready");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onClose]);

  // Calculate iframe src based on current context and params
  const iframeSrc = (() => {
    switch (context) {
      case "publish":
        return "/dev-publish-dialog-read";

      case "versions":
      case "restore": {
        let src = "/admin/embeded-versions";
        const params = new URLSearchParams();

        if (currentVersion) {
          params.append("version", currentVersion.toString());
        }

        if (restoreVersion) {
          params.append("restoreversion", restoreVersion);
        }

        if (viewVersion) {
          params.append("viewversion", viewVersion);
        }

        // Check for restoreversion in sessionStorage
        if (typeof window !== "undefined") {
          const storedRestoreVersion = sessionStorage.getItem("restoreversion");
          if (storedRestoreVersion) {
            params.append("restoreversion", storedRestoreVersion);
            sessionStorage.removeItem("restoreversion");
          }

          // Get viewversion from parent window URL if not provided
          if (!viewVersion) {
            const parentUrl = window.location.href;
            const urlParams = new URLSearchParams(new URL(parentUrl).search);
            const parentViewVersion = urlParams.get("viewversion");
            if (parentViewVersion) {
              params.append("viewversion", parentViewVersion);
            }
          }
        }

        if (params.toString()) {
          src += `?${params.toString()}`;
        }

        return src;
      }

      default:
        return "/dev-publish-dialog-read";
    }
  })();

  // Update iframe src when context or params change
  useEffect(() => {
    if (iframeRef.current && isOpen) {
      const fullSrc = `${window.location.origin}${iframeSrc}`;
      // Only update if src actually changed to avoid unnecessary reloads
      if (!iframeRef.current.src || iframeRef.current.src !== fullSrc) {
        iframeRef.current.src = iframeSrc;
      }
    }
  }, [context, currentVersion, restoreVersion, viewVersion, isOpen, iframeSrc]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Dialog */}
      <div
        data-iframe-dialog
        className={`fixed border rounded-lg shadow-lg z-50 bg-white overflow-hidden ${className}`}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${width}px`,
          height: `${height}px`,
          maxHeight: `${height}px`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Full iframe */}
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="w-full border-0 rounded-lg flex-shrink-0"
          title={`${context.charAt(0).toUpperCase() + context.slice(1)} Dialog`}
          key={`${context}-${restoreVersion || viewVersion || currentVersion || "default"}`}
          style={{
            height: `${height}px`,
            maxHeight: `${height}px`,
            flexShrink: 0,
          }}
        />
      </div>
    </>,
    document.body
  );
}
