import { getUserRoles } from "@/lib/auth/utils/role-management";
import type { JWT } from "next-auth/jwt";
import type { User, Account } from "next-auth";
import { logger } from "@/lib/logger";

export async function jwtCallback({
  token,
  user,
  account,
}: {
  token: JWT;
  user?: User;
  account?: Account | null;
}) {
  // Include roles in JWT token
  if (user) {
    logger.info("JWT callback - user:", { id: user.id, email: user.email, name: user.name });

    // For OAuth users, we need to fetch roles from database
    if (account?.provider === "google" || account?.provider === "github") {
      try {
        const roles = await getUserRoles(user.id!);
        token.roles = roles;
      } catch (error) {
        logger.error("Error fetching user roles", {}, error instanceof Error ? error : undefined);
        token.roles = [];
      }
    } else {
      token.roles = (user as { roles?: string[] }).roles || [];
    }

    token.id = user.id!;
    logger.info("JWT token created", { roles: token.roles });
  }
  return token;
}
