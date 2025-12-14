"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface IframeDialogProps {
  trigger: React.ReactNode;
  src: string;
  title?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function IframeDialog({
  trigger,
  src,
  title = "Dialog",
  width = 400,
  height: _height = 500,
  className = "",
}: IframeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update position on window resize when dialog is open
  useEffect(() => {
    if (isOpen) {
      const handleResize = () => {
        updatePosition();
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, width]);

  const updatePosition = () => {
    // Center the dialog on screen
    setPosition({
      top: (window.innerHeight - window.innerHeight * 0.8) / 2,
      left: (window.innerWidth - width) / 2,
    });
  };

  const handleOpen = () => {
    updatePosition();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div ref={triggerRef} onClick={handleOpen}>
        {trigger}
      </div>

      {mounted &&
        isOpen &&
        createPortal(
          <>
            {/* Backdrop - One level below dialog, but above all other elements */}
            <div className="fixed inset-0 bg-black/50 z-[9999998]" onClick={handleClose} />

            {/* Dialog - Full iframe - Highest z-index */}
            <div
              data-iframe-dialog
              className={`fixed border rounded-lg shadow-lg z-[9999999] flex flex-col ${className}`}
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `${width}px`,
                maxWidth: "600px",
                height: `${window.innerHeight * 0.8}px`,
                maxHeight: "90vh",
                backgroundColor: "hsl(var(--admin-background))",
              }}
            >
              {/* Fixed Header */}
              {src === "/admin/app-details-iframe" && (
                <div className="flex-shrink-0 px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold">
                    Step 1: Review your app details Before publishing
                  </h3>
                </div>
              )}
              {/* Iframe */}
              <div className="flex-1 overflow-hidden">
                <iframe src={src} className="w-full h-full border-0 rounded-lg" title={title} />
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
