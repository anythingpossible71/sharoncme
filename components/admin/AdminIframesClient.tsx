"use client";

import { useState, useEffect, memo } from "react";
import { HeaderClone } from "./HeaderClone";

interface AdminIframesClientProps {
  children: React.ReactNode;
}

// Memoize the component to prevent unnecessary re-renders
// This is critical - if the parent re-renders, this component should only re-render if props change
export const AdminIframesClient = memo(function AdminIframesClient({
  children,
}: AdminIframesClientProps) {
  // Debug: Track component renders
  useEffect(() => {
    const renderInfo = {
      timestamp: new Date().toISOString(),
      pathname: typeof window !== "undefined" ? window.location.pathname : "SSR",
      renderCount: ((window as any).__adminIframesClientRenderCount =
        ((window as any).__adminIframesClientRenderCount || 0) + 1),
    };
    console.log("🟢 [AdminIframesClient] COMPONENT RENDERED", renderInfo);
  }, []);

  // Check for temporary fullscreen mode from URL parameter
  const [tempFullscreenMode, setTempFullscreenMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("mode") === "temp-full-screen";
    }
    return false;
  });

  const [fullscreenMode, setFullscreenMode] = useState<boolean>(() => {
    // Don't load from localStorage if temp fullscreen is active (check URL param directly)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("mode") === "temp-full-screen") {
        return false; // Temp fullscreen takes precedence
      }
      const stored = localStorage.getItem("admin-fullscreen-mode");
      return stored === "true";
    }
    return false;
  });

  // Watch for URL parameter changes
  useEffect(() => {
    const checkUrlParam = () => {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const isTempFullscreen = urlParams.get("mode") === "temp-full-screen";
        setTempFullscreenMode(isTempFullscreen);
        // If temp fullscreen is active, disable regular fullscreen
        if (isTempFullscreen && fullscreenMode) {
          setFullscreenMode(false);
        }
      }
    };

    checkUrlParam();
    // Check on popstate (back/forward navigation)
    window.addEventListener("popstate", checkUrlParam);
    // Also check periodically in case URL changes via Next.js navigation
    const interval = setInterval(checkUrlParam, 500);

    return () => {
      window.removeEventListener("popstate", checkUrlParam);
      clearInterval(interval);
    };
  }, [fullscreenMode]);

  // Listen for fullscreen mode toggle messages from header iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "TOGGLE_FULLSCREEN_MODE") {
        // Don't toggle if temp fullscreen is active (URL param takes precedence)
        if (tempFullscreenMode) return;
        setFullscreenMode((prev) => !prev);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [tempFullscreenMode]);

  // Listen for custom event from SidebarToggle when fullscreen mode changes
  useEffect(() => {
    const handleFullscreenChange = (e: CustomEvent) => {
      // Don't update if temp fullscreen is active (URL param takes precedence)
      if (tempFullscreenMode) return;
      setFullscreenMode(e.detail.fullscreenMode);
    };

    window.addEventListener("fullscreenModeChanged", handleFullscreenChange as EventListener);
    return () =>
      window.removeEventListener("fullscreenModeChanged", handleFullscreenChange as EventListener);
  }, [tempFullscreenMode]);

  // Ensure zero margins from top-level containers
  useEffect(() => {
    // Set body and html to have zero margins and proper positioning
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.position = "relative";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.documentElement.style.height = "100%";
    document.body.style.height = "100%";

    return () => {
      // Reset on unmount (though this component shouldn't unmount)
      document.body.style.margin = "";
      document.body.style.padding = "";
      document.body.style.position = "";
      document.body.style.height = "";
      document.documentElement.style.margin = "";
      document.documentElement.style.padding = "";
      document.documentElement.style.height = "";
    };
  }, []);

  // Header iframe removed - using inline HeaderClone component instead

  return (
    <div
      data-admin-iframes-client
      className="flex flex-col h-screen m-0 p-0"
      style={{
        margin: 0,
        padding: 0,
        backgroundColor: "hsl(var(--admin-background, 216 19% 95%))",
      }}
    >
      {/* Header Clone - hardcoded component using admin theme parameters via inline styles */}
      {/* Protected from app theme changes by reading CSS variables once and using inline styles exclusively */}
      {!(fullscreenMode || tempFullscreenMode) && (
        <div
          style={{
            width: "100%",
            height: "60px",
            flexShrink: 0,
            margin: 0,
            padding: 0,
            backgroundColor: "hsl(var(--admin-background, 216 19% 95%))",
          }}
        >
          <HeaderClone activeTab="preview" /> {/* App pages in preview always show preview tab */}
        </div>
      )}
      <div className="flex-1 min-h-0 m-0 p-0" style={{ margin: 0, padding: 0 }}>
        {children}
      </div>
    </div>
  );
});
