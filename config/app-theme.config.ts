/**
 * App Theme Configuration
 *
 * This file configures the default theme for the application (not admin).
 * Admin theme settings remain unchanged and are configured separately.
 */

export const appThemeConfig = {
  /**
   * Current default theme for the application
   * Options: "light" | "dark" | "system" | "ocean" | "forest" | "midnight"
   *
   * This is used as the defaultTheme in ConditionalThemeProviderClient
   */
  currentTheme: "midnight" as const,
} as const;

export type AppThemeConfig = typeof appThemeConfig;
