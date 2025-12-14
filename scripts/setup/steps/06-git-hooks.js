import ora from "ora";
import { paths, getProjectRoot } from "../utils/paths.js";
import { fileExists, isGitRepository } from "../utils/checks.js";
import { runNpm } from "../utils/cli.js";

/**
 * Step 6: Git Hooks Installation
 * Installs pre-commit hooks for quality checks
 */
class GitHooksStep {
  constructor(logger, options) {
    this.logger = logger;
    this.options = options;
  }

  async shouldRun() {
    // Skip if --skip-hooks flag is set
    if (this.options.skipHooks) {
      this.logger.notice("Skipping git hooks installation (--skip-hooks flag)");
      return false;
    }

    // Check if this is a git repository
    const isGitRepo = await isGitRepository(getProjectRoot());
    if (!isGitRepo) {
      this.logger.notice("Not a git repository (skipping hooks installation)");
      return false;
    }

    const hookExists = await fileExists(paths.preCommitHook);

    if (!hookExists) {
      this.logger.result("✓ Pre-commit hook not found");
      return true;
    }

    if (this.options.force) {
      this.logger.result("✓ Reinstalling git hooks (force mode)");
      return true;
    }

    this.logger.result("✓ Git hooks already installed (skipping)");
    return false;
  }

  async execute() {
    this.logger.action("Running: npm run hooks:install");

    const spinner = ora({
      text: "Installing git hooks...",
      color: "cyan",
    }).start();

    const result = await runNpm(["run", "hooks:install"], {
      verbose: this.options.verbose,
    });

    if (result.success) {
      spinner.succeed("Git hooks installed successfully");

      this.logger.result("  • Pre-commit hook: Installed");
      this.logger.result("  • Package sync check: Enabled");
      this.logger.result("  • Lint check: Enabled");
      this.logger.result("  • Build check: Enabled");

      return { success: true };
    } else {
      spinner.fail("Failed to install git hooks");
      this.logger.blank();
      this.logger.warn("Git hooks installation failed, but you can continue");
      this.logger.warn("You can install hooks later with: npm run hooks:install");

      // Don't fail the entire setup for hooks
      return { success: true, warning: true };
    }
  }

  async verify() {
    // Check if hook file exists (optional verification)
    const exists = await fileExists(paths.preCommitHook);
    return exists;
  }
}

export default GitHooksStep;
