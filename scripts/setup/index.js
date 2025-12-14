import chalk from "chalk";
import Logger from "./utils/logger.js";
import { getNodeVersion, getNpmVersion, runNpm } from "./utils/cli.js";

// Import all steps
import DependenciesStep from "./steps/01-dependencies.js";
import EnvironmentStep from "./steps/02-environment.js";
import PrismaClientStep from "./steps/03-prisma-client.js";
import DatabaseStep from "./steps/04-database.js";
import CrunchyConeStep from "./steps/05-crunchycone.js";
import GitHooksStep from "./steps/06-git-hooks.js";
import GitRemoteStep from "./steps/06b-git-remote.js";
import VerificationStep from "./steps/07-verification.js";

/**
 * Main setup orchestrator
 * Runs all setup steps in sequence and reports results
 */
class SetupOrchestrator {
  constructor(options = {}) {
    this.options = options;
    this.logger = new Logger(options);
    this.steps = [];
    this.results = [];
  }

  /**
   * Initialize all setup steps
   */
  initializeSteps() {
    this.steps = [
      { name: "Dependencies", Step: DependenciesStep, critical: true },
      { name: "Environment Configuration", Step: EnvironmentStep, critical: true },
      { name: "Prisma Client", Step: PrismaClientStep, critical: true },
      { name: "Database Setup", Step: DatabaseStep, critical: true },
      { name: "CrunchyCone Integration", Step: CrunchyConeStep, critical: false },
      { name: "Git Hooks", Step: GitHooksStep, critical: false },
      { name: "Git Remote URL", Step: GitRemoteStep, critical: false },
      { name: "Verification", Step: VerificationStep, critical: true },
    ];
  }

  /**
   * Run pre-flight checks
   */
  async preFlightChecks() {
    this.logger.info(chalk.bold("Running pre-flight checks..."));

    const nodeVersion = await getNodeVersion();
    const npmVersion = await getNpmVersion();

    if (!nodeVersion || !npmVersion) {
      this.logger.error("Node.js or npm not found");
      return false;
    }

    this.logger.result(`✅ Node.js: ${nodeVersion}`);
    this.logger.result(`✅ npm: ${npmVersion}`);

    return true;
  }

  /**
   * Execute a single step
   */
  async executeStep(stepConfig, stepNumber, totalSteps) {
    const { name, Step, critical } = stepConfig;

    this.logger.stepHeader(stepNumber, totalSteps, name);

    const step = new Step(this.logger, this.options);

    try {
      // Check if step should run
      const shouldRun = await step.shouldRun();

      if (!shouldRun) {
        return {
          name,
          skipped: true,
          critical,
          success: true,
        };
      }

      // Execute the step
      this.logger.blank();
      const result = await step.execute();

      // Verify the step (if not skipped)
      if (result.success && !result.skipped && step.verify) {
        const verified = await step.verify();
        if (!verified) {
          this.logger.warn("Step completed but verification failed");
          return {
            name,
            success: false,
            critical,
            error: "Verification failed",
            warning: !critical,
          };
        }
      }

      return {
        name,
        success: result.success,
        skipped: result.skipped,
        warning: result.warning,
        critical,
      };
    } catch (error) {
      this.logger.error(`Error in ${name}: ${error.message}`);
      this.logger.debug(error.stack);

      return {
        name,
        success: false,
        critical,
        error: error.message,
      };
    }
  }

  /**
   * Run all setup steps
   */
  async runSetup() {
    const totalSteps = this.steps.length;

    for (let i = 0; i < this.steps.length; i++) {
      const stepConfig = this.steps[i];
      const stepNumber = i + 1;

      const result = await this.executeStep(stepConfig, stepNumber, totalSteps);
      this.results.push(result);

      // If a critical step fails, stop execution
      if (!result.success && result.critical) {
        this.logger.blank();
        this.logger.error(`Critical step "${result.name}" failed. Stopping setup.`);
        this.logger.error(`Error: ${result.error}`);
        break;
      }
    }
  }

