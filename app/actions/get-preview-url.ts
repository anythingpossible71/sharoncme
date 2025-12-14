"use server";

import { execSync } from "child_process";
import { logger } from "@/lib/logger";

export interface PreviewUrlResult {
  url: string | null;
  source: "build" | "slug" | "none";
  hasPublishedVersion: boolean;
}

/**
 * Get the preview URL for the latest published version
 * Checks the latest 5 builds for a successful one with a publish_url
 * Returns null if no successful build found
 */
export async function getPreviewUrl(): Promise<PreviewUrlResult> {
  try {
    const result = execSync("npx --yes crunchycone-cli project builds list -j format -l 5", {
      encoding: "utf-8",
    });

    const data = JSON.parse(result);

    // Find the first successful build with a publish_url
    if (data.success && data.data?.builds && data.data.builds.length > 0) {
      const successfulBuild = data.data.builds.find(
        (build: { status: string; publish_url?: string }) =>
          build.status === "success" && build.publish_url
      );

      if (successfulBuild?.publish_url) {
        logger.debug("Found published URL from successful build", {
          url: successfulBuild.publish_url,
        });
        return {
          url: successfulBuild.publish_url,
          source: "build",
          hasPublishedVersion: true,
        };
      }
    }

    // No successful build with publish_url found
    logger.debug("No published version found");
    return {
      url: null,
      source: "none",
      hasPublishedVersion: false,
    };
  } catch (error) {
    logger.error("Error getting preview URL", {}, error instanceof Error ? error : undefined);

    // On error, indicate no published version
    return {
      url: null,
      source: "none",
      hasPublishedVersion: false,
    };
  }
}
