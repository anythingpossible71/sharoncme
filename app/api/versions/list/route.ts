import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "@/lib/logger";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Fetch from the main repository to get the complete commit history
    const mainRepoPath = process.cwd().replace(/\/devx-version-\d+$/, "/Devx-starter");
    const { stdout: totalCommits } = await execAsync(
      `cd "${mainRepoPath}" && git rev-list --count HEAD`
    );
    const totalCount = parseInt(totalCommits.trim());

    // Get last 10 commits with hash and message from main repository
    const { stdout: commits } = await execAsync(
      `cd "${mainRepoPath}" && git log --oneline -10 --pretty=format:'%h|%s'`
    );

    const commitLines = commits.trim().split("\n");
    const versions = commitLines.map((line, index) => {
      const [hash, message] = line.split("|");
      const versionNumber = totalCount - index; // Reverse numbering

      return {
        hash: hash.trim(),
        message: message.trim(),
        versionNumber,
        port: null, // No port since version switching is disabled
        url: null, // No URL since version switching is disabled
      };
    });

    return NextResponse.json({
      versions,
      totalCount,
      currentVersion: totalCount,
    });
  } catch (error) {
    logger.error("Error fetching versions", {}, error instanceof Error ? error : undefined);
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
  }
}
