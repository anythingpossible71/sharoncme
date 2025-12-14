import { headers } from "next/headers";
import { isCurrentUserAdmin } from "@/lib/auth/permissions";
import { AdminBarClient } from "./AdminBarClient";

export async function AdminBar() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Don't show on admin routes, mock routes, or if not admin
  const isAdminRoute = pathname.startsWith("/admin");
  const isMockRoute = pathname.startsWith("/dev-") || pathname.startsWith("/backups");

  if (isAdminRoute || isMockRoute) {
    return null;
  }

  // Check admin status server-side
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    return null;
  }

  return <AdminBarClient />;
}
