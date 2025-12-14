import { prismaAuth } from "@/lib/auth/prisma-auth";
import { logger } from "@/lib/logger";

export async function findUserByEmail(email: string) {
  try {
    const user = await prismaAuth.user.findUnique({
      where: {
        email: email,
        deleted_at: null,
      },
      include: {
        roles: {
          where: { deleted_at: null },
          include: { role: true },
        },
      },
    });
    return user;
  } catch (error) {
    logger.error("Error finding user by email", {}, error instanceof Error ? error : undefined);
    return null;
  }
}
