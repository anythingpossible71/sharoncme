"use server";

import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { logger } from "@/lib/logger";

const APP_SETTINGS_ID = "app-settings-singleton";

// Get default app name from package.json and format it nicely
function getDefaultAppName(): string {
  try {
    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJsonContent = readFileSync(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(packageJsonContent);
    const packageName = packageJson.name || "crunchycone-vanilla-starter-project";
    // Convert "crunchycone-vanilla-starter-project" to "CrunchyCone Vanilla Starter Project"
    return packageName
      .split("-")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  } catch (error) {
    logger.error("Error reading package.json", {}, error instanceof Error ? error : undefined);
    // Fallback to default
    return "CrunchyCone Vanilla Starter Project";
  }
}

const DEFAULT_APP_NAME = getDefaultAppName();
const DEFAULT_APP_DESCRIPTION = "A production-ready Next.js starter with auth and admin dashboard";

const PUBLIC_DIR = join(process.cwd(), "public");
const LOGO_FILENAME = "app-logo";
const ICON_FILENAME = "app-icon";
const PREVIEW_IMAGE_FILENAME = "app-preview-image";

/**
 * Check if app-logo or app-icon file exists in /public folder
 * Returns the full filename with extension if found, null otherwise
 * Priority: app-logo.* > app-icon.*
 */
function findAppLogoFile(): string | null {
  try {
    if (!existsSync(PUBLIC_DIR)) {
      return null;
    }

    const files = readdirSync(PUBLIC_DIR);
    // First check for app-logo.*
    const logoFile = files.find((file) => file.startsWith(LOGO_FILENAME + "."));
    if (logoFile) {
      return `/${logoFile}`;
    }

    // Fallback to app-icon.*
    const iconFile = files.find((file) => file.startsWith(ICON_FILENAME + "."));
    if (iconFile) {
      return `/${iconFile}`;
    }

    return null;
  } catch (error) {
    logger.error(
      "Error checking for app-logo/app-icon file",
      { action: "getAppSettings" },
      error instanceof Error ? error : undefined
    );
    return null;
  }
}

/**
 * Check if app-preview-image file exists in /public folder
 * Returns the full filename with extension if found, null otherwise
 */
function findAppPreviewImageFile(): string | null {
  try {
    if (!existsSync(PUBLIC_DIR)) {
      logger.debug("Public directory does not exist", { action: "findAppPreviewImageFile" });
      return null;
    }

    const files = readdirSync(PUBLIC_DIR);
    logger.debug("Files in public directory", {
      action: "findAppPreviewImageFile",
      fileCount: files.length,
      files: files.filter((f) => f.startsWith(PREVIEW_IMAGE_FILENAME)),
    });

    const previewFile = files.find((file) => file.startsWith(PREVIEW_IMAGE_FILENAME + "."));
    if (previewFile) {
      const url = `/${previewFile}`;
      logger.info("Found app-preview-image file", {
        action: "findAppPreviewImageFile",
        filename: previewFile,
        url,
      });
      return url;
    }

    logger.debug("No app-preview-image file found", { action: "findAppPreviewImageFile" });
    return null;
  } catch (error) {
    logger.error(
      "Error checking for app-preview-image file",
      { action: "findAppPreviewImageFile" },
      error instanceof Error ? error : undefined
    );
    return null;
  }
}

/**
 * Migrate logo from storage URL to /public folder
 * Downloads the logo from storage and saves it as app-logo.{ext}
 */
async function migrateLogoFromStorage(storageUrl: string): Promise<string | null> {
  try {
    // Extract file extension from URL or use default
    const urlParts = storageUrl.split(".");
    const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1].split("?")[0] : "png";
    const validExtensions = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
    const fileExtension = validExtensions.includes(extension.toLowerCase())
      ? extension.toLowerCase()
      : "png";

    // Construct full URL if it's a relative path
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const fullUrl = storageUrl.startsWith("http") ? storageUrl : `${baseUrl}${storageUrl}`;

    logger.info("Downloading logo from storage", {
      action: "migrateLogoFromStorage",
      url: fullUrl,
    });

    // Download the file
    const response = await fetch(fullUrl);
    if (!response.ok) {
      logger.error("Failed to download logo", {
        action: "migrateLogoFromStorage",
        status: response.statusText,
        url: fullUrl,
      });
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Ensure public directory exists
    if (!existsSync(PUBLIC_DIR)) {
      await mkdir(PUBLIC_DIR, { recursive: true });
    }

    // Save to /public/app-logo.{ext}
    const filename = `${LOGO_FILENAME}.${fileExtension}`;
    const filePath = join(PUBLIC_DIR, filename);
    await writeFile(filePath, buffer);

    logger.info("Logo migrated successfully", {
      action: "migrateLogoFromStorage",
      filename,
    });

    // Update database to store the new path
    await prisma.appSettings.update({
      where: { id: APP_SETTINGS_ID },
      data: { app_logo_url: `/${filename}` },
    });

    return `/${filename}`;
  } catch (error) {
    logger.error(
      "Error migrating logo from storage",
      { action: "migrateLogoFromStorage" },
      error instanceof Error ? error : undefined
    );
    return null;
  }
}

/**
 * Normalize logo URL - convert storage URLs to /public paths
 */
async function normalizeLogoUrl(storedUrl: string | null | undefined): Promise<string | undefined> {
  if (!storedUrl) {
    // Check if app-logo file exists in /public
    return findAppLogoFile() || undefined;
  }

  // If already a /app-logo path, return as-is
  if (storedUrl.startsWith("/app-logo.")) {
    return storedUrl;
  }

  // If it's a storage URL, try to migrate it
  if (storedUrl.includes("/api/storage/") || storedUrl.includes("/storage/")) {
    logger.info("Found storage URL, attempting migration", {
      action: "normalizeLogoUrl",
      url: storedUrl,
    });
    const migratedUrl = await migrateLogoFromStorage(storedUrl);
    if (migratedUrl) {
      return migratedUrl;
    }
    // If migration fails, check if app-logo file exists
    return findAppLogoFile() || undefined;
  }

  // For other URLs (external), return as-is but log a warning
  logger.warn("Unexpected logo URL format", {
    action: "normalizeLogoUrl",
    url: storedUrl,
  });
  return storedUrl;
}

/**
 * Normalize preview image URL - check file system if database doesn't have it
 * Also verifies that stored URLs actually point to existing files
 */
function normalizePreviewImageUrl(storedUrl: string | null | undefined): string | undefined {
  logger.debug("Normalizing preview image URL", {
    action: "normalizePreviewImageUrl",
    storedUrl,
  });

  if (!storedUrl) {
    // Check if app-preview-image file exists in /public
    const fileSystemUrl = findAppPreviewImageFile();
    logger.info("Preview image URL from file system", {
      action: "normalizePreviewImageUrl",
      fileSystemUrl,
    });
    return fileSystemUrl || undefined;
  }

  // If already a /app-preview-image path, verify the file exists
  if (storedUrl.startsWith("/app-preview-image.")) {
    // Extract filename from URL (remove leading slash)
    const filename = storedUrl.substring(1);
    const filePath = join(PUBLIC_DIR, filename);

    // Verify file exists
    if (existsSync(filePath)) {
      logger.debug("Preview image URL is valid and file exists", {
        action: "normalizePreviewImageUrl",
        storedUrl,
        filename,
      });
      return storedUrl;
    } else {
      // File doesn't exist, clear the invalid URL and check file system
      logger.warn("Preview image URL in database points to non-existent file", {
        action: "normalizePreviewImageUrl",
        storedUrl,
        filePath,
      });
      const fileSystemUrl = findAppPreviewImageFile();
      logger.info("Preview image URL from file system (after invalid URL)", {
        action: "normalizePreviewImageUrl",
        fileSystemUrl,
      });
      return fileSystemUrl || undefined;
    }
  }

  // For other URLs (storage URLs, external), return as-is
  logger.debug("Preview image URL is external/storage URL", {
    action: "normalizePreviewImageUrl",
    storedUrl,
  });
  return storedUrl;
}

export interface AppSettings {
  appName: string;
  appDescription?: string;
  appLogoUrl?: string;
  appPreviewImageUrl?: string;
  subdomain?: string;
  domainType?: string; // 'customize', 'own', 'purchase'
  customDomain?: string;
}

/**
 * Get app settings (app name and description)
 * Returns default values from package.json if not set
 */
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const settings = await prisma.appSettings.findFirst({
      where: {
        id: APP_SETTINGS_ID,
        deleted_at: null,
      },
    });

    if (settings) {
      // Normalize logo URL - migrate from storage if needed
      const normalizedLogoUrl = await normalizeLogoUrl(settings.app_logo_url);
      // Normalize preview image URL - check file system if database doesn't have it
      const normalizedPreviewImageUrl = normalizePreviewImageUrl(settings.app_preview_image_url);

      const result = {
        appName: settings.app_name,
        appDescription: settings.app_description || undefined,
        appLogoUrl: normalizedLogoUrl,
        appPreviewImageUrl: normalizedPreviewImageUrl,
        subdomain: settings.subdomain || undefined,
        domainType: settings.domain_type || undefined,
        customDomain: settings.custom_domain || undefined,
      };
      logger.info("Loaded app settings from database", {
        app_logo_url: settings.app_logo_url,
        normalized_logo_url: normalizedLogoUrl,
        app_preview_image_url: settings.app_preview_image_url,
        normalized_preview_image_url: normalizedPreviewImageUrl,
        subdomain: settings.subdomain,
        domain_type: settings.domain_type,
        custom_domain: settings.custom_domain,
        returned_appLogoUrl: result.appLogoUrl,
        returned_appPreviewImageUrl: result.appPreviewImageUrl,
      });
      return result;
    }

    // Return defaults from package.json if no settings exist
    return {
      appName: DEFAULT_APP_NAME,
      appDescription: DEFAULT_APP_DESCRIPTION,
    };
  } catch (error) {
    logger.error("Error getting app settings", {}, error instanceof Error ? error : undefined);
    // Return defaults from package.json on error
    return {
      appName: DEFAULT_APP_NAME,
      appDescription: DEFAULT_APP_DESCRIPTION,
    };
  }
}

