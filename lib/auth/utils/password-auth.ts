import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function verifyUserCredentials(email: string, password: string) {
  if (!email || !password) {
    logger.warn("verifyUserCredentials: Missing email or password");
    return null;
  }

  try {
    logger.debug("verifyUserCredentials: Looking up user", { email });

    // Find user with roles and profile
    // Use findFirst instead of findUnique because we have a compound where clause
    // that includes deleted_at which is not part of the unique constraint
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        deleted_at: null,
      },
      include: {
        profile: true,
        roles: {
          where: { deleted_at: null },
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      logger.warn("verifyUserCredentials: User not found", { email });
      return null;
    }

    if (!user.password) {
      logger.warn("verifyUserCredentials: User has no password set", { email });
      return null;
    }

    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      logger.warn("verifyUserCredentials: Invalid password", { email });
      return null;
    }

    logger.info("verifyUserCredentials: Login successful", { email, userId: user.id });

    // Update last signed in
    await prisma.user.update({
      where: { id: user.id },
      data: { last_signed_in: new Date() },
    });

    // Return user object for session
    return {
      id: user.id,
      email: user.email,
      name:
        user.name ||
        `${user.profile?.first_name || ""} ${user.profile?.last_name || ""}`.trim() ||
        null,
      image: user.image,
      roles: user.roles.map((ur) => ur.role.name),
    };
  } catch (error) {
    logger.error("Auth error", {}, error instanceof Error ? error : undefined);
    return null;
  }
}
