import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/permissions";
import { initializeStorageProvider, getStorageProvider } from "crunchycone-lib/storage";
import { logger } from "@/lib/logger";

interface FileInfo {
  name: string;
  path: string;
  size: number;
  lastModified: string;
  contentType: string;
  visibility: "public" | "private";
  url?: string;
}

export async function GET(request: NextRequest) {
  logger.info("[Media Files] Route handler called", { url: request.url });
  try {
    logger.debug("[Media Files] Calling auth()");
    const session = await auth();
    logger.debug("[Media Files] Auth result", { hasSession: !!session, userId: session?.user?.id });

    if (!session || !(await hasRole(session.user.id, "admin"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search");

    // Initialize storage provider if not already done
    try {
      initializeStorageProvider();
      logger.info("[Media Files] Storage provider initialized successfully");
    } catch (error) {
      logger.info("[Media Files] Provider might already be initialized", {
        error: error instanceof Error ? error.message : String(error),
      });
      // Provider might already be initialized
    }

    const provider = getStorageProvider();
    logger.info("[Media Files] Got storage provider", {
      provider: provider?.constructor?.name,
    });

    // Use search or list files based on query parameters
    try {
      let listResult;

      if (search) {
        // Use search functionality
        listResult = await provider.searchFiles({
          query: search,
          searchFields: ["filename", "key"],
          limit,
          offset,
          sortBy: "lastModified",
          sortOrder: "desc",
          includeUrls: true,
        });
      } else {
        // Use list functionality with pagination
        listResult = await provider.listFiles({
          limit,
          offset,
          sortBy: "lastModified",
          sortOrder: "desc",
          includeUrls: true,
        });
      }

      logger.debug("Media files list result", {
        filesCount: listResult.files.length,
        totalCount: listResult.totalCount,
        hasMore: listResult.hasMore,
        offset,
        limit,
        search,
      });

      const files: FileInfo[] = [];

      for (const fileItem of listResult.files) {
        // Extract file name from the key (path)
        const fileName = fileItem.key.split("/").pop() || fileItem.key;

        const fileInfo: FileInfo = {
          name: fileName,
          path: fileItem.key,
          size: fileItem.size,
          lastModified: fileItem.lastModified
            ? fileItem.lastModified.toISOString()
            : new Date().toISOString(),
          contentType: fileItem.contentType,
          visibility: fileItem.visibility === "public" ? "public" : "private", // Use visibility from listFiles result, map temporary-public to private
        };

        // Add URL for public files if available from listFiles result
        if (fileItem.publicUrl) {
          fileInfo.url = fileItem.publicUrl;
        }

        files.push(fileInfo);
      }

      return NextResponse.json({
        files,
        totalCount: listResult.totalCount || files.length,
        hasMore: listResult.hasMore || false,
        currentPage: Math.floor(offset / limit) + 1,
        pageSize: limit,
      });
    } catch (error) {
      logger.error(
        "Media files error",
        {
          message: error instanceof Error ? error.message : "Unknown error",
        },
        error instanceof Error ? error : undefined
      );
      return NextResponse.json(
        {
          error: "Failed to list files",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Error handled silently
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
