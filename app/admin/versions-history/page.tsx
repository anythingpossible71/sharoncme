"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";

export const dynamic = "force-dynamic";

export default function VersionsHistoryPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-[30px] pt-6">
        <AdminBreadcrumb sectionName="Preview & Publish" />
      </div>
      <div className="flex-1 overflow-hidden px-[30px] pb-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm w-full h-full flex flex-col">
          <div className="flex-1 overflow-hidden">
            <iframe
              src="/admin/embeded-versions"
              className="w-full h-full border-0"
              title="Mock Versions Timeline"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
}
