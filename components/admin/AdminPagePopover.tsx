"use client";

import { useEffect, useState } from "react";

interface AdminPagePopoverProps {
  url: string | null;
  onClose: () => void;
  sidebarOpen: boolean;
}

export function AdminPagePopover({ url, onClose: _onClose, sidebarOpen }: AdminPagePopoverProps) {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (url) {
      // Add ?mode=iframe to the URL
      const urlObj = new URL(url, window.location.origin);
      urlObj.searchParams.set("mode", "iframe");
      setIframeUrl(urlObj.toString());
    } else {
      setIframeUrl(null);
    }
  }, [url]);

  if (!url || !iframeUrl) {
    return null;
  }

  // Calculate position to match Scrollable Main Content exactly
  // Header is now in-page, sidebar is 258px when open
  const sidebarWidth = sidebarOpen ? 258 : 0;
  // Popover margins: 20px all around
  const marginTop = 20;
  const marginRight = 20;
  const marginBottom = 20;
  const marginLeft = 20;

  return (
    <>
      {/* Popover - matches Scrollable Main Content dimensions and styling */}
      <div
        className="fixed z-50 rounded-[10px] overflow-hidden"
        style={{
          top: `${marginTop}px`,
          left: `${sidebarWidth + marginLeft}px`,
          right: `${marginRight}px`,
          bottom: `${marginBottom}px`,
          height: `calc(100vh - ${marginTop}px - ${marginBottom}px)`,
          borderTop: "1px solid rgba(0, 0, 0, 0.1)",
          borderLeft: "1px solid rgba(0, 0, 0, 0.1)",
          borderRight: "1px solid rgba(0, 0, 0, 0.1)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          backgroundColor: "hsl(var(--admin-background))",
        }}
      >
        {/* Iframe */}
        <iframe src={iframeUrl} className="w-full h-full border-0" title="Admin Page" />
      </div>
    </>
  );
}
