import ora from "ora";
import { paths } from "../utils/paths.js";
import { fileExists } from "../utils/checks.js";
import { runNpm } from "../utils/cli.js";

/**
 * Step 4: Database Setup
 * Creates and initializes the database
 */
class DatabaseStep {
  constructor(logger, options) {
    this.logger = logger;
    this.options = options;
  }

  async shouldRun() {
    // Skip if --skip-db flag is set
    if (this.options.skipDb) {
      this.logger.notice("Skipping database setup (--skip-db flag)");
      return false;
    }

    const exists = await fileExists(paths.database);

    if (!exists) {
      this.logger.result("✓ Database not found");
      return true;
    }

    if (this.options.force) {
      this.logger.result("⚠️  Force mode: Resetting database");
      return true;
    }

    this.logger.result("✓ Database exists (skipping)");
    return false;
  }

  async execute() {
    this.logger.action("Running: npm run db:reset");

    const spinner = ora({
      text: "Creating database and running migrations...",
      color: "cyan",
    }).start();

    const result = await runNpm(["run", "db:reset"], {
      verbose: this.options.verbose,
    });

    if (result.success) {
      spinner.text = "Seeding initial data...";

      // Give a moment for seeding to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      spinner.succeed("Database created and seeded successfully");

      this.logger.result("  • Database file: db/prod.db");
      this.logger.result("  • Migrations: Applied");
      this.logger.result("  • Initial data: Seeded");
      this.logger.result("  • Admin role: Created");
      this.logger.result("  • User role: Created");

      return { success: true };
    } else {
      spinner.fail("Failed to create database");
      this.logger.blank();
      this.logger.error("Error: " + result.error);
      if (result.stderr) {
        this.logger.debug("Details: " + result.stderr);
      }
      return { success: false, error: result.error };
    }
  }

  async verify() {
    const exists = await fileExists(paths.database);

    if (!exists) {
      this.logger.error("Verification failed: Database file not created");
      return false;
    }

    return true;
  }
}

export default DatabaseStep;
