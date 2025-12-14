import { redirect } from "next/navigation";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function TemplatesPage() {
  // Redirect to the new Email page
  redirect("/admin/email");
}
