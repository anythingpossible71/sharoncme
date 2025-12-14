import { redirect } from "next/navigation";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function EmailConfigurationRedirect() {
  // Redirect to new top-level path
  redirect("/admin/email-configuration");
}
