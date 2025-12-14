"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface PublishPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerPosition?: { top: number; left: number };
  className?: string;
}

export function PublishPopover({
  isOpen,
  onClose,
  triggerPosition,
  className = "",
}: PublishPopoverProps) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const width = 500; // Same as admin IframeDialog default
  const _height = 500; // Same as admin IframeDialog default

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update position when trigger position changes - EXACT same logic as admin IframeDialog
  useEffect(() => {
    if (triggerPosition) {
      setPosition({
        top: triggerPosition.top + 45, // 45px below button (same as admin)
        left: window.innerWidth - width - 20, // 20px from right edge (same as admin)
      });
    }
  }, [triggerPosition, width]);

  if (!mounted || !isOpen) return null;

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
          height: `${window.innerHeight - position.top - 30}px`, // Same height calculation as admin
        }}
      >
        {/* Full iframe - Same as admin, no header needed */}
        <iframe
          src="/dev-publish-dialog-read"
          className="w-full h-full border-0 rounded-lg"
          title="Publish Dialog"
        />
      </div>
    </>,
    document.body
  );
}
