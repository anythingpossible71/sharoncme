import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/permissions";
import { initializeStorageProvider, getStorageProvider } from "crunchycone-lib/storage";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string }> }) {
  try {
    const session = await auth();

    if (!session || !(await hasRole(session.user.id, "admin"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const filePath = decodeURIComponent(params.path);
    const body = await request.json();
    const { visibility } = body;

    if (!["public", "private"].includes(visibility)) {
      return NextResponse.json({ error: "Invalid visibility value" }, { status: 400 });
    }

    // Initialize storage provider if not already done
    try {
      initializeStorageProvider();
    } catch {
      // Provider might already be initialized
    }

    const provider = getStorageProvider();

    // Check if file exists
    const fileExists = await provider.fileExists(filePath);
    if (!fileExists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Update file visibility using the storage provider
    try {
      logger.info("Setting file visibility", { filePath, visibility });
      const result = await provider.setFileVisibility(filePath, visibility);
      logger.debug("Visibility set result", { filePath, result });

      // Check the actual visibility after the change
      const actualVisibility = await provider.getFileVisibility(filePath);
      logger.debug("Actual visibility after change", { filePath, actualVisibility });

      return NextResponse.json({
        success: true,
        message: `File visibility changed to ${visibility}`,
        result,
        actualVisibility,
      });
    } catch (error) {
      logger.error(
        "Error changing file visibility",
        { filePath },
        error instanceof Error ? error : undefined
      );
      return NextResponse.json(
        {
          error: "Failed to update file visibility",
        },
        { status: 500 }
      );
    }
  } catch {
    // Error handled silently
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ path: string }> }
) {
  try {
    const session = await auth();

    if (!session || !(await hasRole(session.user.id, "admin"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const filePath = decodeURIComponent(params.path);

    // Initialize storage provider if not already done
    try {
      initializeStorageProvider();
    } catch {
      // Provider might already be initialized
    }

    const provider = getStorageProvider();

    // Delete the file using the storage provider
    // Note: We always try to delete, even if the file doesn't exist, to ensure cleanup
    try {
      let wasDeleted = false;
      let errorMessage = "";

      try {
        await provider.deleteFile(filePath);
        wasDeleted = true;
        logger.info("File deleted from storage", { filePath });
      } catch (deleteError) {
        // Even if delete fails, we consider it a success if it was a "not found" error
        const errorMsg = deleteError instanceof Error ? deleteError.message : String(deleteError);
        logger.debug("Delete operation failed", { filePath, errorMsg });

        if (
          errorMsg.toLowerCase().includes("not found") ||
          errorMsg.toLowerCase().includes("does not exist")
        ) {
          logger.debug("File was already missing, considering deletion successful", { filePath });
          wasDeleted = true;
        } else {
          errorMessage = errorMsg;
        }
      }

      if (wasDeleted) {
        // Revalidate pages that might reference this file
        // Note: revalidatePath() is for Server Actions, but we wrap it in try-catch
        // to prevent it from breaking API route responses
        try {
          revalidatePath("/");
          revalidatePath("/admin/components-settings/team");
          revalidatePath("/admin/storage");
        } catch (revalidateError) {
          // revalidatePath might fail in API routes, but that's okay - file is still deleted
          logger.debug("revalidatePath failed (expected in API routes)", {
            error:
              revalidateError instanceof Error ? revalidateError.message : String(revalidateError),
          });
        }

        // Return response with cache invalidation headers
        // This helps browsers understand the file is gone
        const fileUrl = `/api/storage/files/${filePath}`;
        return NextResponse.json(
          {
            success: true,
            message: "File deleted successfully",
            filePath,
            fileUrl, // Include the URL so client can clear its cache if needed
          },
          {
            status: 200, // Explicitly set status code
            headers: {
              // Tell browsers and CDNs to invalidate cache for this file
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Clear-Site-Data": '"cache"', // Hint to browsers to clear cache (may not be supported everywhere)
            },
          }
        );
      } else {
        throw new Error(errorMessage || "Failed to delete file");
      }
    } catch (error) {
      logger.error("Error deleting file", { filePath }, error instanceof Error ? error : undefined);
      return NextResponse.json(
        {
          error: "Failed to delete file",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch {
    // Error handled silently
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
