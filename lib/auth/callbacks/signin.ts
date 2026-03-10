import { findUserByEmail } from "@/lib/auth/utils/user-lookup";
import { assignDefaultUserRole } from "@/lib/auth/utils/role-management";
import { syncOAuthProfile } from "@/lib/auth/utils/profile-sync";
import type { User, Account, Profile } from "next-auth";
import { logger } from "@/lib/logger";

export async function signInCallback({
  user,
  account,
  profile,
}: {
  user: User;
  account?: Account | null;
  profile?: Profile;
}) {
  // Handle OAuth account linking and role assignment
  if (account?.provider === "google" || account?.provider === "github") {
    logger.info(`${account.provider} sign-in attempt for: ${user.email}`);

    // Check if email is available
    if (!user.email) {
      logger.error(`${account.provider} user has no email address available`, {
        provider: account.provider,
      });

      // For GitHub users with private emails, we could use their GitHub username + provider
      // But for this demo, we'll require email access
      if (account.provider === "github") {
        logger.info("GitHub user needs to make email public for this app");
      }
      return false;
    }

    try {
      // Check if user exists in our database
      const dbUser = await findUserByEmail(user.email);

      if (dbUser) {
        logger.info(`Existing user found: ${user.email}`, {
          roles: dbUser.roles.map((r: (typeof dbUser.roles)[number]) => r.role.name),
        });

        // Check if user has any roles, if not assign default "user" role
        if (dbUser.roles.length === 0) {
          const roleAssigned = await assignDefaultUserRole(dbUser.id);
          if (roleAssigned) {
            logger.info(`Assigned user role to: ${user.email}`);
          }
        }

        // Update user profile with OAuth provider data
        if (profile) {
          await syncOAuthProfile(dbUser.id, account.provider, {
            name: profile.name ?? undefined,
            picture: profile.picture ?? undefined,
            avatar_url: (profile as any).avatar_url ?? undefined,
          });
        }
      } else {
        logger.info(`New ${account.provider} user: ${user.email}`);
        // User will be created by Auth.js, but we need to assign role after creation
        // This will be handled in the events.signIn callback
      }
    } catch (error) {
      logger.error("Error in signIn callback", {}, error instanceof Error ? error : undefined);
    }
  }

  return true;
}
