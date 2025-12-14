import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";

// Force dynamic rendering for Docker builds
export const dynamic = "force-dynamic";

export default async function HowToPage() {
  return (
    <div className="space-y-6">
      <AdminBreadcrumb sectionName="How-to examples" />

      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">How-to Examples</h1>
          <p className="text-muted-foreground mt-2">
            Step-by-step guides and examples to help you build with the platform
          </p>
        </div>

        <div className="mt-8">
          <p className="text-muted-foreground">Content coming soon...</p>
        </div>
      </div>
    </div>
  );
}
