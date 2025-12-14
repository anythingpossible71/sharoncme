import { NextRequest, NextResponse } from "next/server";
import { initializeStorageProvider, getStorageProvider } from "crunchycone-lib/services/storage";
import { auth } from "@/lib/auth";
import { lookup } from "mime-types";
import { logger } from "@/lib/logger";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ segments: string[] }> }
) {
  try {
    // Await params
    const params = await context.params;
    const filePath = params.segments.join("/");

    // Validate file path
    if (!filePath || filePath.includes("..")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    // Initialize storage provider if not already done
    try {
      initializeStorageProvider();
    } catch (error) {
      // Provider might already be initialized
    }

    const provider = getStorageProvider();

    // Check the file's actual visibility from storage provider
    let isPrivate = filePath.startsWith("private/");

    // Also check visibility metadata from storage provider
    if (!isPrivate && provider.getFileVisibility) {
      try {
        const visibilityInfo = await provider.getFileVisibility(filePath);
        isPrivate = visibilityInfo.visibility === "private";
        logger.debug("[Storage Files] Checked visibility", {
          filePath,
          visibility: visibilityInfo.visibility,
        });
      } catch (error) {
        // If we can't get visibility, fall back to path-based check
        logger.debug("[Storage Files] Could not get visibility, using path-based check", {
          filePath,
        });
      }
    }

    // Require authentication for private files
    if (isPrivate) {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json(
          { error: "Authentication required to access private files" },
          { status: 401 }
        );
      }
    }

    logger.info(`[Storage Files] Looking for file: ${filePath}`);

    // Get file stream
    const fileResult = await provider.getFileStream?.(filePath);

    if (!fileResult || !fileResult.stream) {
      logger.info(`[Storage Files] File not found: ${filePath}`);
      // Try to list files to see what's available
      try {
        const listResult = await provider.listFiles({ limit: 10 });
        logger.debug("Available files", {
          files: listResult.files.map((f) => f.key),
        });
      } catch (listError) {
        logger.error("Error listing files", {}, listError instanceof Error ? listError : undefined);
      }
      return NextResponse.json(
        { error: "File not found" },
        {
          status: 404,
          headers: {
            // Don't cache 404 responses - allow immediate revalidation
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );
    }

    logger.info(`[Storage Files] File found: ${filePath}`);

    // Determine content type
    const contentType = fileResult.contentType || lookup(filePath) || "application/octet-stream";

    // Convert ReadableStream to Response
    return new Response(fileResult.stream as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache for 1 year but allow revalidation (removed immutable to allow 404s to be detected)
        "Cache-Control": "public, max-age=31536000, must-revalidate",
        ...(fileResult.contentLength && { "Content-Length": String(fileResult.contentLength) }),
      },
    });
  } catch (error) {
    logger.error("Storage file error", {}, error instanceof Error ? error : undefined);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("404")) {
        return NextResponse.json(
          { error: "File not found" },
          {
            status: 404,
            headers: {
              // Don't cache 404 responses - allow immediate revalidation
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