/**
 * Update app settings (admin only)
 */
export async function updateAppSettings(
  settings: AppSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session || !(await hasRole(session.user.id, "admin"))) {
      return { success: false, error: "Unauthorized" };
    }

    logger.info("Saving app settings", {
      appName: settings.appName,
      appDescription: settings.appDescription,
      appLogoUrl: settings.appLogoUrl,
      appPreviewImageUrl: settings.appPreviewImageUrl,
      subdomain: settings.subdomain,
      domainType: settings.domainType,
      customDomain: settings.customDomain,
    });

    // Upsert settings (create if doesn't exist, update if it does)
    // Use nullish coalescing to preserve empty strings (only convert undefined to null)
    const result = await prisma.appSettings.upsert({
      where: { id: APP_SETTINGS_ID },
      create: {
        id: APP_SETTINGS_ID,
        app_name: settings.appName,
        app_description: settings.appDescription ?? null,
        app_logo_url: settings.appLogoUrl ?? null,
        app_preview_image_url: settings.appPreviewImageUrl ?? null,
        subdomain: settings.subdomain ?? null,
        domain_type: settings.domainType ?? null,
        custom_domain: settings.customDomain ?? null,
      },
      update: {
        app_name: settings.appName,
        app_description: settings.appDescription ?? null,
        app_logo_url: settings.appLogoUrl ?? null,
        app_preview_image_url: settings.appPreviewImageUrl ?? null,
        subdomain: settings.subdomain ?? null,
        domain_type: settings.domainType ?? null,
        custom_domain: settings.customDomain ?? null,
      },
    });

    logger.info("App settings saved to database", {
      app_logo_url: result.app_logo_url,
      app_preview_image_url: result.app_preview_image_url,
      subdomain: result.subdomain,
      domain_type: result.domain_type,
      custom_domain: result.custom_domain,
    });

    revalidatePath("/admin/app-details");
    revalidatePath("/"); // Revalidate root to update metadata
    return { success: true };
  } catch (error) {
    logger.error("Error updating app settings", {}, error instanceof Error ? error : undefined);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: `Failed to update app settings: ${errorMessage}` };
  }
}

/**
 * Get app name only (for convenience)
 */
export async function getAppName(): Promise<string> {
  const settings = await getAppSettings();
  return settings.appName;
}
