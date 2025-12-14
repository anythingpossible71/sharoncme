import ora from "ora";
import { paths } from "../utils/paths.js";
import { fileExists } from "../utils/checks.js";
import { runNpx } from "../utils/cli.js";

/**
 * Step 3: Prisma Client Generation
 * Generates TypeScript types for database
 */
class PrismaClientStep {
  constructor(logger, options) {
    this.logger = logger;
    this.options = options;
  }

  async shouldRun() {
    const exists = await fileExists(paths.prismaClient);

    if (!exists) {
      this.logger.result("✓ Prisma client not found");
      return true;
    }

    if (this.options.force) {
      this.logger.result("✓ Regenerating Prisma client (force mode)");
      return true;
    }

    this.logger.result("✓ Prisma client exists (skipping)");
    return false;
  }

  async execute() {
    this.logger.action("Running: npx prisma generate");

    const spinner = ora({
      text: "Generating Prisma client and TypeScript types...",
      color: "cyan",
    }).start();

    const result = await runNpx(["prisma", "generate"], {
      verbose: this.options.verbose,
    });

    if (result.success) {
      spinner.succeed("Prisma client generated successfully");

      this.logger.result("  • TypeScript types: Generated");
      this.logger.result("  • Client location: node_modules/.prisma/client");
      this.logger.result("  • ULID extension: Configured");

      return { success: true };
    } else {
      spinner.fail("Failed to generate Prisma client");
      this.logger.blank();
      this.logger.error("Error: " + result.error);
      if (result.stderr) {
        this.logger.debug("Details: " + result.stderr);
      }
      return { success: false, error: result.error };
    }
  }

  async verify() {
    const exists = await fileExists(paths.prismaClient);

    if (!exists) {
      this.logger.error("Verification failed: Prisma client not generated");
      return false;
    }

    return true;
  }
}

export default PrismaClientStep;
