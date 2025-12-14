import { assignDefaultUserRole } from "@/lib/auth/utils/role-management";
import type { User, Account } from "next-auth";
import { logger } from "@/lib/logger";

export async function signInEvent({
  user,
  account,
  isNewUser,
}: {
  user: User;
  account?: Account | null;
  profile?: unknown;
  isNewUser?: boolean;
}) {
  logger.info(`User signed in: ${user.email}, isNewUser: ${isNewUser}`);

  // Assign default role to new OAuth users
  if (isNewUser && (account?.provider === "google" || account?.provider === "github")) {
    try {
      const roleAssigned = await assignDefaultUserRole(user.id!);
      if (roleAssigned) {
        logger.info(`Assigned user role to new ${account.provider} user: ${user.email}`);
      }
    } catch (error) {
      logger.error(
        "Error assigning role to new user",
        {},
        error instanceof Error ? error : undefined
      );
    }
  }
}
