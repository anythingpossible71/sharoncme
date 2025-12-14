"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { triggerDatabaseUpload } from "@/app/actions/database-upload";

const setupAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Server action to sign in with credentials
 * Uses Auth.js v5 server-side signIn to avoid CSRF token issues
 */
export async function signInAction(formData: {
  email: string;
  password: string;
  callbackUrl?: string;
}) {
  const validationResult = signInSchema.safeParse(formData);

  if (!validationResult.success) {
    return { success: false, error: "Invalid email or password format" };
  }

  const { email, password } = validationResult.data;
  const callbackUrl = formData.callbackUrl || "/";

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    // If we get here, sign in was successful
    return { success: true, redirectTo: callbackUrl };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password" };
        default:
          return { success: false, error: "Authentication failed" };
      }
    }

    // For NEXT_REDIRECT errors (successful redirects), re-throw
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    logger.error("Sign in error", {}, error instanceof Error ? error : undefined);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Server action to create admin user and sign them in
 * Uses server-side signIn to avoid CSRF issues with client-side calls
 */
export async function setupAdminAction(formData: { email: string; password: string }) {
  const validationResult = setupAdminSchema.safeParse(formData);

  if (!validationResult.success) {
    return { success: false, error: "Invalid input" };
  }

  const { email, password } = validationResult.data;

  try {
    // Check if admin already exists
    const adminRole = await prisma.role.findUnique({
      where: { name: "admin" },
    });

    if (!adminRole) {
      return { success: false, error: "Admin role not found. Please run database seed." };
    }

    const adminUserCount = await prisma.userRole.count({
      where: {
        role_id: adminRole.id,
        deleted_at: null,
        user: {
          deleted_at: null,
        },
      },
    });

    if (adminUserCount > 0) {
      return { success: false, error: "Admin user already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with admin role in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          emailVerified: new Date(),
          last_signed_in: new Date(),
        },
      });

      // Create user profile
      await tx.userProfile.create({
        data: {
          user_id: newUser.id,
        },
      });

      // Assign admin role
      await tx.userRole.create({
        data: {
          user_id: newUser.id,
          role_id: adminRole.id,
        },
      });

      return newUser;
    });

    logger.info("Admin user created", { userId: user.id, email: user.email });

    // Trigger database upload in background
    try {
      await triggerDatabaseUpload();
    } catch {
      // Ignore upload errors
    }

    // Return success - client will handle sign-in separately
    // Server-side signIn has issues with Prisma client initialization in server actions
    return { success: true, message: "Admin user created successfully", needsSignIn: true };
  } catch (error) {
    logger.error(
      "Setup admin error",
      { action: "setup-admin" },
      error instanceof Error ? error : undefined
    );
    return { success: false, error: "Failed to create admin user" };
  }
}

/**
 * Server action to clear invalid session and redirect to home
 */
export async function clearInvalidSessionAction() {
  redirect("/auth/signin");
}

/**
 * Server action to sign out using Auth.js v5
 * Uses server-side signOut to avoid CSRF token issues with Turbopack
 */
export async function signOutAction(options?: { redirectTo?: string }) {
  const redirectTo = options?.redirectTo || "/";

  try {
    await signOut({ redirect: false });
    return { success: true, redirectTo };
  } catch (error) {
    // For NEXT_REDIRECT errors (successful redirects), re-throw
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    logger.error("Sign out error", {}, error instanceof Error ? error : undefined);
    // Even on error, we should redirect to clear the client state
    return { success: true, redirectTo };
  }
}

/**
 * Server action to disconnect an OAuth account
 */
export async function disconnectOAuthAccountAction(provider: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    // Get user with accounts and check if they have a password
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
        deleted_at: null,
      },
      include: {
        accounts: {
          where: { provider },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user has a password (email/password auth)
    if (!user.password) {
      throw new Error(
        "Cannot disconnect OAuth account without email/password authentication set up"
      );
    }

    // Check if the account exists
    if (user.accounts.length === 0) {
      throw new Error(`${provider} account not found`);
    }

    // Delete the OAuth account
    await prisma.account.deleteMany({
      where: {
        userId: user.id,
        provider: provider,
      },
    });

    // Revalidate the profile page to show updated state
    revalidatePath("/profile");

    return { success: true, message: `${provider} account disconnected successfully` };
  } catch (error) {
    logger.error(
      "Error disconnecting OAuth account",
      {},
      error instanceof Error ? error : undefined
    );

    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error(`Failed to disconnect ${provider} account`);
  }
}
