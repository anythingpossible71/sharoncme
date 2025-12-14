import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { getSupportedServices } from "@/app/actions/connected-services";
import { ConnectedServicesPageClient } from "@/components/admin/ConnectedServicesPageClient";
import { redirect } from "next/navigation";
import { AddServiceButtonWrapper } from "@/components/admin/AddServiceButtonWrapper";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export default async function ConnectedServicesPage() {
  let services;
  try {
    services = await getSupportedServices();
  } catch (error) {
    logger.error(
      "Error loading connected services",
      {},
      error instanceof Error ? error : undefined
    );
    // If unauthorized, redirect to sign in
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/auth/signin");
    }
    // Otherwise, show error state
    return (
      <div className="space-y-6">
        <AdminBreadcrumb sectionName="Connected Services" />
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">
            Failed to load connected services. Please try again later.
          </p>
          {error instanceof Error && (
            <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        sectionName="Connected Services"
        actionButtons={<AddServiceButtonWrapper />}
      />
      <ConnectedServicesPageClient allServices={services} />
    </div>
  );
}
