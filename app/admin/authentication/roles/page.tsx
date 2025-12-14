import { redirect } from "next/navigation";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function RolesRedirect() {
  // Redirect to new nested path
  redirect("/admin/authentication?tab=roles");
}
