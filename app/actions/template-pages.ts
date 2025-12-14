"use server";

import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { logger } from "@/lib/logger";

// Pages to exclude from the templates list
const EXCLUDED_PAGES = [
  "/components-library",
  "/root-backup",
  // Add more paths here as needed
];

interface AppPage {
  id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  title: string;
  path: string;
  dev_instructions: string;
  preview_image: string | null;
  page_description: string | null;
  requires_login: boolean;
  is_redirect?: boolean;
}

/**
 * Extract page metadata from a page.tsx file
 */
async function extractPageMetadata(filePath: string, routePath: string): Promise<AppPage | null> {
  try {
    const content = await readFile(filePath, "utf-8");

    // Extract title from metadata
    const titleMatch = content.match(/title:\s*["']([^"']+)["']/);
    const title = titleMatch ? titleMatch[1] : routePath.split("/").pop() || routePath;

    // Extract page description from comment (not used by Next.js metadata or OpenGraph)
    const pageDescMatch = content.match(/\/\/\s*pageDescription:\s*(.+)/);
    const pageDescription = pageDescMatch ? pageDescMatch[1].trim() : null;

    // Check if page requires login (has redirect when user is not authenticated)
    // Only mark as requires login if there's an actual redirect check for unauthenticated users
    const requiresLogin =
      /redirect\(["']\/auth\/signin/.test(content) ||
      /if\s*\(\s*!.*currentUser\s*\)\s*\{?\s*redirect/.test(content) ||
      /if\s*\(\s*!.*session\s*\)\s*\{?\s*redirect/.test(content) ||
      /if\s*\(\s*!.*user\s*\)\s*\{?\s*redirect/.test(content) ||
      /!currentUser.*redirect\(/.test(content) ||
      /!session.*redirect\(/.test(content) ||
      /!user.*redirect\(/.test(content);

    // No preview image needed - using iframes instead
    const previewImage = null;

    // Generate dev instructions based on page content
    const devInstructions = `This is the ${title} page. You can customize it by editing the page file.`;

    return {
      id: routePath.replace(/\//g, "-").replace(/^-/, ""),
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      title,
      path: routePath,
      dev_instructions: devInstructions,
      preview_image: previewImage,
      page_description: pageDescription,
      requires_login: requiresLogin,
      is_redirect: false,
    };
  } catch (error) {
    logger.error(
      `Error reading page file ${filePath}`,
      {},
      error instanceof Error ? error : undefined
    );
    return null;
  }
}

/**
 * Recursively scan directory for page.tsx files
 */
async function scanPagesDirectory(
  dirPath: string,
  basePath: string = "",
  pages: AppPage[] = []
): Promise<AppPage[]> {
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
    logger.error(
      `Error scanning directory ${dirPath}`,
      {},
      error instanceof Error ? error : undefined
    );
    return pages;
  }
}

/**
 * Get all app pages from file system (excluding admin pages)
 */
export async function getTemplatePages() {
  try {
    const appDir = join(process.cwd(), "app");
    const pages: AppPage[] = [];

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

    // Return only the fields needed for page navigator
    const navigatorPages = pages.map((page) => ({
      id: page.id,
      title: page.title,
      path: page.path,
      dev_instructions: page.dev_instructions,
      preview_image: page.preview_image,
      page_description: page.page_description,
      requires_login: page.requires_login,
    }));

    return { success: true, pages: navigatorPages };
  } catch (error) {
    logger.error(
      "Error fetching page templates from file system",
      {},
      error instanceof Error ? error : undefined
    );
    return { success: false, error: "Failed to fetch page templates" };
  }
}
