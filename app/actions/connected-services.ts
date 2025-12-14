"use server";

import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";
import { getAllServiceProviders } from "crunchycone-lib";
import type { ServiceProviderInfo } from "crunchycone-lib";
import {
  updateEnvironmentVariables,
  getEnvironmentVariables,
  getDualEnvironmentServices,
} from "@/lib/environment-service";
import { logger } from "@/lib/logger";
import { readCrunchyConeConfig } from "@/lib/crunchycone-config";

export interface SupportedServiceVariable {
  id: string;
  friendlyName: string;
  varName: string;
  value: string | null;
  required: boolean;
  sensitive: boolean;
}

export interface SupportedService {
  id: string;
  name: string;
  enabled: boolean;
  category: string;
  icon: string;
  variables: SupportedServiceVariable[];
}

/**
 * Check if the project has CrunchyCone configuration
 */
export async function hasCrunchyConeConfig(): Promise<boolean> {
  const config = readCrunchyConeConfig();
  return config !== null;
}

/**
 * Get remote environment variable values for specific variable names
 */
export async function getRemoteEnvironmentVariables(
  varNames: string[]
): Promise<Record<string, string>> {
  try {
    const session = await auth();
    if (!session || !(await hasRole(session.user.id, "admin"))) {
      throw new Error("Unauthorized");
    }

    const config = readCrunchyConeConfig();
    if (!config) {
      return {};
    }

    const { remote } = getDualEnvironmentServices();
    const remoteProviderInfo = remote.getProviderInfo();

    logger.info("DEBUG: getRemoteEnvironmentVariables - remote provider info", {
      providerType: remoteProviderInfo.type,
      isPlatform: remoteProviderInfo.isPlatformEnvironment,
    });

    // If remote provider is not platform (i.e., LocalStorage), don't try to fetch
    if (!remoteProviderInfo.isPlatformEnvironment) {
      logger.warn("DEBUG: Remote provider is not platform environment, skipping remote fetch");
      return {};
    }

    const allRemoteVars = await remote.listEnvVars();

    const result: Record<string, string> = {};
    for (const varName of varNames) {
      if (allRemoteVars[varName] !== undefined) {
        result[varName] = allRemoteVars[varName];
      }
    }

    return result;
  } catch (error) {
    logger.error(
      "Error fetching remote environment variables",
      {},
      error instanceof Error ? error : undefined
    );
    // Return empty object on error - remote might not be accessible
    return {};
  }
}

/**
 * Get all supported services with their variables from crunchycone-lib
 * Reads current values from environment variables
 */
export async function getSupportedServices(): Promise<SupportedService[]> {
  try {
    const session = await auth();
    if (!session || !(await hasRole(session.user.id, "admin"))) {
      throw new Error("Unauthorized");
    }

    // Get all service providers from crunchycone-lib
    const allProviders = await getAllServiceProviders();

    // Combine all providers from different service types
    const providers: ServiceProviderInfo[] = [
      ...allProviders.email,
      ...allProviders.storage,
      ...allProviders.ai,
      ...allProviders.environment,
    ];

    // Filter out builtin services (CrunchyCone services)
    const filteredProviders = providers.filter((provider) => !provider.builtin);

    // Get all environment variable names we need to check
    const envVarNames = filteredProviders.flatMap((provider) =>
      provider.parameters.map((param) => param.variableName)
    );

    // Get current values from environment
    const envVars = await getEnvironmentVariables(envVarNames);

    // Map to SupportedService interface with values from environment
    return filteredProviders.map((provider) => {
      return {
        id: provider.id,
        name: provider.name,
        enabled: true, // All providers from crunchycone-lib are enabled by default
        category: provider.serviceType,
        icon: provider.icon, // SVG icon from crunchycone-lib
        variables: provider.parameters.map((param) => {
          // Get value from environment variables
          const value = envVars[param.variableName] ?? null;

          return {
            id: `${provider.id}_${param.variableName}`, // Generate a unique ID
            friendlyName: param.friendlyName,
            varName: param.variableName,
            value: value,
            required: param.required,
            sensitive: param.sensitive,
          };
        }),
      };
    });
  } catch (error) {
    logger.error(
      "Error fetching supported services",
      {},
      error instanceof Error ? error : undefined
    );
    throw error;
  }
}

