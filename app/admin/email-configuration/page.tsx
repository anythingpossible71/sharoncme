import { redirect } from "next/navigation";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function EmailConfigurationPage() {
  // Redirect to the new Email page with provider tab
  redirect("/admin/email?tab=provider");
}
