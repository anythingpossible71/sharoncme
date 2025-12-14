#!/usr/bin/env node
/**
 * SAFE ATOMIC EDIT WRAPPER for critical admin files
 *
 * This script ensures atomic writes to prevent Turbopack corruption.
 * Usage: node scripts/safe-edit-admin-file.js <file-path> <edit-command>
 *
 * Example:
 *   node scripts/safe-edit-admin-file.js components/admin/AdminSidebar.tsx "sed 's/old/new/g'"
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_CONFIGS = {
  "components/admin/AdminLayoutClient.tsx": {
    exportName: "AdminLayoutClient",
    minSize: 100,
    minLines: 10,
  },
  "components/admin/AdminSidebar.tsx": {
    exportName: "AdminSidebar",
    minSize: 100,
    minLines: 10,
  },
  "components/admin/AdminHeader.tsx": {
    exportName: "AdminHeader",
    minSize: 100,
    minLines: 10,
  },
};

function validateFile(filePath, config) {
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: "File does not exist" };
  }

  const stats = fs.statSync(filePath);
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n").length;

  if (stats.size < config.minSize) {
    return { valid: false, error: `File too small (${stats.size} bytes)` };
  }

  if (lines < config.minLines) {
    return { valid: false, error: `File too short (${lines} lines)` };
  }

  const exportPattern = new RegExp(`export\\s+(function|const)\\s+${config.exportName}`);
  if (!exportPattern.test(content)) {
    return { valid: false, error: `Missing export "${config.exportName}"` };
  }

  return { valid: true };
}

function main() {
  const filePath = process.argv[2];
  const editCommand = process.argv[3];

  if (!filePath || !editCommand) {
    console.error("Usage: node scripts/safe-edit-admin-file.js <file-path> <edit-command>");
    console.error(
      "Example: node scripts/safe-edit-admin-file.js components/admin/AdminSidebar.tsx \"sed 's/old/new/g'\""
    );
    process.exit(1);
  }

  const config = FILE_CONFIGS[filePath];
  if (!config) {
    console.error(`❌ File ${filePath} is not a protected file.`);
    console.error("Protected files:", Object.keys(FILE_CONFIGS).join(", "));
    process.exit(1);
  }

  const fullPath = path.join(process.cwd(), filePath);
  const tempPath = `${fullPath}.safe-edit.${Date.now()}`;
  const backupPath = `${fullPath}.backup.${Date.now()}`;

  try {
    // Step 1: Validate original file
    const originalValidation = validateFile(fullPath, config);
    if (!originalValidation.valid) {
      console.error(`❌ Original file is invalid: ${originalValidation.error}`);
      console.log("📦 Attempting to restore from git...");
      execSync(`git restore "${filePath}"`, { stdio: "inherit" });
      const restoredValidation = validateFile(fullPath, config);
      if (!restoredValidation.valid) {
        console.error(`❌ File still invalid after restore: ${restoredValidation.error}`);
        process.exit(1);
      }
      console.log("✅ File restored successfully");
    }

    // Step 2: Create backup
    fs.copyFileSync(fullPath, backupPath);

    // Step 3: Apply edit to temp file using shell command
    const readStream = fs.createReadStream(fullPath);
    const writeStream = fs.createWriteStream(tempPath);

    // Use shell to execute edit command
    execSync(`${editCommand} < "${fullPath}" > "${tempPath}"`, { shell: true });

    // Step 4: Validate temp file
    const tempValidation = validateFile(tempPath, config);
    if (!tempValidation.valid) {
      console.error(`❌ Edit resulted in invalid file: ${tempValidation.error}`);
      fs.unlinkSync(tempPath);
      process.exit(1);
    }

    // Step 5: Atomically replace (mv is atomic on most filesystems)
    fs.renameSync(tempPath, fullPath);

    // Step 6: Final validation
    const finalValidation = validateFile(fullPath, config);
    if (!finalValidation.valid) {
      console.error(`❌ File invalid after edit: ${finalValidation.error}`);
      // Restore from backup
      fs.copyFileSync(backupPath, fullPath);
      process.exit(1);
    }

    // Step 7: Cleanup backup
    fs.unlinkSync(backupPath);

    console.log(`✅ File edited successfully: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error during edit:`, error.message);

    // Restore from backup if it exists
    if (fs.existsSync(backupPath)) {
      try {
        fs.copyFileSync(backupPath, fullPath);
        console.log("✅ Restored from backup");
      } catch (e) {
        console.error("❌ Could not restore from backup");
      }
    }

    // Cleanup temp files
    [tempPath, backupPath].forEach((p) => {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });

    process.exit(1);
  }
}

main();
