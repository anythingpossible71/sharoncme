import { redirect } from "next/navigation";

// Force dynamic rendering for Docker builds
export const dynamic = "force-dynamic";

export default function StorageMediaPage() {
  // Redirect to the new Storage page with media tab
  redirect("/admin/storage?tab=media");
}
