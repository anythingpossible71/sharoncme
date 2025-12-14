import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check if there are pushed versions (check git log for commits on origin)
    const hasPushedVersions = checkPushedVersions();

    // Check if there's a diff between current codebase and last commit
    const hasUncommittedChanges = checkUncommittedChanges();

    return NextResponse.json({
      hasPushedVersions,
      hasUncommittedChanges,
      canPublish: hasPushedVersions && !hasUncommittedChanges,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to check publish status",
        hasPushedVersions: false,
        hasUncommittedChanges: false,
        canPublish: false,
      },
      { status: 500 }
    );
  }
}

function checkPushedVersions(): boolean {
  try {
    // Check if origin/main or origin/master exists and has commits
    const branches = execSync("git branch -r", { encoding: "utf-8" });
    const hasOrigin = branches.includes("origin/main") || branches.includes("origin/master");

    if (!hasOrigin) {
      return false;
    }

    // Check if there are any commits on origin
    try {
      const remoteCommits = execSync(
        "git rev-list --count origin/main 2>/dev/null || git rev-list --count origin/master 2>/dev/null",
        {
          encoding: "utf-8",
        }
      );
      return parseInt(remoteCommits.trim()) > 0;
    } catch {
      return false;
    }
  } catch {
    // If git is not available or not a git repo, assume no pushed versions for now
    return false;
  }
}

function checkUncommittedChanges(): boolean {
  try {
    // Check if there are uncommitted changes
    const status = execSync("git status --porcelain", { encoding: "utf-8" });
    return status.trim().length > 0;
  } catch {
    // If git is not available or not a git repo, assume no uncommitted changes
    return false;
  }
}
