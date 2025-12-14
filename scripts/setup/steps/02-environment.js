import ora from "ora";
import fs from "fs-extra";
import { paths } from "../utils/paths.js";
import { fileExists, checkEnvFile } from "../utils/checks.js";
import { runNpm } from "../utils/cli.js";

/**
 * Step 2: Environment Configuration
 * Creates .env file with required variables
 */
class EnvironmentStep {
  constructor(logger, options) {
    this.logger = logger;
    this.options = options;
    this.requiredVars = [
      "AUTH_SECRET",
      "NEXTAUTH_SECRET",
      "AUTH_URL",
      "NEXT_PUBLIC_APP_URL",
      "DATABASE_URL",
      "EMAIL_FROM",
    ];
  }

  async shouldRun() {
    // Skip if --skip-env flag is set
    if (this.options.skipEnv) {
      this.logger.notice("Skipping environment setup (--skip-env flag)");
      return false;
    }

    const exists = await fileExists(paths.env);

    if (!exists) {
      this.logger.result("✓ .env not found");
      return true;
    }

    // Check if .env has all required variables
    const envCheck = await checkEnvFile(paths.env, this.requiredVars);

    if (envCheck.missing.length > 0) {
      this.logger.result(`⚠️  .env exists but missing: ${envCheck.missing.join(", ")}`);
      this.logger.action("Recreating .env file with missing variables");
      return true;
    }

    if (this.options.force) {
      this.logger.result("✓ Force mode: Recreating .env file");
      return true;
    }

    this.logger.result("✓ .env exists with all required variables (skipping)");
    return false;
  }

  async execute() {
    // If .env exists but has missing vars, we need to merge from .env.example
    const exists = await fileExists(paths.env);
    const envCheck = await checkEnvFile(paths.env, this.requiredVars);

    if (exists && envCheck.missing.length > 0) {
      this.logger.action("Adding missing environment variables from .env.example");

      const envExampleExists = await fileExists(paths.envExample);

      if (envExampleExists) {
        // Read both files
        const envContent = await fs.readFile(paths.env, "utf8");
        const envExampleContent = await fs.readFile(paths.envExample, "utf8");

        // Parse .env.example to extract missing variables
        let updatedEnv = envContent;

        for (const varName of envCheck.missing) {
          const regex = new RegExp(`^${varName}=.*$`, "m");
          const match = envExampleContent.match(regex);

          if (match) {
            // Add the missing variable to .env
            updatedEnv += `\n${match[0]}`;
            this.logger.debug(`Added ${varName} from .env.example`);
          }
        }

        // Write updated .env
        await fs.writeFile(paths.env, updatedEnv);
        this.logger.result(`  ✓ Added ${envCheck.missing.length} missing variables`);
      }
    }

    this.logger.action("Running: npm run setup-env");

    const spinner = ora({
      text: "Generating .env file with secure secrets...",
      color: "cyan",
    }).start();

    const result = await runNpm(["run", "setup-env"], {
      verbose: this.options.verbose,
    });

    if (result.success) {
      spinner.succeed("Environment configured successfully");

      // Show what was configured
      this.logger.result("  • AUTH_SECRET: Generated (64 chars)");
      this.logger.result("  • NEXTAUTH_SECRET: Set (matches AUTH_SECRET)");
      this.logger.result("  • DATABASE_URL: file:./db/prod.db");
      this.logger.result("  • Other variables: Configured from template");

      return { success: true };
    } else {
      spinner.fail("Failed to configure environment");
      this.logger.blank();
      this.logger.error("Error: " + result.error);
      if (result.stderr) {
        this.logger.debug("Details: " + result.stderr);
      }
      return { success: false, error: result.error };
    }
  }

  async verify() {
    const envCheck = await checkEnvFile(paths.env, this.requiredVars);

    if (!envCheck.exists) {
      this.logger.error("Verification failed: .env file not created");
      this.logger.blank();
      this.logger.info("To fix: Run npm run setup-env manually");
      return false;
    }

    if (envCheck.missing.length > 0) {
      this.logger.error(`Verification failed: Missing required variables`);
      this.logger.blank();
      this.logger.info("Missing variables:");
      envCheck.missing.forEach((varName) => {
        this.logger.info(`  - ${varName}`);
      });
      this.logger.blank();
      this.logger.info("To fix: Add these variables to your .env file");
      this.logger.info("You can copy them from .env.example");
      return false;
    }

    return true;
  }
}

export default EnvironmentStep;
