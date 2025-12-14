"use client";

import { Input } from "@/components/admin-ui/input";
import { useEffect, useState, useRef } from "react";

export function PageNavigator() {
  const [currentPath, setCurrentPath] = useState<string>("/");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // No longer need position updates - will be centered

  // Get current path from parent window
  useEffect(() => {
    const updatePath = () => {
      if (window.parent && window.parent !== window) {
        try {
          const parentPath = window.parent.location.pathname;
          setCurrentPath(parentPath);
        } catch {
          // Cross-origin or other error - use default
          setCurrentPath("/");
        }
      } else {
        // Not in iframe, use current pathname
        const path = window.location.pathname;
        setCurrentPath(path);
      }
    };

    // Initial update
    updatePath();

    // Listen for navigation messages from parent
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "PAGE_PATH_CHANGED") {
        setCurrentPath(event.data.path);
      } else if (event.data.type === "PAGE_NAVIGATOR_CLOSED") {
        setIsOpen(false);
      } else if (event.data.type === "RESET_PAGE_NAVIGATOR_SEARCH") {
        setIsOpen(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [currentPath, isOpen]);

  const handleClick = () => {
    setIsOpen(true);
    // Notify parent that menu is now open
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "PAGE_NAVIGATOR_OPENED",
          currentPath: currentPath,
        },
        window.location.origin
      );
    }
  };

  return (
    <div className="flex-1 flex justify-center px-4" onClick={(e) => e.stopPropagation()}>
      <Input
        ref={inputRef}
        type="text"
        value={currentPath}
        onClick={handleClick}
        readOnly
        className="w-[50%] max-w-xs cursor-pointer text-left focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:ring-offset-0"
        placeholder="/page-path"
      />
    </div>
  );
}
