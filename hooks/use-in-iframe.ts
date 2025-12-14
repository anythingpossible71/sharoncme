"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if the current page is running inside an iframe
 * @returns boolean - true if page is in an iframe, false otherwise
 */
export function useInIframe(): boolean {
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Check if window.self is different from window.top
      // In a normal page: window.self === window.top
      // In an iframe: window.self !== window.top
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      // Cross-origin iframes will throw an error
      // If we can't access window.top, we're likely in an iframe
      setIsInIframe(true);
    }
  }, []);

  return isInIframe;
}
