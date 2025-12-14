import { MockBreadcrumb } from "@/components/admin/MockBreadcrumb";
import { MyProjectsContent } from "@/components/admin/MyProjectsContent";

export const dynamic = "force-dynamic";

export default function MyProjectsPage() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-6 min-h-[40px]">
        <MockBreadcrumb tabName="My Projects" />
      </div>

      {/* Project Cards */}
      <MyProjectsContent />
    </>
  );
}

