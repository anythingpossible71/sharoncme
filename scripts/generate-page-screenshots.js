#!/usr/bin/env node
/**
 * Generate preview screenshots for page templates
 *
 * This script:
 * 1. Finds all pages that appear in the page templates page (same as page selector UI)
 * 2. Only generates screenshots for pages that have been changed in the commit or don't have preview.png
 * 3. Stores screenshots as preview.png in the same folder as the page
 */

import { chromium } from "playwright";
import { readdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { execSync, spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Pages to exclude from the templates list (same as template-pages.ts)
const EXCLUDED_PAGES = ["/components-library", "/root-backup"];

/**
 * Extract page metadata from a page.tsx file
 */
async function extractPageMetadata(filePath, routePath) {
  try {
    const content = await readFile(filePath, "utf-8");

    // Extract title from metadata
    const titleMatch = content.match(/title:\s*["']([^"']+)["']/);
    const title = titleMatch ? titleMatch[1] : routePath.split("/").pop() || routePath;

    return {
      title,
      path: routePath,
      filePath,
      dirPath: dirname(filePath),
    };
  } catch (error) {
    console.error(`Error reading page file ${filePath}:`, error);
    return null;
  }
}

/**
 * Recursively scan directory for page.tsx files
 */
async function scanPagesDirectory(dirPath, basePath = "", pages = []) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const routePath = basePath ? `${basePath}/${entry.name}` : `/${entry.name}`;

      // Skip excluded pages
      if (EXCLUDED_PAGES.includes(routePath)) {
        continue;
      }

      // Skip admin, auth, api directories
      if (
        entry.name.startsWith("admin") ||
        entry.name.startsWith("auth") ||
        entry.name.startsWith("api") ||
        entry.name.startsWith("_") ||
        entry.name === "node_modules"
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        // Check if this directory has a page.tsx
        const pageFilePath = join(fullPath, "page.tsx");
        if (existsSync(pageFilePath)) {
          const metadata = await extractPageMetadata(pageFilePath, routePath);
          if (metadata) {
            pages.push(metadata);
          }
        } else {
          // Recursively scan subdirectories
          await scanPagesDirectory(fullPath, routePath, pages);
        }
      }
    }

    return pages;
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
    return pages;
  }
}

/**
 * Get all app pages from file system (same logic as getTemplatePages)
 */
async function getTemplatePages() {
  const appDir = join(projectRoot, "app");
  const pages = [];

  // Check for root page.tsx file
  const rootPagePath = join(appDir, "page.tsx");
  if (existsSync(rootPagePath)) {
    const rootMetadata = await extractPageMetadata(rootPagePath, "/");
    if (rootMetadata) {
      pages.push(rootMetadata);
    }
  }

  // Scan (pages) directory
  const pagesDir = join(appDir, "(pages)");
  if (existsSync(pagesDir)) {
    await scanPagesDirectory(pagesDir, "", pages);
  }

  // Scan root level pages (excluding admin, auth, api)
  const rootEntries = await readdir(appDir, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (
      entry.isDirectory() &&
      !entry.name.startsWith("admin") &&
      !entry.name.startsWith("auth") &&
      !entry.name.startsWith("api") &&
      !entry.name.startsWith("_") &&
      entry.name !== "(pages)"
    ) {
      const pageFilePath = join(appDir, entry.name, "page.tsx");
      if (existsSync(pageFilePath)) {
        const routePath = `/${entry.name}`;
        if (!EXCLUDED_PAGES.includes(routePath)) {
          const metadata = await extractPageMetadata(pageFilePath, routePath);
          if (metadata) {
            pages.push(metadata);
          }
        }
      }
    }
  }

  // Sort by path
  pages.sort((a, b) => a.path.localeCompare(b.path));

  return pages;
}

/**
 * Check if a file has been changed in the current commit
 */
