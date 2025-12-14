/**
 * Unified Environment Service for CrunchyCone Starter
 *
 * Automatically detects runtime environment and provides appropriate backend:
 * - Local Development (CRUNCHYCONE_PLATFORM != "1"): Uses .env files
 * - Platform Deployment (CRUNCHYCONE_PLATFORM = "1"): Uses CrunchyCone API
 *
 * This service replaces direct .env file manipulation throughout the application.
 */

import {
  getCrunchyConeEnvironmentService,
  isPlatformEnvironment,
  type CrunchyConeEnvironmentService,
  type EnvironmentServiceConfig,
} from "crunchycone-lib/environment";
import { logger } from "@/lib/logger";

// Global service instance for application-wide use
let globalEnvironmentService: CrunchyConeEnvironmentService | null = null;

// Simple cache for environment variables to reduce API calls
interface CacheEntry {
  data: Record<string, string>;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

let envVarsCache: CacheEntry | null = null;
const CACHE_TTL = 60000; // 60 seconds cache for platform mode (increased from 30)

/**
 * Clear the environment variables cache
 */
function clearEnvVarsCache(): void {
  envVarsCache = null;
  logger.info("Environment variables cache cleared");
}

/**
 * Get the global environment service instance
 * Automatically detects platform and configures appropriate provider
 */
export function getEnvironmentService(
  config?: EnvironmentServiceConfig
): CrunchyConeEnvironmentService {
  // Only recreate if we don't have a global instance (production optimization)
  // globalEnvironmentService = null; // Removed forced recreation for performance

  if (!globalEnvironmentService) {
    // For getEnvironmentService(), we ONLY create a local provider
    // Remote provider should only be created via getDualEnvironmentServices()
    // This ensures fast local .env file access without API calls
    const defaultConfig: EnvironmentServiceConfig = {
      // Do NOT pass projectId or apiKey - this forces LocalStorage provider
      // Only pass config overrides if explicitly provided
      ...config,
    };

    logger.debug("Creating environment service", {
      hasApiKey: !!defaultConfig.apiKey,
      apiKeyLength: defaultConfig.apiKey?.length,
      projectId: defaultConfig.projectId,
      apiUrl: defaultConfig.apiUrl,
      isPlatformEnvironment: isPlatformEnvironment(),
    });

    try {
      globalEnvironmentService = getCrunchyConeEnvironmentService(defaultConfig);
      logger.info("Environment service created successfully");
    } catch (error) {
      logger.error(
        "Failed to create environment service",
        {},
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }
  return globalEnvironmentService;
}

// Re-export platform detection from crunchycone-lib for convenience
export { isPlatformEnvironment } from "crunchycone-lib/environment";

/**
 * Helper function to bulk update environment variables
 * Handles the differences between local (.env) and platform (API) environments
 */
export async function updateEnvironmentVariables(
  variables: Record<string, string | undefined>,
  options: {
    removeEmpty?: boolean; // Whether to delete variables with empty values
  } = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const envService = getEnvironmentService();
    const { removeEmpty = true } = options;

    // Separate variables to set vs delete
    const varsToSet: Record<string, string> = {};
    const varsToDelete: string[] = [];

    for (const [key, value] of Object.entries(variables)) {
      if (value === undefined || (removeEmpty && value === "")) {
        varsToDelete.push(key);
      } else {
        varsToSet[key] = value;
      }
    }

    // Set variables (bulk operation for efficiency)
    if (Object.keys(varsToSet).length > 0) {
      await envService.setEnvVars(varsToSet);
    }

    // Delete variables (individual operations)
    for (const key of varsToDelete) {
      try {
        await envService.deleteEnvVar(key);
      } catch (error) {
        // Continue if deletion fails (variable might not exist)
        logger.warn(`Failed to delete environment variable ${key}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Clear cache after successful update
    if (isPlatformEnvironment()) {
      clearEnvVarsCache();
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(
      "Failed to update environment variables",
      {},
      error instanceof Error ? error : undefined
    );
    return {
      success: false,
      error: `Failed to update environment variables: ${errorMessage}`,
    };
  }
}

/**
 * Get multiple environment variables at once
 * Uses aggressive caching for platform mode to reduce API calls
 */
export async function getEnvironmentVariables(
  keys: string[]
): Promise<Record<string, string | undefined>> {
  try {
    const isPlatform = isPlatformEnvironment();

    // In platform mode, use the cached getAllEnvironmentVariables for better performance
    if (isPlatform) {
      const allVars = await getAllEnvironmentVariables();
      const result: Record<string, string | undefined> = {};

      for (const key of keys) {
        result[key] = allVars[key];
      }

      return result;
    }

    // In local mode, fetch individually as before
    const envService = getEnvironmentService();
    const result: Record<string, string | undefined> = {};

    for (const key of keys) {
      result[key] = await envService.getEnvVar(key);
    }

    return result;
  } catch (error) {
    logger.error(
      "Failed to get environment variables",
      {},
      error instanceof Error ? error : undefined
    );
    return {};
  }
}

/**
 * Check if cache is valid
 */
function isCacheValid(cache: CacheEntry | null): boolean {
  if (!cache) return false;
  const now = Date.now();
  return now - cache.timestamp < cache.ttl;
}

/**
 * Get all environment variables with caching for platform mode
 */
export async function getAllEnvironmentVariables(): Promise<Record<string, string>> {
  try {
    const isPlatform = isPlatformEnvironment();

    // Use cache in platform mode to reduce API calls
    if (isPlatform && isCacheValid(envVarsCache)) {
      logger.info("Using cached environment variables");
      return envVarsCache!.data;
    }

    const envService = getEnvironmentService();
    const envVars = await envService.listEnvVars();

    // Cache the result in platform mode
    if (isPlatform) {
      envVarsCache = {
        data: envVars,
        timestamp: Date.now(),
        ttl: CACHE_TTL,
      };
      logger.info("Cached environment variables", {
        ttlSeconds: CACHE_TTL / 1000,
      });
    }

    return envVars;
  } catch (error) {
    logger.error(
      "Failed to get all environment variables",
      {},
      error instanceof Error ? error : undefined
    );
    return {};
  }
}

/**
 * Check if environment service supports secrets (only on platform)
 */
export function supportsSecrets(): boolean {
  const envService = getEnvironmentService();
  return envService.supportsSecrets();
}

/**
 * Get information about the current environment service configuration
 */
export function getEnvironmentServiceInfo(): {
  type: "local" | "remote";
  supportsSecrets: boolean;
  isPlatformEnvironment: boolean;
} {
  const envService = getEnvironmentService();
  return envService.getProviderInfo();
}

/**
 * Legacy compatibility: Simulate writing to .env file format
 * This helps with migration from direct file writing
 */
export async function updateEnvironmentSection(
  sectionName: string,
  variables: Record<string, string | undefined>
): Promise<{ success: boolean; error?: string }> {
  logger.info(`Updating environment section: ${sectionName}`);

  // In the new approach, we don't have sections - just set all variables
  const result = await updateEnvironmentVariables(variables);

  // Cache is cleared in updateEnvironmentVariables, so no need to clear again
  return result;
}

/**
 * Get separate local and remote environment services for dual-mode operation
 * This allows us to work with both .env and CrunchyCone simultaneously in local mode
 */
export function getDualEnvironmentServices(): {
  local: CrunchyConeEnvironmentService;
  remote: CrunchyConeEnvironmentService;
} {
  // Get project ID from crunchycone.toml
  let projectIdFromToml: string | undefined;
  try {
    const fs = require("fs");

    const path = require("path");
    const tomlPath = path.join(process.cwd(), "crunchycone.toml");
    if (fs.existsSync(tomlPath)) {
      const tomlContent = fs.readFileSync(tomlPath, "utf8");
      const match = tomlContent.match(/id\s*=\s*"([^"]+)"/);
      if (match) {
        projectIdFromToml = match[1];
      }
    }
  } catch (error) {
    logger.warn("Failed to read crunchycone.toml for dual services", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Local service for .env files
  const localService = getCrunchyConeEnvironmentService({});

  // Remote service for CrunchyCone API
  // Pass projectId - crunchycone-lib v0.1.42+ will automatically use keytar for API key
  const remoteService = getCrunchyConeEnvironmentService({
    projectId: process.env.CRUNCHYCONE_PROJECT_ID || projectIdFromToml,
    apiUrl: process.env.CRUNCHYCONE_API_URL || "https://api.crunchycone.dev",
  });

  // Get provider info to verify configuration
  const localProviderInfo = localService.getProviderInfo();
  const remoteProviderInfo = remoteService.getProviderInfo();

  logger.info("DEBUG: Created dual environment services", {
    hasProjectId: !!(process.env.CRUNCHYCONE_PROJECT_ID || projectIdFromToml),
    projectId: process.env.CRUNCHYCONE_PROJECT_ID || projectIdFromToml,
    localProvider: localProviderInfo.type,
    remoteProvider: remoteProviderInfo.type,
    localIsPlatform: localProviderInfo.isPlatformEnvironment,
    remoteIsPlatform: remoteProviderInfo.isPlatformEnvironment,
  });

  // Log warning if remote is not actually remote
  if (!remoteProviderInfo.isPlatformEnvironment) {
    logger.warn("WARNING: Remote service is NOT a platform environment (likely LocalStorage)!");
  }

  return { local: localService, remote: remoteService };
}

/**
 * Get merged environment variables from both local (.env) and remote (CrunchyCone)
 * Only used in local mode for unified view
 */
export async function getMergedEnvironmentVariables(): Promise<{
  variables: Array<{
    key: string;
    localValue: string;
    remoteValue?: string;
    isSecret: boolean;
    isRemoteSecret?: boolean;
    hasConflict: boolean;
  }>;
  supportsRemoteSecrets: boolean;
}> {
  try {
    logger.info("getMergedEnvironmentVariables: Starting dual environment services");
    const { local, remote } = getDualEnvironmentServices();
    logger.info("getMergedEnvironmentVariables: Dual services created");

    // Get local environment variables
    logger.info("getMergedEnvironmentVariables: Fetching local vars");
    const localVars = await local.listEnvVars();
    logger.debug("getMergedEnvironmentVariables: Local vars fetched", {
      count: Object.keys(localVars).length,
    });

    // Get remote environment variables and secrets
    let remoteVars: Record<string, string> = {};
    let remoteSecrets: string[] = [];
    let supportsRemoteSecrets = false;

    try {
      logger.info("getMergedEnvironmentVariables: Fetching remote vars");
      remoteVars = await remote.listEnvVars();
      logger.debug("getMergedEnvironmentVariables: Remote vars fetched", {
        count: Object.keys(remoteVars).length,
      });

      if (remote.supportsSecrets()) {
        supportsRemoteSecrets = true;
        logger.info("getMergedEnvironmentVariables: Fetching remote secrets");
        remoteSecrets = await remote.listSecretNames();
        logger.debug("getMergedEnvironmentVariables: Remote secrets fetched", {
          count: remoteSecrets.length,
        });
      }
    } catch (error) {
      // Remote access may fail, continue with local only
      logger.error(
        "getMergedEnvironmentVariables: Failed to fetch remote environment variables",
        {},
        error instanceof Error ? error : undefined
      );
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.toLowerCase().includes("not authenticated")) {
        logger.warn("This appears to be a CrunchyCone authentication error from crunchycone-lib");
      }
    }

    // Create unified list of all keys
    const allKeys = new Set([
      ...Object.keys(localVars),
      ...Object.keys(remoteVars),
      ...remoteSecrets,
    ]);

    logger.info("getMergedEnvironmentVariables: All keys count", {
      count: allKeys.size,
    });
    logger.debug("getMergedEnvironmentVariables: Remote vars keys", {
      sampleKeys: Object.keys(remoteVars).slice(0, 5),
    });
    logger.info("getMergedEnvironmentVariables: Remote secrets", {
      count: remoteSecrets.length,
    });

    // Helper function to determine if a key is sensitive
    const isSensitiveKey = (key: string): boolean => {
      const sensitiveKeywords = [
        "secret",
        "key",
        "password",
        "token",
        "auth",
        "api",
        "private",
        "credential",
        "pass",
        "jwt",
        "oauth",
        "github",
        "google",
        "aws",
        "azure",
        "gcp",
        "stripe",
        "paypal",
        "database",
        "db",
        "redis",
        "session",
        "cookie",
        "smtp",
        "email",
        "twilio",
        "sendgrid",
        "crunchycone",
        "do",
        "spaces",
        "bucket",
        "access",
        "client",
      ];
      const lowerKey = key.toLowerCase();
      return sensitiveKeywords.some((keyword) => lowerKey.includes(keyword));
    };

    const variables = Array.from(allKeys).map((key) => {
      const localValue = localVars[key] || "";
      const remoteValue = remoteVars[key];
      const isRemoteSecret = remoteSecrets.includes(key);
      const isSecret = isSensitiveKey(key);
      const hasConflict =
        localValue !== "" && remoteValue !== undefined && localValue !== remoteValue;

      return {
        key,
        localValue,
        remoteValue: isRemoteSecret ? "••••••••" : remoteValue,
        isSecret,
        isRemoteSecret,
        hasConflict,
      };
    });

    // Sort alphabetically by key
    variables.sort((a, b) => a.key.localeCompare(b.key));

    logger.info("getMergedEnvironmentVariables: Final variables count", {
      count: variables.length,
    });
    logger.debug("getMergedEnvironmentVariables: Sample variables", {
      samples: variables.slice(0, 3).map((v) => ({
        key: v.key,
        hasLocal: !!v.localValue,
        hasRemote: !!v.remoteValue,
        isRemoteSecret: v.isRemoteSecret,
      })),
    });

    return {
      variables,
      supportsRemoteSecrets,
    };
  } catch (error) {
    logger.error(
      "Failed to get merged environment variables",
      {},
      error instanceof Error ? error : undefined
    );
    return {
      variables: [],
      supportsRemoteSecrets: false,
    };
  }
}

/**
 * Push local environment variables to remote CrunchyCone
 */
export async function pushToRemote(
  keys?: string[]
): Promise<{ success: boolean; error?: string; pushedCount?: number }> {
  try {
    const { local, remote } = getDualEnvironmentServices();
    const localVars = await local.listEnvVars();

    let varsToPush: Record<string, string> = {};

    if (keys && keys.length > 0) {
      // Push only specified keys
      for (const key of keys) {
        if (localVars[key] !== undefined) {
          varsToPush[key] = localVars[key];
        }
      }
    } else {
      // Push all local variables
      varsToPush = localVars;
    }

    if (Object.keys(varsToPush).length === 0) {
      return { success: false, error: "No variables to push" };
    }

    await remote.setEnvVars(varsToPush);

    // Clear cache after successful push
    clearEnvVarsCache();

    return {
      success: true,
      pushedCount: Object.keys(varsToPush).length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to push to remote", {}, error instanceof Error ? error : undefined);
    return {
      success: false,
      error: `Failed to push variables to remote: ${errorMessage}`,
    };
  }
}

/**
 * Pull remote environment variables to local .env
 */
export async function pullFromRemote(
  keys?: string[]
): Promise<{ success: boolean; error?: string; pulledCount?: number }> {
  try {
    const { local, remote } = getDualEnvironmentServices();
    const remoteVars = await remote.listEnvVars();

    let varsToPull: Record<string, string> = {};

    if (keys && keys.length > 0) {
      // Pull only specified keys
      for (const key of keys) {
        if (remoteVars[key] !== undefined) {
          varsToPull[key] = remoteVars[key];
        }
      }
    } else {
      // Pull all remote variables (excluding secrets since they can't be read)
      varsToPull = remoteVars;
    }

    if (Object.keys(varsToPull).length === 0) {
      return { success: false, error: "No variables to pull" };
    }

    await local.setEnvVars(varsToPull);

    // Clear cache after successful pull (affects local .env, but clear for consistency)
    clearEnvVarsCache();

    return {
      success: true,
      pulledCount: Object.keys(varsToPull).length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to pull from remote", {}, error instanceof Error ? error : undefined);
    return {
      success: false,
      error: `Failed to pull variables from remote: ${errorMessage}`,
    };
  }
}

// Re-export types for convenience
export type { CrunchyConeEnvironmentService, EnvironmentServiceConfig };
