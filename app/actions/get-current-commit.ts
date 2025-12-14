"use server";

import { execSync } from "child_process";
import { logger } from "@/lib/logger";

export async function getCurrentCommitSha(): Promise<string | null> {
  try {
    const sha = execSync("git rev-parse HEAD", {
      encoding: "utf-8",
    }).trim();

    logger.debug("Current commit SHA", { sha: sha.substring(0, 7) });
    return sha;
  } catch (error) {
    logger.error(
      "Error getting current commit SHA",
      {},
      error instanceof Error ? error : undefined
    );
    return null;
  }
}
