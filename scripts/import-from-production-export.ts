import { prisma } from "@/lib/prisma";
import { readFileSync } from "fs";
import { join } from "path";

interface ExportedData {
  users: any[];
  userProfiles: any[];
  roles: any[];
  userRoles: any[];
  contactSubmissions: any[];
  exportedAt: string;
  version: string;
}

async function importFromProductionExport() {
  try {
    console.log("🚀 Starting import from production-data-export.json...\n");

    // Read the export file from the source project
    const exportPath = join(
      "/Users/avicharkham/projects/sharoncme-contact-from-starter",
      "production-data-export.json"
    );
    const fileContent = readFileSync(exportPath, "utf-8");
    const data: ExportedData = JSON.parse(fileContent);

    console.log(`📊 Found in export file:`);
    console.log(`   Users: ${data.users.length}`);
    console.log(`   User Profiles: ${data.userProfiles.length}`);
    console.log(`   Roles: ${data.roles.length}`);
    console.log(`   User Roles: ${data.userRoles.length}`);
    console.log(`   Contact Submissions: ${data.contactSubmissions.length}\n`);

    // Import Roles
    console.log("📋 Importing Roles...");
    for (const role of data.roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: {
          id: role.id,
          updated_at: new Date(role.updated_at),
        },
        create: {
          id: role.id,
          name: role.name,
          created_at: new Date(role.created_at),
          updated_at: new Date(role.updated_at),
        },
      });
    }
    console.log(`  ✅ Imported ${data.roles.length} roles`);

    // Import Users
    console.log("\n👤 Importing Users...");
    for (const user of data.users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          password: user.password,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
          updated_at: new Date(user.updated_at),
        },
        create: {
          id: user.id,
          email: user.email,
          password: user.password,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
          created_at: new Date(user.created_at),
          updated_at: new Date(user.updated_at),
        },
      });
    }
    console.log(`  ✅ Imported ${data.users.length} users`);

    // Import User Profiles
    console.log("\n📝 Importing User Profiles...");
    for (const profile of data.userProfiles) {
      await prisma.userProfile.upsert({
        where: { id: profile.id },
        update: {
          user_id: profile.user_id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          updated_at: new Date(profile.updated_at),
        },
        create: {
          id: profile.id,
          user_id: profile.user_id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          created_at: new Date(profile.created_at),
          updated_at: new Date(profile.updated_at),
        },
      });
    }
    console.log(`  ✅ Imported ${data.userProfiles.length} user profiles`);

    // Import User Roles
    console.log("\n🔗 Importing User Roles...");
    for (const userRole of data.userRoles) {
      // Verify user and role exist
      const userExists = await prisma.user.findUnique({ where: { id: userRole.user_id } });
      const roleExists = await prisma.role.findUnique({ where: { id: userRole.role_id } });

      if (!userExists || !roleExists) {
        console.log(
          `  ⚠️  Skipping UserRole: User or Role not found (${userRole.user_id} -> ${userRole.role_id})`
        );
        continue;
      }

      await prisma.userRole.upsert({
        where: { id: userRole.id },
        update: {
          user_id: userRole.user_id,
          role_id: userRole.role_id,
          updated_at: new Date(userRole.updated_at),
        },
        create: {
          id: userRole.id,
          user_id: userRole.user_id,
          role_id: userRole.role_id,
          created_at: new Date(userRole.created_at),
          updated_at: new Date(userRole.updated_at),
        },
      });
    }
    console.log(`  ✅ Imported ${data.userRoles.length} user roles`);

    // Import Contact Submissions
    console.log("\n📧 Importing Contact Submissions...");
    let imported = 0;
    let skipped = 0;

    for (const submission of data.contactSubmissions) {
      try {
        // Check if already exists
        const exists = await prisma.contactSubmission.findUnique({
          where: { id: submission.id },
        });

        if (exists) {
          skipped++;
          continue;
        }

        await prisma.contactSubmission.create({
          data: {
            id: submission.id,
            name: submission.name,
            phone: submission.phone,
            email: submission.email || null,
            activityType: submission.activityType,
            birthdate: submission.birthdate ? new Date(submission.birthdate) : null,
            babyBirthdate: submission.babyBirthdate ? new Date(submission.babyBirthdate) : null,
            message: submission.message || null,
            howFound: submission.howFound || null,
            referrerName: submission.referrerName || null,
            created_at: new Date(submission.created_at),
            updated_at: new Date(submission.updated_at),
          },
        });
        imported++;

        if (imported % 100 === 0) {
          console.log(`  ... Imported ${imported} submissions so far...`);
        }
      } catch (error: any) {
        if (error.code === "P2002") {
          // Unique constraint violation - already exists
          skipped++;
        } else {
          console.error(`  ❌ Error importing submission ${submission.id}:`, error.message);
        }
      }
    }

    console.log(`  ✅ Imported ${imported} new contact submissions`);
    if (skipped > 0) {
      console.log(`  ⏭️  Skipped ${skipped} existing submissions`);
    }

    console.log("\n✅ Full database import from production export completed successfully!");
    console.log(`\n📊 Final Summary:`);
    const finalCounts = {
      users: await prisma.user.count({ where: { deleted_at: null } }),
      roles: await prisma.role.count({ where: { deleted_at: null } }),
      userRoles: await prisma.userRole.count({ where: { deleted_at: null } }),
      userProfiles: await prisma.userProfile.count({ where: { deleted_at: null } }),
      contactSubmissions: await prisma.contactSubmission.count({ where: { deleted_at: null } }),
    };
    console.log(`   Users: ${finalCounts.users}`);
    console.log(`   Roles: ${finalCounts.roles}`);
    console.log(`   User Roles: ${finalCounts.userRoles}`);
    console.log(`   User Profiles: ${finalCounts.userProfiles}`);
    console.log(`   Contact Submissions: ${finalCounts.contactSubmissions}`);
  } catch (error) {
    console.error("❌ Error importing from production export:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importFromProductionExport();

