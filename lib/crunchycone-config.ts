import fs from "fs";
import path from "path";
import { logger } from "@/lib/logger";

export interface CrunchyConeConfig {
  id: string;
  environment: string;
}

/**
 * Read crunchycone.toml configuration file
 * Returns null if file doesn't exist or can't be parsed
 */
export function readCrunchyConeConfig(): CrunchyConeConfig | null {
  try {
    const tomlPath = path.join(process.cwd(), "crunchycone.toml");

    if (!fs.existsSync(tomlPath)) {
      return null;
    }

    const tomlContent = fs.readFileSync(tomlPath, "utf8");

    // Parse id and environment from TOML
    const idMatch = tomlContent.match(/id\s*=\s*"([^"]+)"/);
    const envMatch = tomlContent.match(/environment\s*=\s*"([^"]+)"/);

    if (!idMatch) {
      return null;
    }

    return {
      id: idMatch[1],
      environment: envMatch ? envMatch[1] : "dev",
    };
  } catch (error) {
    logger.warn("Failed to read crunchycone.toml", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Generate CrunchyCone custom domain URL based on configuration
 * Returns null if config doesn't exist
 */
export function getCrunchyConeCustomDomainUrl(): string | null {
  const config = readCrunchyConeConfig();

  if (!config) {
    return null;
  }

  // For now, always use dev environment
  // In the future, this could be expanded to handle other environments
  const baseUrl =
    config.environment === "prod" ? "https://app.crunchycone.com" : "https://app.crunchycone.dev";

  return `${baseUrl}/projects/${config.id}#domains`;
}

/**
 * Generate CrunchyCone deployments URL based on configuration
 * Returns null if config doesn't exist
 */
export function getCrunchyConeDeploymentsUrl(): string | null {
  const config = readCrunchyConeConfig();

  if (!config) {
    return null;
  }

  const baseUrl =
    config.environment === "prod" ? "https://app.crunchycone.com" : "https://app.crunchycone.dev";

  return `${baseUrl}/projects/${config.id}#deployments`;
}
