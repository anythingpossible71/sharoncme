"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/admin-ui/button";

interface FullscreenToastProps {
  isOpen: boolean;
  onClose: () => void;
  showOnHover?: boolean;
}

export function FullscreenToast({ isOpen, onClose, showOnHover = false }: FullscreenToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Show immediately when fullscreen mode is enabled
      setVisible(true);
      // Auto-hide after 3 seconds initially
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Show toast when hovering over header area
  useEffect(() => {
    if (!isOpen) return;

    if (showOnHover) {
      // Show toast when hovering
      setVisible(true);
      // Hide after 2 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showOnHover, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="bg-background border border-border rounded-md px-4 py-2 shadow-lg flex items-center gap-2">
        <span className="text-sm text-foreground">Click</span>
        <Button variant="outline" size="sm" className="h-6 px-2 text-xs font-mono" disabled>
          Esc
        </Button>
        <span className="text-sm text-foreground">to exit fullscreen</span>
      </div>
    </div>
  );
}