function isFileChangedInCommit(filePath) {
  try {
    // Get relative path from project root - normalize paths
    const normalizedProjectRoot = projectRoot.replace(/\\/g, "/").replace(/\/$/, "");
    const normalizedFilePath = filePath.replace(/\\/g, "/");
    const relativePath = normalizedFilePath.replace(normalizedProjectRoot + "/", "");

    // Check if file is staged or modified
    let stagedFiles = [];
    let modifiedFiles = [];

    try {
      stagedFiles = execSync("git diff --cached --name-only", {
        encoding: "utf-8",
        cwd: projectRoot,
        stdio: ["pipe", "pipe", "pipe"],
      })
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((f) => f.replace(/\\/g, "/")); // Normalize paths
    } catch (e) {
      // No staged files or not in git repo
    }

    try {
      modifiedFiles = execSync("git diff --name-only", {
        encoding: "utf-8",
        cwd: projectRoot,
        stdio: ["pipe", "pipe", "pipe"],
      })
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((f) => f.replace(/\\/g, "/")); // Normalize paths
    } catch (e) {
      // No modified files or not in git repo
    }

    // Check if the page file or any file in its directory has changed
    const allChangedFiles = [...stagedFiles, ...modifiedFiles];

    if (allChangedFiles.length === 0) {
      return false; // No changes detected
    }

    // Check if the page file itself changed
    if (allChangedFiles.includes(relativePath)) {
      return true;
    }

    // Check if any file in the page's directory changed
    const pageDir = dirname(relativePath).replace(/\\/g, "/");
    return allChangedFiles.some((file) => {
      const fileDir = dirname(file).replace(/\\/g, "/");
      return fileDir === pageDir || file.startsWith(pageDir + "/");
    });
  } catch (error) {
    // If not in a git repo or other error, don't assume changed
    return false;
  }
}

/**
 * Check if preview.png exists and is recent
 */
function hasPreviewImage(dirPath) {
  const previewPath = join(dirPath, "preview.png");
  return existsSync(previewPath);
}

/**
 * Generate screenshot for a page
 */
