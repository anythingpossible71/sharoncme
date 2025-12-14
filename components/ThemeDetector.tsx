"use client";

import { useIsDark } from "@/hooks/use-is-dark";
import { useTheme } from "next-themes";

export function ThemeDetector() {
  const { isDark, mounted, resolvedTheme, systemTheme } = useIsDark();
  const { theme } = useTheme();

  if (!mounted) {
    return <div>Loading theme detection...</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="font-semibold mb-2">Theme Detection</h3>
      <div className="space-y-1 text-sm">
        <div>
          Selected Theme: <span className="font-mono">{theme}</span>
        </div>
        <div>
          Resolved Theme: <span className="font-mono">{resolvedTheme}</span>
        </div>
        <div>
          System Theme: <span className="font-mono">{systemTheme}</span>
        </div>
        <div>
          Is Dark Mode: <span className="font-mono">{isDark ? "Yes" : "No"}</span>
        </div>
        <div>
          Background: <span className="font-mono">{isDark ? "Dark" : "Light"}</span>
        </div>
      </div>
    </div>
  );
}