  /**
   * Display final summary
   */
  displaySummary() {
    this.logger.blank();
    this.logger.divider();

    const criticalFailures = this.results.filter((r) => !r.success && r.critical);
    const warnings = this.results.filter((r) => r.warning || (!r.success && !r.critical));
    const successes = this.results.filter((r) => r.success && !r.skipped && !r.warning);
    const skipped = this.results.filter((r) => r.skipped);

    if (criticalFailures.length > 0) {
      this.logger.blank();
      this.logger.error(chalk.bold("❌ Setup Failed"));
      this.logger.blank();
      this.logger.info(chalk.bold("Critical failures:"));
      criticalFailures.forEach((f) => {
        this.logger.error(`  • ${f.name}: ${f.error || "Unknown error"}`);
      });
    } else {
      this.logger.blank();
      this.logger.success(chalk.bold("✅ Setup Completed Successfully"));
    }

    this.logger.blank();
    this.logger.info(chalk.bold("Summary:"));
    this.logger.info(`  ✅ Successful: ${successes.length}`);
    if (warnings.length > 0) {
      this.logger.info(`  ⚠️  Warnings: ${warnings.length}`);
    }
    if (skipped.length > 0) {
      this.logger.info(`  ⊘  Skipped: ${skipped.length}`);
    }
    if (criticalFailures.length > 0) {
      this.logger.info(`  ❌ Failed: ${criticalFailures.length}`);
    }

    // Show warnings if any
    if (warnings.length > 0) {
      this.logger.blank();
      this.logger.info(chalk.bold("Warnings:"));
      warnings.forEach((w) => {
        this.logger.warn(`  • ${w.name}${w.error ? ": " + w.error : ""}`);
      });
    }

    // Show completion message
    if (criticalFailures.length === 0) {
      this.logger.blank();
      this.logger.info(chalk.bold("Setup complete!"));
    }

    this.logger.divider();
    this.logger.blank();
  }

  /**
   * Start the development server
   */
  async startDevServer() {
    // Skip if disabled or setup failed
    const criticalFailures = this.results.filter((r) => !r.success && r.critical);
    if (criticalFailures.length > 0 || !this.options.startDev) {
      return;
    }

    try {
      this.logger.blank();

      // Run dev server (Cursor will see the URL in output and open browser per rules)
      await runNpm(["run", "dev"], {
        verbose: true, // Always show dev server output
      });
    } catch {
      this.logger.blank();
      this.logger.warn("Failed to auto-start development server");
      this.logger.info("You can start it manually with:");
      this.logger.info(chalk.cyan("  → npm run dev"));
      this.logger.blank();
    }
  }

  /**
   * Main setup execution
   */
  async execute() {
    // Show header
    this.logger.header("CrunchyCone Project Setup", "Automated Initialization");

    // Pre-flight checks
    const preFlightOk = await this.preFlightChecks();
    if (!preFlightOk) {
      return { success: false, error: "Pre-flight checks failed" };
    }

    this.logger.blank();

    // Initialize steps
    this.initializeSteps();

    // Run setup
    await this.runSetup();

    // Display summary
    this.displaySummary();

    // Determine overall success
    const criticalFailures = this.results.filter((r) => !r.success && r.critical);
    const success = criticalFailures.length === 0;

    // Auto-start dev server if successful (unless --no-dev flag)
    if (success) {
      await this.startDevServer();
    }

    return {
      success,
      results: this.results,
      criticalFailures,
    };
  }
}

/**
 * Export setup function
 */
export async function setupProject(args = []) {
  // Parse command line arguments
  const options = {
    auto: args.includes("--auto") || args.includes("--yes"),
    force: args.includes("--force"),
    verbose: args.includes("--verbose") || args.includes("-v"),
    quiet: args.includes("--quiet") || args.includes("-q"),
    skipDeps: args.includes("--skip-deps"),
    skipEnv: args.includes("--skip-env"),
    skipDb: args.includes("--skip-db"),
    skipCrunchycone: args.includes("--skip-crunchycone"),
    skipHooks: args.includes("--skip-hooks"),
    startDev: false, // Don't auto-start - let Cursor handle per rules
  };

  const orchestrator = new SetupOrchestrator(options);
  const result = await orchestrator.execute();

  return result;
}

export { SetupOrchestrator };