async function generateScreenshot(page, browser, baseUrl = "http://localhost:3000") {
  try {
    const pageInstance = await browser.newPage();

    // Set viewport size to 500px width with auto height (full page)
    await pageInstance.setViewportSize({ width: 500, height: 800 });

    // Navigate to the page
    const url = `${baseUrl}${page.path}`;
    process.stdout.write(`   → Navigating to ${url}... `);

    await pageInstance.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    process.stdout.write("✓ Loaded\n");

    // Wait a bit for any animations or dynamic content
    process.stdout.write("   → Waiting for content to settle... ");
    await pageInstance.waitForTimeout(1000);
    process.stdout.write("✓ Ready\n");

    // Take screenshot with 500px width, auto height (fullPage captures full height)
    process.stdout.write("   → Capturing screenshot... ");
    const screenshotBuffer = await pageInstance.screenshot({
      type: "png",
      fullPage: true, // This will capture full page height automatically
    });
    process.stdout.write("✓ Captured\n");

    // Save to preview.png in the same directory as the page
    const previewPath = join(page.dirPath, "preview.png");
    process.stdout.write(`   → Saving to ${previewPath}... `);
    await writeFile(previewPath, screenshotBuffer);
    process.stdout.write("✓ Saved\n");

    await pageInstance.close();
    return true;
  } catch (error) {
    process.stdout.write(`✗ Failed\n`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force") || args.includes("-f");
  const baseUrl =
    args.find((arg) => arg.startsWith("--url="))?.split("=")[1] || "http://localhost:3000";

  console.log("🖼️  Generating page preview screenshots...\n");

  // Get all template pages
  const pages = await getTemplatePages();
  console.log(`Found ${pages.length} page templates\n`);

  // Filter pages that need screenshots
  const pagesToScreenshot = pages.filter((page) => {
    if (force) {
      return true; // Generate all if force flag is set
    }

    // Always generate if preview doesn't exist (highest priority)
    if (!hasPreviewImage(page.dirPath)) {
      return true;
    }

    // Generate if page or directory has changed
    if (isFileChangedInCommit(page.filePath)) {
      return true;
    }

    return false;
  });

  if (pagesToScreenshot.length === 0) {
    console.log("✅ All pages have up-to-date screenshots!\n");
    // Exit successfully - no work needed
    process.exit(0);
  }

  console.log(`📸 Generating screenshots for ${pagesToScreenshot.length} page(s):\n`);
  pagesToScreenshot.forEach((page, index) => {
    console.log(`  ${index + 1}. ${page.path}`);
  });
  console.log();

  // Check if dev server is running, start it if needed
  let devServerProcess = null;
  let serverStartedByUs = false;

  // Cleanup function to ensure dev server is stopped
  const cleanup = async () => {
    if (serverStartedByUs && devServerProcess) {
      console.log("\n🛑 Cleaning up: Stopping temporary dev server...");
      devServerProcess.kill("SIGTERM");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  // Register cleanup handlers
  process.on("SIGINT", async () => {
    await cleanup();
    process.exit(1);
  });
  process.on("SIGTERM", async () => {
    await cleanup();
    process.exit(1);
  });
  process.on("uncaughtException", async (error) => {
    console.error("Fatal error:", error);
    await cleanup();
    process.exit(1);
  });

  try {
    const response = await fetch(baseUrl);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    console.log("✅ Dev server is already running\n");
  } catch (error) {
    console.log("🚀 Dev server not running, starting it temporarily...\n");
    serverStartedByUs = true;

    // Start dev server in background
    devServerProcess = spawn("npx", ["next", "dev", "--turbopack", "-p", "3000"], {
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
      cwd: projectRoot,
      detached: false,
    });

    // Wait for server to be ready (poll every 1s, max 120 seconds)
    const maxWaitTime = 120000; // 120 seconds (2 minutes)
    const pollInterval = 1000; // Check every second
    const startTime = Date.now();
    let serverReady = false;
    let lastError = null;

    console.log("⏳ Waiting for dev server to be ready...");

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await fetch(baseUrl, {
          signal: AbortSignal.timeout(2000), // 2 second timeout per request
        });
        if (response.ok) {
          serverReady = true;
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`✅ Dev server is ready (took ${elapsed}s)\n`);
          // Give it a moment to fully initialize
          await new Promise((resolve) => setTimeout(resolve, 2000));
          break;
        }
      } catch (e) {
        lastError = e;
        // Server not ready yet, continue polling
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (elapsed % 10 === 0 && elapsed > 0) {
          // Show progress every 10 seconds
          process.stdout.write(`   Still waiting... (${elapsed}s)\n`);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    if (!serverReady) {
      console.error("\n❌ Error: Dev server failed to start within 2 minutes");
      if (lastError) {
        console.error(`   Last error: ${lastError.message}`);
      }
      if (devServerProcess) {
        devServerProcess.kill();
      }
      process.exit(1);
    }
  }

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
  });

  let successCount = 0;
  let failCount = 0;

  // Generate screenshots
  for (let i = 0; i < pagesToScreenshot.length; i++) {
    const page = pagesToScreenshot[i];
    const pageNum = i + 1;
    const totalPages = pagesToScreenshot.length;

    console.log(`\n[${pageNum}/${totalPages}] 📸 Capturing screenshot for: ${page.path}`);
    const success = await generateScreenshot(page, browser, baseUrl);
    if (success) {
      successCount++;
      console.log(`✅ [${pageNum}/${totalPages}] Completed: ${page.path}`);
    } else {
      failCount++;
      console.log(`❌ [${pageNum}/${totalPages}] Failed: ${page.path}`);
    }
  }

  await browser.close();

  // Stop dev server if we started it
  await cleanup();

  console.log(`\n✅ Screenshot generation complete!`);
  console.log(`   Success: ${successCount}`);
  if (failCount > 0) {
    console.log(`   Failed: ${failCount}`);
  }
  console.log();

  // Exit with error code if any screenshots failed
  if (failCount > 0 && successCount === 0) {
    process.exit(1);
  }
}

// Run main function when script is executed directly
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

export { getTemplatePages, generateScreenshot };
