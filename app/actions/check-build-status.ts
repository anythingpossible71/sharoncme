"use server";

import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "@/lib/logger";

const execAsync = promisify(exec);

// Timeout for CLI command (10 seconds)
const CLI_TIMEOUT_MS = 10000;

export type BuildStatus = "pending" | "running" | "deploying" | "success" | "failed" | "canceled";

export interface BuildStatusResult {
  status: BuildStatus;
  commitSha: string | null;
  finishedAt: string | null;
  createdAt: string | null;
  commitMessage?: string;
  publishUrl?: string;
}

export async function checkBuildStatus(): Promise<BuildStatusResult> {
  try {
    const { stdout } = await execAsync(
      "npx --yes crunchycone-cli project builds list -j format -l 1",
      { encoding: "utf-8", timeout: CLI_TIMEOUT_MS }
    );

    const data = JSON.parse(stdout);

    // Handle no builds case - throw error so admin layout treats it as no initial status
    if (!data.success || !data.data?.builds || data.data.builds.length === 0) {
      logger.debug("No builds found");
      throw new Error("No builds found");
    }

    const latestBuild = data.data.builds[0];

    logger.debug("Build status retrieved", {
      status: latestBuild.status,
      commitSha: latestBuild.commit_sha,
    });

    return {
      status: latestBuild.status as BuildStatus,
      commitSha: latestBuild.commit_sha,
      finishedAt: latestBuild.finished_at,
      createdAt: latestBuild.created_at,
      commitMessage: latestBuild.commit_message,
      publishUrl: latestBuild.publish_url,
    };
  } catch (error) {
    logger.error("Error checking build status", {}, error instanceof Error ? error : undefined);
    throw new Error("Failed to check build status");
  }
}
