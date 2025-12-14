"use server";

import fs from "fs";
import path from "path";
import { logger } from "@/lib/logger";

export async function updateAppThemeConfig(
  theme: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const configPath = path.join(process.cwd(), "config", "app-theme.config.ts");

    // Read current config file
    const configContent = fs.readFileSync(configPath, "utf8");

    // Update the currentTheme value
    const updatedContent = configContent.replace(
      /currentTheme:\s*"[^"]*"/,
      `currentTheme: "${theme}"`
    );

    // Write back to file
    fs.writeFileSync(configPath, updatedContent, "utf8");

    logger.info("App theme config updated", { theme, configPath });

    return { success: true };
  } catch (error) {
    logger.error(
      "Failed to update app theme config",
      { theme },
      error instanceof Error ? error : undefined
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
