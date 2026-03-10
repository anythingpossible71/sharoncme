import { prisma } from "@/lib/prisma";
import { readFileSync } from "fs";

interface ContactSubmissionData {
  id: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  name: string;
  phone: string;
  email: string | null;
  activityType: string;
  birthdate: number | null;
  babyBirthdate: number | null;
  message: string | null;
  howFound: string | null;
  referrerName: string | null;
}

async function importContactSubmissions() {
  try {
    // Read the JSON file
    const data = readFileSync("/tmp/contact_submissions.json", "utf-8");
    const submissions: ContactSubmissionData[] = JSON.parse(data);

    console.log(`Found ${submissions.length} contact submissions to import`);

    // Import each submission
    for (const submission of submissions) {
      // Convert timestamps from milliseconds to Date objects
      const created_at = new Date(submission.created_at);
      const updated_at = new Date(submission.updated_at);
      const deleted_at = submission.deleted_at ? new Date(submission.deleted_at) : null;
      const birthdate = submission.birthdate ? new Date(submission.birthdate) : null;
      const babyBirthdate = submission.babyBirthdate ? new Date(submission.babyBirthdate) : null;

      // Use the existing ID if it's valid, otherwise let ULID extension generate one
      const id = submission.id && submission.id.length === 26 ? submission.id : undefined;

      await prisma.contactSubmission.create({
        data: {
          ...(id && { id }),
          name: submission.name,
          phone: submission.phone,
          email: submission.email || null,
          activityType: submission.activityType,
          birthdate,
          babyBirthdate,
          message: submission.message || null,
          howFound: submission.howFound || null,
          referrerName: submission.referrerName || null,
          created_at,
          updated_at,
          deleted_at,
        },
      });

      console.log(`✓ Imported: ${submission.name} - ${submission.phone}`);
    }

    console.log(`\n✅ Successfully imported ${submissions.length} contact submissions`);
  } catch (error) {
    console.error("Error importing contact submissions:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importContactSubmissions();

