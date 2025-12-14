"use server";

import { execSync } from "child_process";
import { logger } from "@/lib/logger";

export type PublishStatusReason = "uncommitted" | "unpushed" | "error";

export interface PublishStatusResult {
  needsCommit: boolean;
  reason?: PublishStatusReason;
}

export async function checkPublishStatus(): Promise<PublishStatusResult> {
  try {
    // Check if directory is git dirty (uncommitted changes)
    const statusOutput = execSync("git status --porcelain", {
      encoding: "utf-8",
    });
    const isDirty = statusOutput.trim().length > 0;

    if (isDirty) {
      logger.debug("Git repository has uncommitted changes");
      return {
        needsCommit: true,
        reason: "uncommitted",
      };
    }

    // Check if local is ahead of remote (unpushed commits)
    // First, check if there's a remote configured
    let hasRemote = false;
    try {
      const remotes = execSync("git remote", { encoding: "utf-8" }).trim();
      hasRemote = remotes.length > 0;
    } catch {
      hasRemote = false;
    }

    if (!hasRemote) {
      // No remote configured - treat as clean (can't check for unpushed commits)
      logger.debug("No git remote configured, skipping unpushed commits check");
      return { needsCommit: false };
    }

    // Get the current branch name
    let currentBranch = "main";
    try {
      currentBranch = execSync("git rev-parse --abbrev-ref HEAD", {
        encoding: "utf-8",
      }).trim();
    } catch {
      // Default to main if we can't determine current branch
      currentBranch = "main";
    }

    // Check if the remote tracking branch exists
    let remoteBranch = `origin/${currentBranch}`;
    try {
      execSync(`git rev-parse --verify ${remoteBranch}`, { encoding: "utf-8", stdio: "ignore" });
    } catch {
      // Remote branch doesn't exist, try origin/main as fallback
      try {
        execSync("git rev-parse --verify origin/main", { encoding: "utf-8", stdio: "ignore" });
        remoteBranch = "origin/main";
      } catch {
        // Neither exists - no remote branch to compare against
        logger.debug("No remote tracking branch found, skipping unpushed commits check");
        return { needsCommit: false };
      }
    }

    // Now safely check if local is ahead of remote
    const ahead = execSync(`git rev-list --count ${remoteBranch}..HEAD`, {
      encoding: "utf-8",
    }).trim();

    if (parseInt(ahead) > 0) {
      logger.debug("Git repository has unpushed commits", { ahead, remoteBranch });
      return {
        needsCommit: true,
        reason: "unpushed",
      };
    }

    logger.debug("Git repository is clean and up to date");
    return { needsCommit: false };
  } catch (error) {
    logger.error("Error checking publish status", {}, error instanceof Error ? error : undefined);
    return {
      needsCommit: true,
      reason: "error",
    };
  }
}
