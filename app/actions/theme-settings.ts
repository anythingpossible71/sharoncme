"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

/**
 * Get the current user's admin theme preference
 */
export async function getAdminTheme(): Promise<string | null> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      logger.info("[getAdminTheme] No session found");
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { admin_theme: true },
    });

    const theme = user?.admin_theme || "pistachio-almond";
    logger.info("[getAdminTheme]", {
      user: session.user.email,
      theme,
    });

    return theme;
  } catch (error) {
    logger.error("Error getting admin theme", {}, error instanceof Error ? error : undefined);
    return "pistachio-almond";
  }
}

/**
 * Update the current user's admin theme preference
 */
export async function updateAdminTheme(
  theme: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      logger.info("[updateAdminTheme] No session found");
      return { success: false, error: "Not authenticated" };
    }

    logger.info("[updateAdminTheme] Updating theme", {
      user: session.user.email,
      theme,
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { admin_theme: theme },
    });

    logger.info("[updateAdminTheme] Theme updated successfully in database");

    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    logger.error("Error updating admin theme", {}, error instanceof Error ? error : undefined);
    return { success: false, error: "Failed to update theme" };
  }
}
