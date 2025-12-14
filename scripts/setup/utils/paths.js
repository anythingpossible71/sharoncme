import path from "path";

/**
 * Path utilities for cross-platform file path handling
 */

// Get project root directory
function getProjectRoot() {
  return process.cwd();
}

// Common project paths
export const paths = {
  root: getProjectRoot(),
  nodeModules: path.join(getProjectRoot(), "node_modules"),
  env: path.join(getProjectRoot(), ".env"),
  envExample: path.join(getProjectRoot(), ".env.example"),
  database: path.join(getProjectRoot(), "db", "prod.db"),
  prismaClient: path.join(getProjectRoot(), "node_modules", ".prisma", "client", "index.js"),
  crunchyconeConfig: path.join(getProjectRoot(), "crunchycone.toml"),
  gitHooksDir: path.join(getProjectRoot(), ".git", "hooks"),
  preCommitHook: path.join(getProjectRoot(), ".git", "hooks", "pre-commit"),
  packageJson: path.join(getProjectRoot(), "package.json"),
  packageLock: path.join(getProjectRoot(), "package-lock.json"),
};

export { getProjectRoot };
