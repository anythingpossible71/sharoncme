import { Theme } from "../types";

export const darkTheme: Theme = {
  name: "dark",
  label: "Dark",
  description: "Easy on the eyes",
  category: "base",
  icon: "Moon",
  emoji: "🌙",
  radius: "0.5rem",
  colors: {
    background: "222.2 84% 4.9%",
    foreground: "210 40% 98%",
    card: "222.2 84% 4.9%",
    cardForeground: "210 40% 98%",
    popover: "222.2 84% 4.9%",
    popoverForeground: "210 40% 98%",
    primary: "140 60% 40%", // Forest green primary
    primaryForeground: "210 40% 98%", // Light text on primary
    secondary: "100 40% 80%", // Forest green secondary
    secondaryForeground: "222.2 84% 4.9%", // Dark text on secondary
    muted: "217.2 32.6% 17.5%",
    mutedForeground: "215 20.2% 65.1%",
    accent: "217.2 32.6% 17.5%",
    accentForeground: "210 40% 98%",
    destructive: "0 62.8% 30.6%",
    destructiveForeground: "210 40% 98%",
    border: "217.2 32.6% 17.5%",
    input: "217.2 32.6% 17.5%",
    ring: "140 60% 40%", // Forest green ring (matches primary)
  },
};
