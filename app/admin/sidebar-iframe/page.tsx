import { getCurrentUser, isAdmin } from "@/lib/auth/permissions";
import { getAppSettings } from "@/app/actions/app-settings";
import {
  getCrunchyConeCustomDomainUrl,
  getCrunchyConeDeploymentsUrl,
} from "@/lib/crunchycone-config";
import { IframeSidebar } from "@/components/admin/IframeSidebar";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sidebar Iframe",
  description: "Admin sidebar component for iframe embedding",
};

export default async function SidebarIframePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/signin");
  }

  // Check if user is admin
  const isUserAdmin = await isAdmin(currentUser.id);
  if (!isUserAdmin) {
    redirect("/");
  }

  const appSettings = await getAppSettings();
  const customDomainUrl = getCrunchyConeCustomDomainUrl();
  const deploymentsUrl = getCrunchyConeDeploymentsUrl();

  return (
    <div className="h-full w-full" style={{ margin: 0, padding: 0 }}>
      <IframeSidebar
        appName={appSettings.appName}
        currentUser={currentUser}
        customDomainUrl={customDomainUrl}
        deploymentsUrl={deploymentsUrl}
      />
    </div>
  );
}
