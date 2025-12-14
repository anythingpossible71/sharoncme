import { redirect } from "next/navigation";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function EmailTemplatesPage() {
  // Redirect to the new Email page with templates tab
  redirect("/admin/email?tab=templates");
}
