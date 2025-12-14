import fs from "fs-extra";
import path from "path";

/**
 * File and setup check utilities
 */

/**
 * Check if a file or directory exists
 */
export async function fileExists(filePath) {
  try {
    return await fs.pathExists(filePath);
  } catch {
    return false;
  }
}

/**
 * Check if a directory exists and is not empty
 */
export async function directoryHasContent(dirPath) {
  try {
    const exists = await fs.pathExists(dirPath);
    if (!exists) return false;

    const contents = await fs.readdir(dirPath);
    return contents.length > 0;
  } catch {
    return false;
  }
}

/**
 * Check if .env file exists and has required variables
 */
export async function checkEnvFile(envPath, requiredVars = []) {
  try {
    const exists = await fs.pathExists(envPath);
    if (!exists) {
      return { exists: false, missing: requiredVars };
    }

    const envContent = await fs.readFile(envPath, "utf8");
    const missing = [];

    for (const varName of requiredVars) {
      const regex = new RegExp(`^${varName}=`, "m");
      if (!regex.test(envContent)) {
        missing.push(varName);
      }
    }

    return { exists: true, missing };
  } catch {
    return { exists: false, missing: requiredVars };
  }
}

/**
 * Check if package.json and package-lock.json are in sync
 */
export async function checkPackageSync(packageJsonPath, packageLockPath) {
  try {
    const packageExists = await fs.pathExists(packageJsonPath);
    const lockExists = await fs.pathExists(packageLockPath);

    if (!packageExists || !lockExists) {
      return { inSync: false, reason: "missing_files" };
    }

    const packageJson = await fs.readJson(packageJsonPath);
    const packageLock = await fs.readJson(packageLockPath);

    // Check if package names match
    if (packageJson.name !== packageLock.name) {
      return { inSync: false, reason: "name_mismatch" };
    }

    // Check if lockfileVersion exists
    if (!packageLock.lockfileVersion) {
      return { inSync: false, reason: "invalid_lock" };
    }

    return { inSync: true };
  } catch {
    return { inSync: false, reason: "error_reading" };
  }
}

/**
 * Check if running in a git repository
 */
export async function isGitRepository(rootPath) {
  const gitPath = path.join(rootPath, ".git");
  return fileExists(gitPath);
}

/**
 * Check write permissions for a directory
 */
export async function hasWritePermission(dirPath) {
  try {
    const testFile = path.join(dirPath, ".write-test-" + Date.now());
    await fs.writeFile(testFile, "");
    await fs.remove(testFile);
    return true;
  } catch {
    return false;
  }
}
