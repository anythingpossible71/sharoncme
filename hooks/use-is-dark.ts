"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Custom hook to detect if the current theme is dark mode
 * Handles all cases: light, dark, system, and custom themes
 */
export function useIsDark() {
  const { resolvedTheme, systemTheme } = useTheme();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Method 1: Check resolved theme (handles "system" theme automatically)
    if (resolvedTheme === "dark") {
      setIsDark(true);
      return;
    }

    // Method 2: Check if .dark class exists on document
    const hasDarkClass = document.documentElement.classList.contains("dark");
    if (hasDarkClass) {
      setIsDark(true);
      return;
    }

    // Method 3: Check system preference as fallback
    if (systemTheme === "dark") {
      setIsDark(true);
      return;
    }

    // Method 4: Check CSS variable lightness
    const root = document.documentElement;
    const bgColor = getComputedStyle(root).getPropertyValue("--background");
    if (bgColor) {
      const l = parseFloat(bgColor.split(" ")[2]);
      setIsDark(l < 50);
      return;
    }

    setIsDark(false);
  }, [resolvedTheme, systemTheme, mounted]);

  return {
    isDark,
    mounted,
    resolvedTheme,
    systemTheme,
  };
}

/**
 * Utility function to check if current theme is dark (can be used outside React components)
 */
export function isDarkMode(): boolean {
  // Check if .dark class exists
  if (typeof document !== "undefined") {
    const hasDarkClass = document.documentElement.classList.contains("dark");
    if (hasDarkClass) return true;
  }

  // Check system preference
  if (typeof window !== "undefined") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) return true;
  }

  return false;
}
