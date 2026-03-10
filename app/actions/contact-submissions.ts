"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser, isAdmin } from "@/lib/auth/permissions";
import { logger } from "@/lib/logger";

/** Expected CSV row format from our export */
export interface ContactSubmissionImportRow {
  name: string;
  phone: string;
  email: string | null;
  activityType: string;
  birthdate: string | null;
  babyBirthdate: string | null;
  message: string | null;
  howFound: string | null;
  referrerName: string | null;
  submittedAt: string | null;
}

export async function importContactSubmissionsAction(
  rows: ContactSubmissionImportRow[]
): Promise<{ success: boolean; imported: number; skipped: number; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !(await isAdmin(currentUser.id))) {
      return { success: false, imported: 0, skipped: 0, error: "Unauthorized" };
    }

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      if (!row.name?.trim() || !row.phone?.trim() || !row.activityType?.trim()) {
        skipped++;
        continue;
      }

      try {
        const submittedAt = row.submittedAt?.trim()
          ? (() => {
              const d = new Date(row.submittedAt.trim());
              return Number.isNaN(d.getTime()) ? null : d;
            })()
          : null;

        await prisma.contactSubmission.create({
          data: {
            name: row.name.trim(),
            phone: row.phone.trim(),
            email: row.email?.trim() || null,
            activityType: row.activityType.trim(),
            birthdate: row.birthdate ? new Date(row.birthdate) : null,
            babyBirthdate: row.babyBirthdate ? new Date(row.babyBirthdate) : null,
            message: row.message?.trim() || null,
            howFound: row.howFound?.trim() || null,
            referrerName: row.referrerName?.trim() || null,
            ...(submittedAt && {
              created_at: submittedAt,
              updated_at: submittedAt,
            }),
          },
        });
        imported++;
      } catch (e) {
        // Skip duplicates or invalid rows
        skipped++;
      }
    }

    logger.info("Contact submissions imported", { imported, skipped, userId: currentUser.id });
    revalidatePath("/");

    return { success: true, imported, skipped };
  } catch (error) {
    logger.error(
      "Import contact submissions failed",
      {},
      error instanceof Error ? error : undefined
    );
    return {
      success: false,
      imported: 0,
      skipped: 0,
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}
