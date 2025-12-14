import { Theme } from "../types";

// Original midnight theme for admin (purple primary)
export const midnightTheme: Theme = {
  name: "midnight",
  label: "Midnight Purple",
  description: "Mystical elegance",
  category: "custom",
  icon: "Clock",
  emoji: "🌙",
  radius: "0.5rem",
  colors: {
    background: "240 20% 8%",
    foreground: "240 5% 92%",
    card: "240 20% 10%",
    cardForeground: "240 5% 92%",
    popover: "240 20% 10%",
    popoverForeground: "240 5% 92%",
    primary: "270 80% 70%", // Purple primary for admin
    primaryForeground: "240 20% 8%",
    secondary: "240 15% 15%",
    secondaryForeground: "240 5% 92%",
    muted: "240 15% 15%",
    mutedForeground: "240 10% 60%",
    accent: "280 60% 60%",
    accentForeground: "240 20% 8%",
    destructive: "0 70% 60%",
    destructiveForeground: "240 5% 92%",
    border: "240 15% 20%",
    input: "240 15% 20%",
    ring: "270 80% 70%",
  },
};

// App-specific midnight theme (yellow primary) - only used in app context
export const midnightAppTheme: Theme = {
  name: "midnight",
  label: "Midnight Purple",
  description: "Mystical elegance",
  category: "custom",
  icon: "Clock",
  emoji: "🌙",
  radius: "0.5rem",
  colors: {
    background: "240 20% 8%",
    foreground: "240 5% 92%",
    card: "240 20% 10%",
    cardForeground: "240 5% 92%",
    popover: "240 20% 10%",
    popoverForeground: "240 5% 92%",
    primary: "60 90% 60%", // YELLOW primary for app context
    primaryForeground: "240 20% 8%",
    secondary: "240 15% 15%",
    secondaryForeground: "240 5% 92%",
    muted: "240 15% 15%",
    mutedForeground: "240 10% 60%",
    accent: "60 90% 60%", // Yellow accent too
    accentForeground: "240 20% 8%",
    destructive: "0 70% 60%",
    destructiveForeground: "240 5% 92%",
    border: "240 15% 20%",
    input: "240 15% 20%",
    ring: "60 90% 60%", // Yellow ring too
  },
};
