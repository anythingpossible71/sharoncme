import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ToolsPage() {
  // Redirect to the first tool (Pages)
  redirect("/admin");
}
