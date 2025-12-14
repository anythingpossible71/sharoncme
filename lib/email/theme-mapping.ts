import { Theme } from "@/themes/types";

/**
 * Convert HSL color string to hex color
 * @param hsl - HSL color string in format "hue saturation% lightness%"
 * @returns Hex color string
 */
export function hslToHex(hsl: string): string {
  const [h, s, l] = hsl.split(" ").map((v) => parseFloat(v.replace("%", "")));

  // Convert HSL to RGB
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((hNorm * 6) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (hNorm < 1 / 6) {
    r = c;
    g = x;
    b = 0;
  } else if (hNorm < 2 / 6) {
    r = x;
    g = c;
    b = 0;
  } else if (hNorm < 3 / 6) {
    r = 0;
    g = c;
    b = x;
  } else if (hNorm < 4 / 6) {
    r = 0;
    g = x;
    b = c;
  } else if (hNorm < 5 / 6) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Email design parameters interface
 */
export interface EmailDesignParams {
  // CTA Button Styling
  buttonBackgroundColor: string;
  buttonTextColor: string;

  // Link Color
  linkColor: string;

  // Font Family and Weights
  fontFamily: string;
  headingFontWeight: string;
  bodyFontWeight: string;
  buttonFontWeight: string;

  // Header Background and Text
  headerBackground: string;
  headerTextColor: string;

  // Additional theme-based mappings
  backgroundColor: string;
  contentBackground: string;
  secondaryTextColor: string;
  borderColor: string;

  // Border radius
  buttonBorderRadius: string;
}

/**
 * Get email design parameters from theme
 * @param theme - The current theme
 * @returns Email design parameters
 */
export function getEmailDesignFromTheme(theme: Theme): EmailDesignParams {
  return {
    // CTA Button Styling
    buttonBackgroundColor: hslToHex(theme.colors.primary),
    buttonTextColor: hslToHex(theme.colors.primaryForeground),

    // Link Color
    linkColor: hslToHex(theme.colors.primary),

    // Font Family (consistent across themes)
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    headingFontWeight: "bold",
    bodyFontWeight: "normal",
    buttonFontWeight: "bold",

    // Header Background and Text
    headerBackground: hslToHex(theme.colors.primary),
    headerTextColor: hslToHex(theme.colors.primaryForeground),

    // Additional theme-based mappings
    backgroundColor: hslToHex(theme.colors.background),
    contentBackground: hslToHex(theme.colors.card),
    secondaryTextColor: hslToHex(theme.colors.mutedForeground),
    borderColor: hslToHex(theme.colors.border),

    // Use theme radius for buttons
    buttonBorderRadius: theme.radius,
  };
}

/**
 * Get current theme-based email design parameters
 * @param themeName - Optional theme name, defaults to 'light'
 * @returns Email design parameters for the current theme
 */
export async function getCurrentThemeEmailDesign(
  themeName: string = "light"
): Promise<EmailDesignParams> {
  // Import theme utilities
  const { getTheme } = await import("@/themes");

  // Get the specified theme or fallback to light
  const currentTheme = getTheme(themeName) || getTheme("light");

  if (!currentTheme) {
    throw new Error(`Theme not found: ${themeName}`);
  }

  return getEmailDesignFromTheme(currentTheme);
}

/**
 * Get email design parameters for a specific theme
 * @param themeName - The theme name to use
 * @returns Email design parameters for the specified theme
 */
export async function getThemeEmailDesign(themeName: string): Promise<EmailDesignParams> {
  const { getTheme } = await import("@/themes");
  const theme = getTheme(themeName);

  if (!theme) {
    throw new Error(`Theme '${themeName}' not found`);
  }

  return getEmailDesignFromTheme(theme);
}

/**
 * Convert email design params to Liquid template variables
 * @param params - Email design parameters
 * @returns Object with Liquid template variable names
 */
export function emailDesignToLiquidVars(params: EmailDesignParams) {
  return {
    theme_primary: params.buttonBackgroundColor,
    theme_primary_foreground: params.buttonTextColor,
    theme_link_color: params.linkColor,
    theme_font_family: params.fontFamily,
    theme_heading_weight: params.headingFontWeight,
    theme_body_weight: params.bodyFontWeight,
    theme_button_weight: params.buttonFontWeight,
    theme_header_bg: params.headerBackground,
    theme_header_text: params.headerTextColor,
    theme_background: params.backgroundColor,
    theme_content_bg: params.contentBackground,
    theme_secondary_text: params.secondaryTextColor,
    theme_border_color: params.borderColor,
    theme_button_radius: params.buttonBorderRadius,
  };
}
