import { redirect } from "next/navigation";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function StorageConfigurationRedirect() {
  // Redirect to the new Storage page with provider tab
  redirect("/admin/storage?tab=provider");
}
