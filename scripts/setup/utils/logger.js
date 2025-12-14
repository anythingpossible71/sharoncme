import chalk from "chalk";

/**
 * Logging utilities with cross-platform colored output
 */

export class Logger {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.quiet = options.quiet || false;
  }

  // Main messages
  info(message) {
    if (!this.quiet) {
      console.log(message);
    }
  }

  // Success messages
  success(message) {
    if (!this.quiet) {
      console.log(chalk.green("✅ " + message));
    }
  }

  // Error messages
  error(message) {
    console.error(chalk.red("❌ " + message));
  }

  // Warning messages
  warn(message) {
    if (!this.quiet) {
      console.warn(chalk.yellow("⚠️  " + message));
    }
  }

  // Info/notice messages
  notice(message) {
    if (!this.quiet) {
      console.log(chalk.cyan("ℹ️  " + message));
    }
  }

  // Verbose/debug messages
  debug(message) {
    if (this.verbose) {
      console.log(chalk.gray("🔍 " + message));
    }
  }

  // Step header
  stepHeader(stepNumber, totalSteps, title) {
    if (!this.quiet) {
      console.log(chalk.bold(`\n[${stepNumber}/${totalSteps}] ${title}...`));
    }
  }

  // Action message (indented)
  action(message) {
    if (!this.quiet) {
      console.log("  → " + message);
    }
  }

  // Result message (indented)
  result(message) {
    if (!this.quiet) {
      console.log("  " + message);
    }
  }

  // Blank line
  blank() {
    if (!this.quiet) {
      console.log();
    }
  }

  // Header box
  header(title, subtitle = null) {
    if (!this.quiet) {
      console.log(chalk.bold.blue("\n╔════════════════════════════════════════╗"));
      console.log(chalk.bold.blue(`║  ${title.padEnd(38)}║`));
      if (subtitle) {
        console.log(chalk.bold.blue(`║  ${subtitle.padEnd(38)}║`));
      }
      console.log(chalk.bold.blue("╚════════════════════════════════════════╝\n"));
    }
  }

  // Summary box
  summary(title) {
    if (!this.quiet) {
      console.log(chalk.bold.green("\n╔════════════════════════════════════════╗"));
      console.log(chalk.bold.green(`║  ${title.padEnd(38)}║`));
      console.log(chalk.bold.green("╚════════════════════════════════════════╝\n"));
    }
  }

  // Divider
  divider() {
    if (!this.quiet) {
      console.log(chalk.gray("━".repeat(50)));
    }
  }
}

export default Logger;
