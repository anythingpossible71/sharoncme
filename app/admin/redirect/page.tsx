"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Theme-neutral redirect page
 * This page has NO styles, NO themes, and serves as a clean slate
 * to clear all theme attributes before redirecting to the target URL
 */
export default function RedirectPage() {
  const searchParams = useSearchParams();
  const targetUrl = searchParams.get("url") || "/";

  useEffect(() => {
    // CRITICAL: Clear ALL theme attributes immediately
    // This ensures no theme residue when navigating between admin and app
    const htmlElement = document.documentElement;

    // Remove all theme attributes
    htmlElement.removeAttribute("data-admin-theme");
    htmlElement.removeAttribute("data-app-theme");

    // Remove all theme classes
    const themeClasses = [
      "light",
      "dark",
      "ocean",
      "forest",
      "midnight",
      "strawberry-swirl",
      "sunset-sorbet",
      "lavender-honey",
      "matcha-latte",
      "blueberry-cheesecake",
      "rocky-road",
      "orange-creamsicle",
      "caramel-drizzle",
      "cotton-candy",
      "birthday-cake",
      "ube",
      "lemon-meringue",
      "pistachio-almond",
      "tutti-frutti",
      "electric-mango",
      "raspberry-rush",
      "lime-zing",
      "grape-soda",
      "cherry-bomb",
      "blue-lagoon",
      "supercharged-orange",
      "vivid-violet",
      "kiwi-splash",
      "passion-fruit-punch",
    ];

    themeClasses.forEach((themeClass) => {
      htmlElement.classList.remove(themeClass);
    });

    // Delay to ensure all synchronous scripts (root layout, etc.) complete
    // Then redirect using replace() to avoid adding to history
    // The target page's root layout script will set the correct theme
    const timer = setTimeout(() => {
      // Use replace() instead of href to avoid history entry and potential back button issues
      window.location.replace(targetUrl);
    }, 50); // 50ms delay - ensures all scripts complete, still imperceptible to user

    return () => clearTimeout(timer);
  }, [targetUrl]);

  // Return completely empty page - no styles, no content
  return null;
}
