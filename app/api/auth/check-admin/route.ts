import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/permissions";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ isAdmin: false });
    }

    const userIsAdmin = await isAdmin(session.user.id);

    return NextResponse.json({ isAdmin: userIsAdmin });
  } catch (error) {
    logger.error("Error checking admin status", {}, error instanceof Error ? error : undefined);
    return NextResponse.json({ isAdmin: false });
  }
}
