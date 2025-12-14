"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/admin-ui/card";
import { Button } from "@/components/admin-ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin-ui/select";
import { Copy, Check } from "lucide-react";
import { logger } from "@/lib/logger";
import { getTheme } from "@/themes";
import { midnightAppTheme } from "@/themes/custom/midnight";
import { updateAppThemeConfig } from "@/app/actions/app-theme-config";
import { appThemeConfig } from "@/config/app-theme.config";

interface ColorVariable {
  name: string;
  cssVar: string;
  description: string;
}

interface TypographyItem {
  name: string;
  className: string;
  cssVar?: string;
  size: string;
  weight?: string;
  lineHeight?: string;
  previewClass?: string;
}

const colorVariables: ColorVariable[] = [
  { name: "Background", cssVar: "--background", description: "Main background color" },
  { name: "Foreground", cssVar: "--foreground", description: "Main text color" },
  { name: "Card", cssVar: "--card", description: "Card background color" },
  { name: "Card Foreground", cssVar: "--card-foreground", description: "Card text color" },
  { name: "Popover", cssVar: "--popover", description: "Popover background color" },
  { name: "Popover Foreground", cssVar: "--popover-foreground", description: "Popover text color" },
  { name: "Primary", cssVar: "--primary", description: "Primary brand color" },
  {
    name: "Primary Foreground",
    cssVar: "--primary-foreground",
    description: "Text on primary color",
  },
  { name: "Secondary", cssVar: "--secondary", description: "Secondary color" },
  {
    name: "Secondary Foreground",
    cssVar: "--secondary-foreground",
    description: "Text on secondary color",
  },
  { name: "Muted", cssVar: "--muted", description: "Muted background color" },
  { name: "Muted Foreground", cssVar: "--muted-foreground", description: "Muted text color" },
  { name: "Accent", cssVar: "--accent", description: "Accent color" },
  { name: "Accent Foreground", cssVar: "--accent-foreground", description: "Text on accent color" },
  { name: "Destructive", cssVar: "--destructive", description: "Destructive/error color" },
  {
    name: "Destructive Foreground",
    cssVar: "--destructive-foreground",
    description: "Text on destructive color",
  },
  { name: "Border", cssVar: "--border", description: "Border color" },
  { name: "Input", cssVar: "--input", description: "Input border color" },
  { name: "Ring", cssVar: "--ring", description: "Focus ring color" },
  { name: "Radius", cssVar: "--radius", description: "Border radius value" },
];

const typographyItems: TypographyItem[] = [
  { name: "Text XS", className: "text-xs", size: "0.75rem (12px)", lineHeight: "1rem (16px)" },
  { name: "Text SM", className: "text-sm", size: "0.875rem (14px)", lineHeight: "1.25rem (20px)" },
  { name: "Text Base", className: "text-base", size: "1rem (16px)", lineHeight: "1.5rem (24px)" },
  { name: "Text LG", className: "text-lg", size: "1.125rem (18px)", lineHeight: "1.75rem (28px)" },
  { name: "Text XL", className: "text-xl", size: "1.25rem (20px)", lineHeight: "1.75rem (28px)" },
  { name: "Text 2XL", className: "text-2xl", size: "1.5rem (24px)", lineHeight: "2rem (32px)" },
  {
    name: "Text 3XL",
    className: "text-3xl",
    size: "1.875rem (30px)",
    lineHeight: "2.25rem (36px)",
  },
  { name: "Text 4XL", className: "text-4xl", size: "2.25rem (36px)", lineHeight: "2.5rem (40px)" },
  { name: "Text 5XL", className: "text-5xl", size: "3rem (48px)", lineHeight: "1" },
  { name: "Text 6XL", className: "text-6xl", size: "3.75rem (60px)", lineHeight: "1" },
];

