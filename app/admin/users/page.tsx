import { redirect } from "next/navigation";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function UsersPageRedirect() {
  // Redirect to new authentication page with users tab
  redirect("/admin/authentication?tab=users");
}
