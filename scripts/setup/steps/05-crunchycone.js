import ora from "ora";
import { paths } from "../utils/paths.js";
import { fileExists } from "../utils/checks.js";
import { runNpx } from "../utils/cli.js";

/**
 * Step 5: CrunchyCone Platform Integration (Optional)
 * Handles authentication and project linking
 */
class CrunchyConeStep {
  constructor(logger, options) {
    this.logger = logger;
    this.options = options;
  }

  async shouldRun() {
    // Skip if --skip-crunchycone flag is set
    if (this.options.skipCrunchycone) {
      this.logger.notice("Skipping CrunchyCone setup (--skip-crunchycone flag)");
      return false;
    }

    const configExists = await fileExists(paths.crunchyconeConfig);

    if (!configExists) {
      this.logger.notice("crunchycone.toml not found (skipping CrunchyCone setup)");
      this.logger.result("  ℹ️  CrunchyCone integration is optional");
      this.logger.result('  ℹ️  Run "npx crunchycone-cli project init" to enable');
      return false;
    }

    this.logger.result("✓ crunchycone.toml found");
    return true;
  }

  async checkAuthentication() {
    this.logger.action("Checking CrunchyCone authentication...");

    const result = await runNpx(["--yes", "crunchycone-cli", "auth", "check"], {
      verbose: this.options.verbose,
    });

    if (result.success && result.stdout && result.stdout.includes("Authenticated")) {
      return true;
    }

    return false;
  }

  async promptAuthentication() {
    this.logger.result("  ⚠️  Not authenticated with CrunchyCone");
    this.logger.action("Starting CrunchyCone authentication...");

    const spinner = ora({
      text: "Opening browser for authentication...",
      color: "cyan",
    }).start();

    // Run auth login - this will open a browser for the user to authenticate
    const result = await runNpx(["--yes", "crunchycone-cli", "auth", "login"], {
      verbose: this.options.verbose,
      interactive: true, // Allow interactive prompts
    });

    if (result.success) {
      spinner.succeed("Authentication successful");
      return true;
    } else {
      spinner.fail("Authentication failed or was cancelled");
      this.logger.warn("You can authenticate later with: npx crunchycone-cli auth login");
      return false;
    }
  }

  async execute() {
    // Check authentication
    let isAuthenticated = await this.checkAuthentication();

    if (!isAuthenticated) {
      // Try to authenticate the user
      isAuthenticated = await this.promptAuthentication();

      if (!isAuthenticated) {
        this.logger.notice("Skipping CrunchyCone setup - authentication required");
        return { success: true, skipped: true };
      }
    } else {
      this.logger.result("  ✅ Already authenticated");
    }

    // Link project automatically
    this.logger.action("Running: npx crunchycone-cli project link --setup");

    const spinner = ora({
      text: "Linking project to CrunchyCone platform...",
      color: "cyan",
    }).start();

    const result = await runNpx(["--yes", "crunchycone-cli", "project", "link", "--setup"], {
      verbose: this.options.verbose,
    });

    if (result.success) {
      spinner.succeed("Project linked successfully");

      this.logger.result("  • Project connected to CrunchyCone cloud");
      this.logger.result("  • Deployment pipeline configured");
      this.logger.result("  • Ready for cloud deployment");

      return { success: true };
    } else {
      spinner.fail("Failed to link project");
      this.logger.blank();
      this.logger.warn("You can link the project later with:");
      this.logger.warn("  npx crunchycone-cli project link --setup");
      // Don't fail - this is optional
      return { success: true, warning: true };
    }
  }

  async verify() {
    // Verification is optional for CrunchyCone
    // Just check that config file still exists
    return await fileExists(paths.crunchyconeConfig);
  }
}

export default CrunchyConeStep;
