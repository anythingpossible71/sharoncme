import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { ThemePreview } from "@/components/admin/ThemePreview";

export const dynamic = "force-dynamic";

export default function ThemePreviewPage() {
  return (
    <div className="space-y-6">
      <AdminBreadcrumb sectionName="Theme preview" />
      <ThemePreview />
    </div>
  );
}
