#!/usr/bin/env node

/**
 * CrunchyCone Project Auto-Setup
 *
 * Automated setup script that performs all initialization steps
 * required for a new CrunchyCone project.
 *
 * This script is designed to run non-interactively and is intended
 * for use by Cursor AI and other automated tools.
 *
 * Usage:
 *   node scripts/auto-setup.js [options]
 *   npm run setup [-- options]
 *
 * Options:
 *   --auto, --yes          Run without prompts (default behavior)
 *   --force                Remove existing setup and start fresh
 *   --skip-deps            Skip npm install
 *   --skip-env             Skip .env setup
 *   --skip-db              Skip database setup
 *   --skip-crunchycone     Skip CrunchyCone integration
 *   --skip-hooks           Skip git hooks installation
 *   --start-dev            Auto-start development server after setup
 *   --verbose, -v          Show detailed output
 *   --quiet, -q            Minimal output (errors only)
 *   --help, -h             Show help message
 */

import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { execSync } from "child_process";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we're running from the project root
process.chdir(path.resolve(__dirname, ".."));

/**
 * Bootstrap dependencies if needed
 * This runs BEFORE importing any npm packages to avoid import errors
 */
async function bootstrapDependencies(args) {
  const nodeModulesPath = path.resolve(process.cwd(), "node_modules");
  const skipDeps = args.includes("--skip-deps");

  // If node_modules exists and we're not forcing, skip bootstrap
  if (existsSync(nodeModulesPath) && !args.includes("--force")) {
    return true;
  }

  // If --skip-deps is set, warn but continue
  if (skipDeps) {
    console.log("\n⚠️  Warning: node_modules not found but --skip-deps was specified");
    console.log("   Setup may fail if dependencies are not installed.\n");
    return true;
  }

  // Install dependencies using only Node.js built-ins
  console.log("\n📦 Installing dependencies (required for setup)...\n");

  try {
    execSync("npm install", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    console.log("\n✅ Dependencies installed successfully\n");
    return true;
  } catch (error) {
    console.error("\n❌ Failed to install dependencies:");
    console.error(error.message);
    console.error("\nPlease run 'npm install' manually and try again.\n");
    return false;
  }
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
CrunchyCone Project Auto-Setup

Automated setup script for CrunchyCone starter projects.

Usage:
  node scripts/auto-setup.js [options]
  npm run setup [-- options]

Options:
  --auto, --yes          Run without prompts (default)
  --force                Remove existing setup and start fresh
  --skip-deps            Skip dependency installation
  --skip-env             Skip environment configuration
  --skip-db              Skip database setup
  --skip-crunchycone     Skip CrunchyCone integration
  --skip-hooks           Skip git hooks installation
  --no-dev               Skip auto-starting development server
  --verbose, -v          Show detailed output
  --quiet, -q            Minimal output (errors only)
  --help, -h             Show this help message

Examples:
  npm run setup
  npm run setup -- --force
  npm run setup -- --skip-crunchycone
  npm run setup -- --verbose

Exit codes:
  0  - Setup completed successfully
  1  - Setup failed (critical error)
  2  - Setup completed with warnings
`);
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  // Show help if requested
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  try {
    // Bootstrap dependencies first (if needed)
    const bootstrapSuccess = await bootstrapDependencies(args);
    if (!bootstrapSuccess) {
      process.exit(1);
    }

    // Dynamically import setupProject AFTER dependencies are installed
    // This prevents import errors when chalk/ora/etc don't exist yet
    const { setupProject } = await import("./setup/index.js");

    // Run setup
    const result = await setupProject(args);

    // Exit with appropriate code
    if (result.success) {
      const hasWarnings = result.results.some((r) => r.warning);
      process.exit(hasWarnings ? 2 : 0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Unexpected error during setup:");
    console.error(error.message);
    if (args.includes("--verbose") || args.includes("-v")) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on("unhandledRejection", (error) => {
  console.error("\n❌ Unhandled error:");
  console.error(error);
  process.exit(1);
});

// Handle SIGINT (Ctrl+C)
process.on("SIGINT", () => {
  console.log("\n\n⚠️  Setup interrupted by user");
  process.exit(130);
});

// Run main
main();