const headingItems: TypographyItem[] = [
  {
    name: "Heading 1",
    className: "h1",
    size: "2.25rem (36px)",
    lineHeight: "2.5rem (40px)",
    weight: "700 (bold)",
    previewClass: "text-4xl font-bold",
  },
  {
    name: "Heading 2",
    className: "h2",
    size: "1.875rem (30px)",
    lineHeight: "2.25rem (36px)",
    weight: "700 (bold)",
    previewClass: "text-3xl font-bold",
  },
  {
    name: "Heading 3",
    className: "h3",
    size: "1.5rem (24px)",
    lineHeight: "2rem (32px)",
    weight: "600 (semibold)",
    previewClass: "text-2xl font-semibold",
  },
  {
    name: "Heading 4",
    className: "h4",
    size: "1.25rem (20px)",
    lineHeight: "1.75rem (28px)",
    weight: "600 (semibold)",
    previewClass: "text-xl font-semibold",
  },
  {
    name: "Heading 5",
    className: "h5",
    size: "1.125rem (18px)",
    lineHeight: "1.75rem (28px)",
    weight: "600 (semibold)",
    previewClass: "text-lg font-semibold",
  },
  {
    name: "Heading 6",
    className: "h6",
    size: "1rem (16px)",
    lineHeight: "1.5rem (24px)",
    weight: "600 (semibold)",
    previewClass: "text-base font-semibold",
  },
  {
    name: "Paragraph",
    className: "p",
    size: "1rem (16px)",
    lineHeight: "1.5rem (24px)",
    weight: "400 (normal)",
    previewClass: "text-base font-normal",
  },
];

