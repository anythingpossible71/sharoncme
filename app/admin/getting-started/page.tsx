"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function GettingStartedPage() {
  return (
    <div className="space-y-6">
      <AdminBreadcrumb sectionName="Getting Started" />
    </div>
  );
}
