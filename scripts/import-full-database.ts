import { prisma } from "@/lib/prisma";
import { readFileSync } from "fs";

interface UserData {
  id: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  email: string;
  password: string | null;
  name: string | null;
  image: string | null;
  emailVerified: number | null;
  last_signed_in: number | null;
}

interface RoleData {
  id: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  name: string;
}

interface UserRoleData {
  id: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  user_id: string;
  role_id: string;
}

interface UserProfileData {
  id: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
}

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

async function importFullDatabase() {
  try {
    console.log("🚀 Starting full database import...\n");

    // Import Roles first (they're referenced by UserRole)
    console.log("📋 Importing Roles...");
    const rolesData = readFileSync("/tmp/all_roles.json", "utf-8");
    const roles: RoleData[] = JSON.parse(rolesData);

    for (const role of roles) {
      const created_at = new Date(role.created_at);
      const updated_at = new Date(role.updated_at);
      const deleted_at = role.deleted_at ? new Date(role.deleted_at) : null;

      // Use name as unique identifier for roles
      await prisma.role.upsert({
        where: { name: role.name },
        update: {
          id: role.id, // Update ID to match source
          updated_at,
          deleted_at,
        },
        create: {
          id: role.id,
          name: role.name,
          created_at,
          updated_at,
          deleted_at,
        },
      });
      console.log(`  ✓ Role: ${role.name}`);
    }

    // Import Users
    console.log("\n👤 Importing Users...");
    const usersData = readFileSync("/tmp/all_users.json", "utf-8");
    const users: UserData[] = JSON.parse(usersData);

    for (const user of users) {
      const created_at = new Date(user.created_at);
      const updated_at = new Date(user.updated_at);
      const deleted_at = user.deleted_at ? new Date(user.deleted_at) : null;
      const emailVerified = user.emailVerified ? new Date(user.emailVerified) : null;
      const last_signed_in = user.last_signed_in ? new Date(user.last_signed_in) : null;

      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          password: user.password,
          name: user.name,
          image: user.image,
          emailVerified,
          last_signed_in,
          updated_at,
          deleted_at,
        },
        create: {
          id: user.id,
          email: user.email,
          password: user.password,
          name: user.name,
          image: user.image,
          emailVerified,
          last_signed_in,
          created_at,
          updated_at,
          deleted_at,
        },
      });
      console.log(`  ✓ User: ${user.email}`);
    }

    // Import UserProfiles
    console.log("\n📝 Importing User Profiles...");
    const profilesData = readFileSync("/tmp/all_user_profiles.json", "utf-8");
    const profiles: UserProfileData[] = JSON.parse(profilesData);

    for (const profile of profiles) {
      const created_at = new Date(profile.created_at);
      const updated_at = new Date(profile.updated_at);
      const deleted_at = profile.deleted_at ? new Date(profile.deleted_at) : null;

      await prisma.userProfile.upsert({
        where: { id: profile.id },
        update: {
          user_id: profile.user_id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          updated_at,
          deleted_at,
        },
        create: {
          id: profile.id,
          user_id: profile.user_id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          created_at,
          updated_at,
          deleted_at,
        },
      });
      console.log(`  ✓ Profile for user: ${profile.user_id}`);
    }

    // Import UserRoles (after Users and Roles exist)
    console.log("\n🔗 Importing User Roles...");
    const userRolesData = readFileSync("/tmp/all_user_roles.json", "utf-8");
    const userRoles: UserRoleData[] = JSON.parse(userRolesData);

    for (const userRole of userRoles) {
      const created_at = new Date(userRole.created_at);
      const updated_at = new Date(userRole.updated_at);
      const deleted_at = userRole.deleted_at ? new Date(userRole.deleted_at) : null;

      // Check if user and role exist
      const userExists = await prisma.user.findUnique({ where: { id: userRole.user_id } });
      const roleExists = await prisma.role.findUnique({ where: { id: userRole.role_id } });

      if (!userExists) {
        console.log(`  ⚠️  Skipping UserRole: User ${userRole.user_id} not found`);
        continue;
      }
      if (!roleExists) {
        console.log(`  ⚠️  Skipping UserRole: Role ${userRole.role_id} not found`);
        continue;
      }

      await prisma.userRole.upsert({
        where: { id: userRole.id },
        update: {
          user_id: userRole.user_id,
          role_id: userRole.role_id,
          updated_at,
          deleted_at,
        },
        create: {
          id: userRole.id,
          user_id: userRole.user_id,
          role_id: userRole.role_id,
          created_at,
          updated_at,
          deleted_at,
        },
      });
      console.log(`  ✓ UserRole: ${userRole.user_id} -> ${userRole.role_id}`);
    }

    // Import ContactSubmissions (already done, but check if we need to re-import)
    console.log("\n📧 Checking Contact Submissions...");
    const existingSubmissions = await prisma.contactSubmission.count({
      where: { deleted_at: null },
    });

    if (existingSubmissions === 0) {
      console.log("  Importing Contact Submissions...");
      const submissionsData = readFileSync("/tmp/contact_submissions.json", "utf-8");
      const submissions: ContactSubmissionData[] = JSON.parse(submissionsData);

      for (const submission of submissions) {
        const created_at = new Date(submission.created_at);
        const updated_at = new Date(submission.updated_at);
        const deleted_at = submission.deleted_at ? new Date(submission.deleted_at) : null;
        const birthdate = submission.birthdate ? new Date(submission.birthdate) : null;
        const babyBirthdate = submission.babyBirthdate ? new Date(submission.babyBirthdate) : null;

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
      }
      console.log(`  ✓ Imported ${submissions.length} contact submissions`);
    } else {
      console.log(`  ✓ Contact submissions already exist (${existingSubmissions} found)`);
    }

    console.log("\n✅ Full database import completed successfully!");
  } catch (error) {
    console.error("❌ Error importing database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importFullDatabase();
