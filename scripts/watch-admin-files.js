#!/usr/bin/env node
/**
 * Continuous file watcher for critical admin component files
 * Monitors files during development and auto-restores if corrupted
 * This runs alongside the dev server to prevent corruption issues
 *
 * Protected files:
 * - AdminLayoutClient.tsx
 * - AdminSidebar.tsx
 * - AdminHeader.tsx
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Critical admin files that must be protected
const CRITICAL_FILES = [
  {
    path: "components/admin/AdminLayoutClient.tsx",
    exportName: "AdminLayoutClient",
    minSize: 100,
    minLines: 10,
  },
  {
    path: "components/admin/AdminSidebar.tsx",
    exportName: "AdminSidebar",
    minSize: 100,
    minLines: 10,
  },
  {
    path: "components/admin/AdminHeader.tsx",
    exportName: "AdminHeader",
    minSize: 100,
    minLines: 10,
  },
];

let checkCount = 0;
let restoreCount = 0;

function validateFile(fileConfig) {
  const filePath = path.join(process.cwd(), fileConfig.path);
  const fileName = path.basename(fileConfig.path);

  try {
    if (!fs.existsSync(filePath)) {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ ${fileName} is missing!`);
      restoreFile(filePath, fileName);
      return false;
    }

    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n").length;

    // Check file size
    if (stats.size < fileConfig.minSize) {
      console.error(
        `[${new Date().toLocaleTimeString()}] ❌ ${fileName} is corrupted (${stats.size} bytes)!`
      );
      restoreFile(filePath, fileName);
      return false;
    }

    // Check line count
    if (lines < fileConfig.minLines) {
      console.error(
        `[${new Date().toLocaleTimeString()}] ❌ ${fileName} is corrupted (${lines} lines)!`
      );
      restoreFile(filePath, fileName);
      return false;
    }

    // Check for export
    const exportPattern = new RegExp(`export\\s+(function|const)\\s+${fileConfig.exportName}`);
    if (!exportPattern.test(content)) {
      console.error(
        `[${new Date().toLocaleTimeString()}] ❌ ${fileName} is missing export "${fileConfig.exportName}"!`
      );
      restoreFile(filePath, fileName);
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      `[${new Date().toLocaleTimeString()}] ❌ Error validating ${fileName}:`,
      error.message
    );
    restoreFile(filePath, fileName);
    return false;
  }
}

function restoreFile(filePath, fileName) {
  restoreCount++;
  console.log(
    `[${new Date().toLocaleTimeString()}] 📦 Restoring ${fileName} from git... (restore #${restoreCount})`
  );
  try {
    execSync(`git restore "${filePath}"`, { stdio: "pipe" });
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 100) {
      console.log(`[${new Date().toLocaleTimeString()}] ✅ ${fileName} restored successfully`);
      return true;
    }
  } catch (error) {
    console.error(
      `[${new Date().toLocaleTimeString()}] ❌ Could not restore ${fileName} from git:`,
      error.message
    );
  }

  console.error(`[${new Date().toLocaleTimeString()}] ❌ CRITICAL: Cannot restore ${fileName}!`);
  return false;
}

function checkAllFiles() {
  checkCount++;
  let allValid = true;

  for (const fileConfig of CRITICAL_FILES) {
    if (!validateFile(fileConfig)) {
      allValid = false;
    }
  }

  // Log status every 60 checks (approximately every 2 minutes at 2-second intervals)
  if (checkCount % 60 === 0) {
    console.log(
      `[${new Date().toLocaleTimeString()}] 🔍 Monitoring... (${checkCount} checks, ${restoreCount} restores)`
    );
  }

  return allValid;
}

// Start watching
console.log("🔍 Starting continuous file watcher for critical admin files...");
console.log("📁 Monitoring:", CRITICAL_FILES.map((f) => f.path).join(", "));
console.log("⏱️  Checking every 2 seconds...\n");

// Initial validation
checkAllFiles();

// Set up interval to check files every 2 seconds
const interval = setInterval(() => {
  checkAllFiles();
}, 2000);

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Stopping file watcher...");
  clearInterval(interval);
  console.log(`✅ Watcher stopped. Total checks: ${checkCount}, Total restores: ${restoreCount}`);
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Stopping file watcher...");
  clearInterval(interval);
  console.log(`✅ Watcher stopped. Total checks: ${checkCount}, Total restores: ${restoreCount}`);
  process.exit(0);
});

// Keep process alive
process.stdin.resume();
