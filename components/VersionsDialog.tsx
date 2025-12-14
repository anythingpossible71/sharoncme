"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { logger } from "@/lib/logger";
// Version management removed - worktree functionality disabled

interface VersionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  triggerPosition?: { top: number; left: number };
  currentVersion?: number;
  className?: string;
}

export function VersionsDialog({
  isOpen,
  onClose,
  triggerPosition,
  currentVersion,
  className = "",
}: VersionsDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  // Version state removed - worktree functionality disabled
  const width = 500; // Same as PublishPopover
  const height = 600; // Fixed height for version list

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Version manager subscription removed - worktree functionality disabled

  // Update position when trigger position changes - EXACT same logic as admin IframeDialog
  useEffect(() => {
    if (triggerPosition) {
      setPosition({
        top: triggerPosition.top + 45, // 45px below button (same as admin)
        left: window.innerWidth - width - 20, // 20px from right edge (same as admin)
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
        logger.info("Version selector iframe content ready");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onClose]);

  if (!mounted || !isOpen) return null;

  // Build iframe URL - load embeded-versions page
  let iframeSrc = "/admin/embeded-versions";
  const params = new URLSearchParams();
  if (currentVersion) {
    params.append("version", currentVersion.toString());
  }
  // Check for restoreversion in sessionStorage
  const restoreVersion =
    typeof window !== "undefined" ? sessionStorage.getItem("restoreversion") : null;
  if (restoreVersion) {
    params.append("restoreversion", restoreVersion);
    // Clear it after reading
    sessionStorage.removeItem("restoreversion");
  }
  // Get viewversion from parent window URL
  if (typeof window !== "undefined") {
    const parentUrl = window.location.href;
    const urlParams = new URLSearchParams(new URL(parentUrl).search);
    const viewVersion = urlParams.get("viewversion");
    if (viewVersion) {
      params.append("viewversion", viewVersion);
    }
  }
  if (params.toString()) {
    iframeSrc += `?${params.toString()}`;
  }

  return createPortal(
    <>
      {/* Backdrop - Same as admin */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Dialog - EXACT same styling as admin IframeDialog */}
      <div
        data-iframe-dialog
        className={`fixed border rounded-lg shadow-lg z-50 bg-white ${className}`}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${width}px`,
          height: `${height}px`,
        }}
      >
        {/* Full iframe - Same as admin, no header needed */}
        <iframe
          src={iframeSrc}
          className="w-full h-full border-0 rounded-lg"
          title="Version Selection Dialog"
        />
      </div>
    </>,
    document.body
  );
}
