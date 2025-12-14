#!/usr/bin/env node
/**
 * Build-time validation script for AdminLayoutClient.tsx
 * Ensures file is never corrupted before builds
 * This runs automatically before builds via package.json scripts
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE = path.join(process.cwd(), "components/admin/AdminLayoutClient.tsx");
const MIN_SIZE = 100; // Minimum file size in bytes
const MIN_LINES = 10; // Minimum number of lines

function validateFile() {
  try {
    if (!fs.existsSync(FILE)) {
      console.error("❌ AdminLayoutClient.tsx is missing!");
      restoreFile();
      process.exit(1);
    }

    const stats = fs.statSync(FILE);
    const content = fs.readFileSync(FILE, "utf8");
    const lines = content.split("\n").length;

    // Check file size
    if (stats.size < MIN_SIZE) {
      console.error(`❌ AdminLayoutClient.tsx is corrupted (${stats.size} bytes)!`);
      restoreFile();
      process.exit(1);
    }

    // Check line count
    if (lines < MIN_LINES) {
      console.error(`❌ AdminLayoutClient.tsx is corrupted (${lines} lines)!`);
      restoreFile();
      process.exit(1);
    }

    // Check for export
    if (!content.includes("export function AdminLayoutClient")) {
      console.error("❌ AdminLayoutClient.tsx is missing export!");
      restoreFile();
      process.exit(1);
    }

    console.log("✅ AdminLayoutClient.tsx is valid");
    return true;
  } catch (error) {
    console.error("❌ Error validating file:", error.message);
    restoreFile();
    process.exit(1);
  }
}

function restoreFile() {
  console.log("📦 Attempting to restore from git...");
  try {
    execSync(`git restore "${FILE}"`, { stdio: "inherit" });
    if (fs.existsSync(FILE) && fs.statSync(FILE).size > MIN_SIZE) {
      console.log("✅ File restored successfully");
      return;
    }
  } catch (error) {
    console.error("❌ Could not restore from git:", error.message);
  }

  console.error("❌ CRITICAL: Cannot restore AdminLayoutClient.tsx!");
  console.error("Please restore manually: git restore components/admin/AdminLayoutClient.tsx");
  process.exit(1);
}

// Run validation
validateFile();
