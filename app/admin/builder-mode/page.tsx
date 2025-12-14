import { requireRole } from "@/lib/auth/permissions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Builder Mode",
  description: "Visual page builder interface for creating and editing pages",
};

export default async function BuilderModePage() {
  await requireRole("admin");

  return (
    <div className="absolute inset-0 w-full h-full p-[20px]">
      <iframe
        src="/"
        className="w-full h-full border border-border rounded-lg shadow-lg"
        title="Builder Mode Preview"
      />
    </div>
  );
}
