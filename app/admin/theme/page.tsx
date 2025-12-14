import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { ThemePreview } from "@/components/admin/ThemePreview";

export const dynamic = "force-dynamic";

export default function ThemePage() {
  return (
    <div className="space-y-6">
      <AdminBreadcrumb sectionName="Theme" />
      <ThemePreview />
    </div>
  );
}
