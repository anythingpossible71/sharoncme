import { execa } from "execa";

/**
 * CLI command execution utilities with cross-platform support
 */

/**
 * Execute a command with proper cross-platform handling
 * @param {string} command - Command to execute
 * @param {string[]} args - Command arguments
 * @param {object} options - Execution options
 * @returns {Promise<object>} - Execution result
 */
export async function executeCommand(command, args = [], options = {}) {
  // Extract custom options (not valid execa options)
  const { verbose, interactive, ...execaOptions } = options;

  const defaultOptions = {
    cwd: process.cwd(),
    shell: true, // Required for Windows
    // Use inherit for interactive or verbose mode to allow terminal interaction
    stdio: verbose || interactive ? "inherit" : "pipe",
  };

  try {
    const result = await execa(command, args, {
      ...defaultOptions,
      ...execaOptions,
    });
    return {
      success: true,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
      exitCode: error.exitCode,
    };
  }
}

/**
 * Run npm command
 */
export async function runNpm(args, options = {}) {
  return executeCommand("npm", args, options);
}

/**
 * Run npx command
 */
export async function runNpx(args, options = {}) {
  return executeCommand("npx", args, options);
}

/**
 * Run git command
 */
export async function runGit(args, options = {}) {
  return executeCommand("git", args, options);
}

/**
 * Check if a command exists in PATH
 */
export async function commandExists(command) {
  try {
    const checkCommand = process.platform === "win32" ? "where" : "which";
    const result = await execa(checkCommand, [command], { shell: true });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Get Node.js version
 */
export async function getNodeVersion() {
  try {
    const result = await execa("node", ["--version"], { shell: true });
    return result.stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Get npm version
 */
export async function getNpmVersion() {
  try {
    const result = await execa("npm", ["--version"], { shell: true });
    return result.stdout.trim();
  } catch {
    return null;
  }
}
