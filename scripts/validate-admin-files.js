#!/usr/bin/env node
/**
 * Build-time validation script for critical admin component files
 * Ensures files are never corrupted before builds
 * This runs automatically before builds via package.json scripts
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

function validateFile(fileConfig) {
  const filePath = path.join(process.cwd(), fileConfig.path);
  const fileName = path.basename(fileConfig.path);

  try {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ ${fileName} is missing!`);
      restoreFile(filePath, fileName);
      return false;
    }

    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n").length;

    // Check file size
    if (stats.size < fileConfig.minSize) {
      console.error(`❌ ${fileName} is corrupted (${stats.size} bytes)!`);
      restoreFile(filePath, fileName);
      return false;
    }

    // Check line count
    if (lines < fileConfig.minLines) {
      console.error(`❌ ${fileName} is corrupted (${lines} lines)!`);
      restoreFile(filePath, fileName);
      return false;
    }

    // Check for export
    const exportPattern = new RegExp(`export\\s+(function|const)\\s+${fileConfig.exportName}`);
    if (!exportPattern.test(content)) {
      console.error(`❌ ${fileName} is missing export "${fileConfig.exportName}"!`);
      restoreFile(filePath, fileName);
      return false;
    }

    console.log(`✅ ${fileName} is valid`);
    return true;
  } catch (error) {
    console.error(`❌ Error validating ${fileName}:`, error.message);
    restoreFile(filePath, fileName);
    return false;
  }
}

function restoreFile(filePath, fileName) {
  console.log(`📦 Attempting to restore ${fileName} from git...`);
  try {
    execSync(`git restore "${filePath}"`, { stdio: "inherit" });
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 100) {
      console.log(`✅ ${fileName} restored successfully`);
      return;
    }
  } catch (error) {
    console.error(`❌ Could not restore ${fileName} from git:`, error.message);
  }

  console.error(`❌ CRITICAL: Cannot restore ${fileName}!`);
  console.error(`Please restore manually: git restore ${filePath}`);
}

function validateAllFiles() {
  console.log("🔍 Validating critical admin files...\n");

  let allValid = true;
  for (const fileConfig of CRITICAL_FILES) {
    if (!validateFile(fileConfig)) {
      allValid = false;
    }
  }

  console.log("");
  if (allValid) {
    console.log("✅ All critical admin files are valid");
    return true;
  } else {
    console.error("❌ Some files were corrupted and restored. Please rebuild.");
    process.exit(1);
  }
}

// Run validation
validateAllFiles();
