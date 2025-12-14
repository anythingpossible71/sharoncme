"use client";

import { useEffect, useState } from "react";

/**
 * Custom hook to detect the actual background color and determine if it's light or dark
 * This works even if the user has customized the CSS variables
 */
export function useBackgroundColor() {
  const [backgroundColor, setBackgroundColor] = useState<string>("");
  const [isLight, setIsLight] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const updateBackgroundInfo = () => {
      // Get the computed background color from the CSS variable
      const root = document.documentElement;
      const bgColorValue = getComputedStyle(root).getPropertyValue("--background");

      if (bgColorValue) {
        setBackgroundColor(bgColorValue);

        // Parse HSL values (format: "h s% l%")
        // Only need lightness value for determining if it's light or dark
        const l = parseFloat(bgColorValue.split(" ")[2]);

        // Determine if it's light or dark based on lightness value
        // HSL lightness: 0% = black, 100% = white
        const isLightColor = l > 50;
        setIsLight(isLightColor);
      }
    };

    // Initial check
    updateBackgroundInfo();

    // Listen for theme changes by observing class changes on document
    const observer = new MutationObserver(updateBackgroundInfo);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Also listen for CSS custom property changes
    const styleObserver = new MutationObserver(updateBackgroundInfo);
    styleObserver.observe(document.head, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      styleObserver.disconnect();
    };
  }, [mounted]);

  return {
    backgroundColor,
    isLight,
    isDark: !isLight,
    mounted,
  };
}

/**
 * Utility function to get the current background color and determine if it's light or dark
 * Can be used outside React components
 */
export function getBackgroundColorInfo(): {
  backgroundColor: string;
  isLight: boolean;
  isDark: boolean;
} {
  if (typeof document === "undefined") {
    return { backgroundColor: "", isLight: true, isDark: false };
  }

  const root = document.documentElement;
  const bgColorValue = getComputedStyle(root).getPropertyValue("--background");

  if (!bgColorValue) {
    return { backgroundColor: "", isLight: true, isDark: false };
  }

  // Parse HSL values - only need lightness
  const l = parseFloat(bgColorValue.split(" ")[2]);
  const isLight = l > 50;

  return {
    backgroundColor: bgColorValue,
    isLight,
    isDark: !isLight,
  };
}

/**
 * Convert HSL color to RGB for more accurate lightness calculation
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Calculate perceived brightness using luminance formula
 * More accurate than simple lightness for determining if a color is light or dark
 */
export function getPerceivedBrightness(h: number, s: number, l: number): number {
  const { r, g, b } = hslToRgb(h, s, l);

  // Luminance formula: 0.299*R + 0.587*G + 0.114*B
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Advanced background color detection with perceived brightness
 */
export function useAdvancedBackgroundColor() {
  const [backgroundColor, setBackgroundColor] = useState<string>("");
  const [isLight, setIsLight] = useState<boolean>(true);
  const [brightness, setBrightness] = useState<number>(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const updateBackgroundInfo = () => {
      const root = document.documentElement;
      const bgColorValue = getComputedStyle(root).getPropertyValue("--background");

      if (bgColorValue) {
        setBackgroundColor(bgColorValue);

        const [h, s, l] = bgColorValue.split(" ").map((v) => parseFloat(v));

        // Calculate perceived brightness
        const perceivedBrightness = getPerceivedBrightness(h, s, l);
        setBrightness(perceivedBrightness);

        // Use perceived brightness for more accurate detection
        // 0.5 is the threshold - above is light, below is dark
        const isLightColor = perceivedBrightness > 0.5;
        setIsLight(isLightColor);
      }
    };

    updateBackgroundInfo();

    const observer = new MutationObserver(updateBackgroundInfo);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [mounted]);

  return {
    backgroundColor,
    isLight,
    isDark: !isLight,
    brightness,
    mounted,
  };
}
