import { redirect } from "next/navigation";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function AuthSettingsPageRedirect() {
  // Redirect to new authentication page with auth tab
  redirect("/admin/authentication?tab=auth");
}
