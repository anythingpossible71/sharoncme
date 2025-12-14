import ora from "ora";
import { execSync } from "child_process";
import { getProjectRoot } from "../utils/paths.js";
import { isGitRepository } from "../utils/checks.js";

/**
 * Step 6b: Git Remote URL Configuration
 * Converts HTTPS remote URLs to SSH format for easier authentication
 */
class GitRemoteStep {
  constructor(logger, options) {
    this.logger = logger;
    this.options = options;
  }

  /**
   * Get the current origin remote URL
   */
  getOriginUrl() {
    try {
      const url = execSync("git remote get-url origin", {
        cwd: getProjectRoot(),
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
      return url;
    } catch {
      return null;
    }
  }

  /**
   * Check if URL is HTTPS format
   */
  isHttpsUrl(url) {
    return url && url.startsWith("https://");
  }

  /**
   * Convert HTTPS URL to SSH format
   * Supports GitHub, GitLab, Bitbucket, and generic git hosts
   * Strips any username:password credentials from HTTPS URLs
   */
  convertToSsh(httpsUrl) {
    // Pattern: https://[user:pass@]host/owner/repo[.git]
    // The (?:[^@]+@)? part optionally matches and discards credentials
    const match = httpsUrl.match(/^https:\/\/(?:[^@]+@)?([^/]+)\/(.+?)(?:\.git)?$/);
    if (!match) {
      return null;
    }

    const [, host, path] = match;
    // Convert to SSH format: git@host:path.git (always uses "git" as username)
    const sshUrl = `git@${host}:${path}.git`;
    return sshUrl;
  }

  /**
   * Set the origin remote URL
   */
  setOriginUrl(url) {
    try {
      execSync(`git remote set-url origin "${url}"`, {
        cwd: getProjectRoot(),
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      return true;
    } catch {
      return false;
    }
  }

  async shouldRun() {
    // Check if this is a git repository
    const isGitRepo = await isGitRepository(getProjectRoot());
    if (!isGitRepo) {
      this.logger.notice("Not a git repository (skipping remote URL check)");
      return false;
    }

    // Check if origin remote exists
    const originUrl = this.getOriginUrl();
    if (!originUrl) {
      this.logger.notice("No origin remote configured (skipping)");
      return false;
    }

    // Check if it's an HTTPS URL
    if (!this.isHttpsUrl(originUrl)) {
      this.logger.result("✓ Git remote already using SSH");
      return false;
    }

    // HTTPS URL found, should convert
    return true;
  }

  async execute() {
    const currentUrl = this.getOriginUrl();
    const sshUrl = this.convertToSsh(currentUrl);

    if (!sshUrl) {
      this.logger.warn(`Could not parse HTTPS URL: ${currentUrl}`);
      return { success: true, warning: true };
    }

    this.logger.action("Converting git remote from HTTPS to SSH");
    this.logger.result(`  Current: ${currentUrl}`);
    this.logger.result(`  New:     ${sshUrl}`);

    const spinner = ora({
      text: "Updating remote URL...",
      color: "cyan",
    }).start();

    const success = this.setOriginUrl(sshUrl);

    if (success) {
      spinner.succeed("Git remote URL converted to SSH");
      return { success: true };
    } else {
      spinner.fail("Failed to update remote URL");
      this.logger.warn("You can manually update with:");
      this.logger.warn(`  git remote set-url origin ${sshUrl}`);
      return { success: true, warning: true };
    }
  }

  async verify() {
    const url = this.getOriginUrl();
    // Verify it's now SSH format (starts with git@)
    return url && url.startsWith("git@");
  }
}

export default GitRemoteStep;