const fontWeights = [
  { name: "Thin", className: "font-thin", weight: "100" },
  { name: "Extralight", className: "font-extralight", weight: "200" },
  { name: "Light", className: "font-light", weight: "300" },
  { name: "Normal", className: "font-normal", weight: "400" },
  { name: "Medium", className: "font-medium", weight: "500" },
  { name: "Semibold", className: "font-semibold", weight: "600" },
  { name: "Bold", className: "font-bold", weight: "700" },
  { name: "Extrabold", className: "font-extrabold", weight: "800" },
  { name: "Black", className: "font-black", weight: "900" },
];

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error(
        "Failed to copy to clipboard",
        { text },
        error instanceof Error ? error : undefined
      );
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-6 w-6 flex-shrink-0"
      title={copied ? "Copied!" : `Copy ${label}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function ColorSwatch({
  variable,
  appThemeRef,
}: {
  variable: ColorVariable;
  appThemeRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [colorValue, setColorValue] = useState<string>("");

  const readColorValue = () => {
    if (appThemeRef.current) {
      // Force a reflow to ensure CSS is applied
      void appThemeRef.current.offsetHeight;

      const computedStyle = getComputedStyle(appThemeRef.current);
      const cssVarValue = computedStyle.getPropertyValue(variable.cssVar).trim();

      if (cssVarValue) {
        setColorValue(cssVarValue);
        return;
      }
    }

    // Fallback: Try to read from a temporary element with app theme
    // This ensures we get app theme values, not admin theme values
    const tempElement = document.createElement("div");
    tempElement.style.cssText = "position: absolute; visibility: hidden;";

    // Get app theme from localStorage
    const appTheme = localStorage.getItem("app-theme") || "system";
    let resolvedTheme = appTheme;
    if (appTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      resolvedTheme = prefersDark ? "dark" : "light";
    }

    tempElement.setAttribute("data-app-theme", resolvedTheme);
    tempElement.removeAttribute("data-admin-theme");
    document.body.appendChild(tempElement);

    const tempStyle = getComputedStyle(tempElement);
    const tempValue = tempStyle.getPropertyValue(variable.cssVar).trim();
    document.body.removeChild(tempElement);

    if (tempValue) {
      setColorValue(tempValue);
    } else {
      setColorValue("0 0% 0%");
    }
  };

  useEffect(() => {
    // Initial read with delay to ensure element is ready
    const timeout = setTimeout(() => {
      readColorValue();
    }, 150);

    // Also set up an observer to re-read when the ref element changes
    const checkInterval = setInterval(() => {
      if (appThemeRef.current) {
        readColorValue();
      }
    }, 500);

    return () => {
      clearTimeout(timeout);
      clearInterval(checkInterval);
    };
  }, [variable.cssVar, appThemeRef]);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
      <div
        className="w-12 h-12 rounded-md border border-border flex-shrink-0"
        style={{
          backgroundColor: colorValue ? `hsl(${colorValue})` : `hsl(var(${variable.cssVar}))`,
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{variable.name}</p>
          <CopyButton text={variable.cssVar} label={variable.cssVar} />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{variable.description}</p>
        <p className="text-xs text-muted-foreground font-mono mt-1">{variable.cssVar}</p>
        {colorValue && (
          <p className="text-xs text-muted-foreground font-mono mt-0.5">hsl({colorValue})</p>
        )}
      </div>
    </div>
  );
}

// App themes available for preview
const APP_THEMES = ["light", "dark", "system", "ocean", "forest", "midnight"];

export function ThemePreview() {
  // Create a ref for a hidden element with app theme applied
  const appThemeRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Get default theme: localStorage wins if exists, otherwise config
  const getInitialTheme = () => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("app-theme") || localStorage.getItem("theme");
      if (savedTheme) {
        return savedTheme;
      }
    }
    return appThemeConfig.currentTheme;
  };

  // Simple state: just track selected theme for dropdown and iframe
  const [selectedTheme, setSelectedTheme] = useState<string>(getInitialTheme());
  const [mounted, setMounted] = useState(false);
  const [themeApplied, setThemeApplied] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  // Get current default theme from config (for apply button logic)
  const currentDefaultTheme = appThemeConfig.currentTheme;

  // Initialize on mount - read from localStorage first, fallback to config
  useEffect(() => {
    setMounted(true);
    // Initialize from localStorage if exists, otherwise config
    const initialTheme = getInitialTheme();
    setSelectedTheme(initialTheme);
  }, []);

  // Create isolated element in body to read app theme CSS variables
  // Use selectedTheme (from dropdown) to read the correct theme's CSS variables
  useEffect(() => {
    if (!mounted) return;

    // Determine resolved theme from selectedTheme (not from localStorage)
    let resolvedTheme = selectedTheme;
    if (selectedTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      resolvedTheme = prefersDark ? "dark" : "light";
    }

    // Create a completely isolated element appended to body (outside admin scope)
    const isolatedElement = document.createElement("div");
    isolatedElement.id = "app-theme-isolated-preview";
    isolatedElement.style.cssText =
      "position: fixed !important; top: -9999px !important; left: -9999px !important; width: 1px !important; height: 1px !important; visibility: hidden !important; pointer-events: none !important; z-index: -9999 !important;";

    // CRITICAL: Remove admin theme attribute to prevent admin CSS from overriding
    isolatedElement.removeAttribute("data-admin-theme");

    // Set app theme - this ensures app CSS from globals.css applies
    isolatedElement.setAttribute("data-app-theme", resolvedTheme);

    // Append to body (outside admin layout scope)
    document.body.appendChild(isolatedElement);

    // Set ref so ColorSwatch can read from it
    appThemeRef.current = isolatedElement;

    // Small delay to ensure CSS is applied
    const timeout = setTimeout(() => {
      // Force a re-read by triggering a style recalculation
      if (isolatedElement) {
        void isolatedElement.offsetHeight; // Force reflow
      }
    }, 50);

    // Listen for system theme changes if needed
    let mediaQuery: MediaQueryList | null = null;
    let systemThemeHandler: ((e: MediaQueryListEvent) => void) | null = null;
    if (selectedTheme === "system") {
      mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      systemThemeHandler = (e: MediaQueryListEvent) => {
        if (isolatedElement) {
          isolatedElement.setAttribute("data-app-theme", e.matches ? "dark" : "light");
          // Force reflow
          void isolatedElement.offsetHeight;
        }
      };
      mediaQuery.addEventListener("change", systemThemeHandler);
    }

    return () => {
      clearTimeout(timeout);
      if (mediaQuery && systemThemeHandler) {
        mediaQuery.removeEventListener("change", systemThemeHandler);
      }
      if (isolatedElement && isolatedElement.parentNode) {
        isolatedElement.parentNode.removeChild(isolatedElement);
      }
      appThemeRef.current = null;
    };
  }, [selectedTheme, mounted]);

  // Get available themes for dropdown
  const availableThemes = APP_THEMES.map((themeName) => {
    if (themeName === "midnight") {
      return midnightAppTheme;
    }
    if (themeName === "system") {
      return {
        name: "system",
        label: "System",
        description: "Follows system preference",
        category: "base" as const,
      };
    }
    return getTheme(themeName);
  }).filter((theme): theme is NonNullable<typeof theme> => theme !== null && theme !== undefined);

  // Update iframe src when selected theme changes
  // Simple: just pass the theme as URL param, iframe will handle it
  const getIframeSrc = () => {
    const baseUrl = "/";
    const params = new URLSearchParams();
    params.set("preview-theme", selectedTheme);
    params.set("mode", "temp-full-screen");
    return `${baseUrl}?${params.toString()}`;
  };

  // Handle theme change from dropdown - just update state, iframe will reload
  const handleThemeChange = (theme: string) => {
    setSelectedTheme(theme);
    setThemeApplied(false); // Reset applied state when theme changes
    // NO localStorage interaction - zero persistence
  };

  // Get current saved theme (localStorage if exists, otherwise config)
  const getCurrentSavedTheme = () => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("app-theme") || localStorage.getItem("theme");
      if (savedTheme) {
        return savedTheme;
      }
    }
    return currentDefaultTheme;
  };

  // Handle apply theme button click
  const handleApplyTheme = async () => {
    const currentSavedTheme = getCurrentSavedTheme();
    if (selectedTheme === currentSavedTheme) return; // Already applied

    setIsApplying(true);
    try {
      const result = await updateAppThemeConfig(selectedTheme);
      if (result.success) {
        // Update config file AND localStorage if localStorage exists
        // This ensures the applied theme persists for the current user
        const hasLocalStorage = localStorage.getItem("app-theme") || localStorage.getItem("theme");
        if (hasLocalStorage) {
          // User has a saved preference - update it to match the applied theme
          localStorage.setItem("app-theme", selectedTheme);
          logger.info("Theme applied successfully - config and localStorage updated", {
            theme: selectedTheme,
            updatedLocalStorage: true,
          });
        } else {
          // No localStorage - only config updated (for new users)
          logger.info("Theme applied successfully - config updated (no localStorage to update)", {
            theme: selectedTheme,
            updatedLocalStorage: false,
          });
        }

        setThemeApplied(true);
        // Reset applied state after 3 seconds
        setTimeout(() => {
          setThemeApplied(false);
        }, 3000);
      } else {
        logger.error("Failed to apply theme", { error: result.error });
        // You could show an error toast here
      }
    } catch (error) {
      logger.error(
        "Error applying theme",
        { theme: selectedTheme },
        error instanceof Error ? error : undefined
      );
    } finally {
      setIsApplying(false);
    }
  };

  // Check if apply button should be active
  // Compare to localStorage if exists, otherwise compare to config
  const currentSavedTheme = getCurrentSavedTheme();
  const isApplyButtonActive = selectedTheme !== currentSavedTheme && !themeApplied;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left side: Theme parameters - shown first on mobile, left on desktop */}
      <div className="space-y-6 flex-1 lg:max-w-[50%]">
        {/* Colors Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Colors</CardTitle>
            <CardDescription>
              App theme color variables and their current values (Preview theme: {selectedTheme})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {colorVariables.map((variable) => (
                <ColorSwatch key={variable.cssVar} variable={variable} appThemeRef={appThemeRef} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Headings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Headings</CardTitle>
            <CardDescription>
              Heading elements (h1, h2, h3, h4, h5, h6) and paragraph (p)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {headingItems.map((item) => {
                const Tag =
                  item.className === "p"
                    ? "p"
                    : (item.className as "h1" | "h2" | "h3" | "h4" | "h5" | "h6");
                return (
                  <div
                    key={item.className}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag className={`m-0 ${item.previewClass || ""}`}>{item.name}</Tag>
                        <CopyButton text={item.className} label={item.className} />
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>Size: {item.size}</span>
                        {item.lineHeight && <span>Line Height: {item.lineHeight}</span>}
                        {item.weight && <span>Weight: {item.weight}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{`<${item.className}>`}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Typography Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Typography</CardTitle>
            <CardDescription>Font sizes and text styles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {typographyItems.map((item) => (
                <div
                  key={item.className}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`${item.className} font-medium`}>{item.name}</p>
                      <CopyButton text={item.className} label={item.className} />
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Size: {item.size}</span>
                      {item.lineHeight && <span>Line Height: {item.lineHeight}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{item.className}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Font Weights Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Font Weights</CardTitle>
            <CardDescription>Available font weight utilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fontWeights.map((weight) => (
                <div
                  key={weight.className}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-base ${weight.className}`}>{weight.name}</p>
                      <CopyButton text={weight.className} label={weight.className} />
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Weight: {weight.weight}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {weight.className}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Font Families Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Font Families</CardTitle>
            <CardDescription>Available font family utilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-sans">Sans (Default)</p>
                    <CopyButton text="font-sans" label="font-sans" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                    sans-serif
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">font-sans</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-serif">Serif</p>
                    <CopyButton text="font-serif" label="font-serif" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ui-serif, Georgia, Cambria, "Times New Roman", Times, serif
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">font-serif</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-mono">Mono</p>
                    <CopyButton text="font-mono" label="font-mono" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
                    "Courier New", monospace
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">font-mono</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right side: Iframe with theme dropdown - shown second on mobile, right on desktop */}
      <div className="flex-1 space-y-4 order-first lg:order-last">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Theme Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Theme Selector Dropdown */}
            <div className="flex items-center gap-2">
              <Select value={selectedTheme} onValueChange={handleThemeChange}>
                <SelectTrigger id="theme-select" className="w-[200px]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {availableThemes.map((theme) => (
                    <SelectItem key={theme.name} value={theme.name}>
                      {"emoji" in theme && theme.emoji ? (
                        <span className="mr-2">{theme.emoji}</span>
                      ) : null}
                      {theme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleApplyTheme}
                disabled={!isApplyButtonActive || isApplying}
                variant={themeApplied ? "default" : "outline"}
                size="sm"
                className="ml-2"
              >
                {isApplying ? "Applying..." : themeApplied ? "Theme Applied" : "Apply Theme"}
              </Button>
            </div>

            {/* Simple iframe loading root page with temp-full-screen mode and preview theme */}
            <div
              className="w-full"
              style={{
                position: "relative",
                paddingTop: "70%", // Max height is 70% of width (aspect ratio)
                overflow: "hidden",
                borderRadius: "15px",
                border: "1px solid rgba(0, 0, 0, 0.1)", // Light border
              }}
            >
              <iframe
                ref={iframeRef}
                src={getIframeSrc()}
                className="absolute top-0 left-0"
                style={{
                  width: "250%", // Larger size to compensate for scale
                  height: "250%", // Larger size to compensate for scale
                  transform: "scale(0.4)", // 40% zoom on content
                  transformOrigin: "top left",
                }}
                title="App Root Page"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                key={selectedTheme} // Force reload when theme changes
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
