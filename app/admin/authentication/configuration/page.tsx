import { redirect } from "next/navigation";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function AuthenticationConfigurationRedirect() {
  // Redirect to new top-level path
  redirect("/admin/authentication?tab=auth");
}
