import chalk from "chalk";
import { paths } from "../utils/paths.js";
import { fileExists, directoryHasContent, checkEnvFile } from "../utils/checks.js";

/**
 * Step 7: Setup Verification
 * Verifies that all setup steps completed successfully
 */
class VerificationStep {
  constructor(logger, options) {
    this.logger = logger;
    this.options = options;
  }

  async shouldRun() {
    // Always run verification unless explicitly skipped
    return true;
  }

  async execute() {
    this.logger.action("Verifying setup...");

    const checks = [];

    // Check 1: node_modules
    const hasModules = await directoryHasContent(paths.nodeModules);
    checks.push({
      name: "node_modules",
      passed: hasModules,
      message: hasModules ? "exists" : "missing or empty",
    });

    // Check 2: .env file with required variables
    const requiredVars = [
      "AUTH_SECRET",
      "NEXTAUTH_SECRET",
      "AUTH_URL",
      "NEXT_PUBLIC_APP_URL",
      "DATABASE_URL",
      "EMAIL_FROM",
    ];
    const envCheck = await checkEnvFile(paths.env, requiredVars);
    const envPassed = envCheck.exists && envCheck.missing.length === 0;
    checks.push({
      name: ".env",
      passed: envPassed,
      message: envPassed
        ? "exists with all required variables"
        : envCheck.exists
          ? `missing: ${envCheck.missing.join(", ")}`
          : "not found",
    });

    // Check 3: Database
    const dbExists = await fileExists(paths.database);
    checks.push({
      name: "Database",
      passed: dbExists,
      message: dbExists ? "exists and accessible" : "not found",
    });

    // Check 4: Prisma Client
    const clientExists = await fileExists(paths.prismaClient);
    checks.push({
      name: "Prisma Client",
      passed: clientExists,
      message: clientExists ? "generated" : "not generated",
    });

    // Check 5: Git Hooks (optional)
    const hooksExist = await fileExists(paths.preCommitHook);
    checks.push({
      name: "Git Hooks",
      passed: hooksExist,
      message: hooksExist ? "installed" : "not installed (optional)",
      optional: true,
    });

    // Display results
    this.logger.blank();
    for (const check of checks) {
      if (check.passed) {
        this.logger.result(chalk.green(`✅ ${check.name}: ${check.message}`));
      } else if (check.optional) {
        this.logger.result(chalk.yellow(`⚠️  ${check.name}: ${check.message}`));
      } else {
        this.logger.result(chalk.red(`❌ ${check.name}: ${check.message}`));
      }
    }

    // Determine overall success
    const criticalChecks = checks.filter((c) => !c.optional);
    const allPassed = criticalChecks.every((c) => c.passed);

    return {
      success: allPassed,
      checks,
      allPassed,
    };
  }

  async verify() {
    // Verification step doesn't need its own verification
    return true;
  }
}

export default VerificationStep;
