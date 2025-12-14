import { redirect } from "next/navigation";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function UsersRolesPageRedirect() {
  // Redirect to new authentication page with roles tab
  redirect("/admin/authentication?tab=roles");
}
