import ora from "ora";
import { paths } from "../utils/paths.js";
import { directoryHasContent } from "../utils/checks.js";
import { runNpm } from "../utils/cli.js";

/**
 * Step 1: Install Dependencies
 * Ensures node_modules exists and is populated
 */
class DependenciesStep {
  constructor(logger, options) {
    this.logger = logger;
    this.options = options;
  }

  async shouldRun() {
    // Skip if --skip-deps flag is set
    if (this.options.skipDeps) {
      this.logger.notice("Skipping dependency installation (--skip-deps flag)");
      return false;
    }

    // Run if node_modules doesn't exist or is empty
    const hasModules = await directoryHasContent(paths.nodeModules);

    if (!hasModules) {
      this.logger.result("✓ node_modules not found or empty");
      return true;
    }

    // Skip if --force is not set
    if (!this.options.force) {
      this.logger.result("✓ node_modules exists (skipping)");
      return false;
    }

    return true;
  }

  async execute() {
    this.logger.action("Running: npm install");

    const spinner = ora({
      text: "Installing dependencies...",
      color: "cyan",
    }).start();

    const result = await runNpm(["install"], {
      verbose: this.options.verbose,
    });

    if (result.success) {
      spinner.succeed("Dependencies installed successfully");
      return { success: true };
    } else {
      spinner.fail("Failed to install dependencies");
      this.logger.blank();
      this.logger.error("Error: " + result.error);
      if (result.stderr) {
        this.logger.debug("Details: " + result.stderr);
      }
      return { success: false, error: result.error };
    }
  }

  async verify() {
    const hasContent = await directoryHasContent(paths.nodeModules);
    if (!hasContent) {
      this.logger.error("Verification failed: node_modules is empty");
      return false;
    }
    return true;
  }
}

export default DependenciesStep;