/**
 * Update service variable values
 * Saves values to environment variables in .env file
 * Optionally syncs to remote CrunchyCone environment
 */
export async function updateServiceVariables(
  serviceId: string,
  variables: Array<{ id: string; value: string }>,
  options?: {
    syncToRemote?: boolean;
    remoteVariables?: Array<{ id: string; value: string }>;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session || !(await hasRole(session.user.id, "admin"))) {
      return { success: false, error: "Unauthorized" };
    }

    // Get service metadata from crunchycone-lib to ensure we have proper names and categories
    const allProviders = await getAllServiceProviders();
    const allProvidersFlat = [
      ...allProviders.email,
      ...allProviders.storage,
      ...allProviders.ai,
      ...allProviders.environment,
    ];
    const serviceProvider = allProvidersFlat.find((p) => p.id === serviceId);

    if (!serviceProvider) {
      return { success: false, error: "Service not found" };
    }

    // Build environment variables to update (local)
    // Track ALL variable names, not just ones with values
    const allVarNames: string[] = [];
    const envVarsToUpdate: Record<string, string | undefined> = {};

    for (const variable of variables) {
      const varName = variable.id.replace(`${serviceId}_`, "");
      // Use the actual environment variable name from the provider metadata
      const parameter = serviceProvider.parameters.find((p) => p.variableName === varName);
      if (parameter) {
        allVarNames.push(parameter.variableName);
        // Set to undefined if empty to trigger deletion
        const value = variable.value?.trim();
        envVarsToUpdate[parameter.variableName] = value && value.length > 0 ? value : undefined;
      }
    }

    logger.info("DEBUG: envVarsToUpdate after processing variables", {
      allVarNames,
      envVarsToUpdate,
      variables: variables.map((v) => ({ id: v.id, value: v.value })),
    });

    // Handle remote sync if requested and crunchycone.toml exists
    // IMPORTANT: Process remote BEFORE local so we can fail gracefully without losing data
    const config = readCrunchyConeConfig();
    const shouldSyncToRemote =
      config !== null && (options?.syncToRemote === true || options?.remoteVariables !== undefined);

    logger.info("DEBUG: Remote sync decision", {
      hasConfig: config !== null,
      syncToRemote: options?.syncToRemote,
      hasRemoteVariables: options?.remoteVariables !== undefined,
      shouldSyncToRemote,
    });

    if (shouldSyncToRemote) {
      try {
        const { remote } = getDualEnvironmentServices();
        const remoteProviderInfo = remote.getProviderInfo();

        logger.info("DEBUG: Remote service info", {
          providerType: remoteProviderInfo.type,
          isPlatform: remoteProviderInfo.isPlatformEnvironment,
          supportsSecrets: remoteProviderInfo.supportsSecrets,
        });

        // Determine which variables to send to remote
        let remoteEnvVarsToUpdate: Record<string, string | undefined> = {};

        if (options?.syncToRemote === true) {
          // Checkbox is checked - use the same values as local
          remoteEnvVarsToUpdate = envVarsToUpdate;
          logger.info("DEBUG: Using same values for remote (checkbox checked)", {
            varsToUpdate: Object.keys(remoteEnvVarsToUpdate),
          });
        } else if (options?.remoteVariables && options.remoteVariables.length > 0) {
          // Checkbox is unchecked - use separate remote values
          for (const variable of options.remoteVariables) {
            const varName = variable.id.replace(`${serviceId}_`, "").replace("_remote", "");
            const parameter = serviceProvider.parameters.find((p) => p.variableName === varName);
            if (parameter) {
              remoteEnvVarsToUpdate[parameter.variableName] = variable.value || undefined;
            }
          }
          logger.info("DEBUG: Using separate values for remote (checkbox unchecked)", {
            varsToUpdate: Object.keys(remoteEnvVarsToUpdate),
          });
        }

        // Only proceed if we have variables to process
        // Use allVarNames instead of Object.keys() to include deletions
        if (allVarNames.length > 0) {
          // Separate variables by type: secrets vs env vars
          const secretsToSet: Record<string, string> = {};
          const envVarsToSet: Record<string, string> = {};
          const varsToDelete: string[] = [];
          const secretsToDelete: string[] = [];

          // Process all variables, including those being deleted
          for (const key of allVarNames) {
            const value = remoteEnvVarsToUpdate[key];
            // Check if this variable is marked as sensitive in the service provider
            const parameter = serviceProvider.parameters.find((p) => p.variableName === key);
            const isSensitive = parameter?.sensitive ?? false;

            if (value === undefined || value === "") {
              // Delete variable or secret
              if (isSensitive) {
                secretsToDelete.push(key);
              } else {
                varsToDelete.push(key);
              }
            } else {
              // Set variable or secret
              if (isSensitive) {
                secretsToSet[key] = value;
              } else {
                envVarsToSet[key] = value;
              }
            }
          }

          logger.info("DEBUG: About to set remote variables and secrets", {
            secretsToSet: Object.keys(secretsToSet),
            envVarsToSet: Object.keys(envVarsToSet),
            secretsToDelete,
            varsToDelete,
          });

          // Set secrets (sensitive variables)
          if (Object.keys(secretsToSet).length > 0) {
            for (const [key, value] of Object.entries(secretsToSet)) {
              await remote.setSecret(key, value);
            }
            logger.info("DEBUG: remote.setSecret completed", {
              count: Object.keys(secretsToSet).length,
            });
          }

          // Set regular environment variables
          if (Object.keys(envVarsToSet).length > 0) {
            await remote.setEnvVars(envVarsToSet);
            logger.info("DEBUG: remote.setEnvVars completed", {
              count: Object.keys(envVarsToSet).length,
            });
          }

          // Delete secrets
          for (const key of secretsToDelete) {
            try {
              await remote.deleteSecret(key);
              logger.info("DEBUG: remote.deleteSecret completed", { key });
            } catch (error) {
              logger.warn(`Failed to delete remote secret ${key}`, {
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }

          // Delete regular environment variables
          for (const key of varsToDelete) {
            try {
              await remote.deleteEnvVar(key);
              logger.info("DEBUG: remote.deleteEnvVar completed", { key });
            } catch (error) {
              logger.warn(`Failed to delete remote variable ${key}`, {
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }

          logger.info("DEBUG: Remote sync completed successfully");
        } else {
          logger.warn("DEBUG: No remote variables to update");
        }
      } catch (error) {
        // Remote sync failed - don't update local
        logger.error(
          "Remote sync failed, aborting operation",
          {},
          error instanceof Error ? error : undefined
        );

        // Determine specific error message
        const errorMessage = error instanceof Error ? error.message : String(error);
        let userMessage = "Failed to sync to published website";

        if (errorMessage.toLowerCase().includes("not authenticated")) {
          userMessage =
            "Failed to sync: Not authenticated with CrunchyCone. Please check your CLI authentication.";
        } else if (
          errorMessage.toLowerCase().includes("timeout") ||
          errorMessage.toLowerCase().includes("network")
        ) {
          userMessage =
            "Failed to sync: Could not reach CrunchyCone API. Please check your connection and try again.";
        } else if (errorMessage.toLowerCase().includes("permission")) {
          userMessage =
            "Failed to sync: Insufficient permissions to update remote environment variables.";
        } else {
          userMessage = `Failed to sync: ${errorMessage}`;
        }

        return { success: false, error: userMessage };
      }
    }

    // Update local environment variables in .env file
    // This happens AFTER remote sync (if enabled) so we don't lose data on remote failure
    const envResult = await updateEnvironmentVariables(envVarsToUpdate, { removeEmpty: true });
    if (!envResult.success) {
      return { success: false, error: envResult.error || "Failed to update environment variables" };
    }

    revalidatePath("/admin/connected-services");
    return { success: true };
  } catch (error) {
    logger.error(
      "Error updating service variables",
      {},
      error instanceof Error ? error : undefined
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update variables",
    };
  }
}
