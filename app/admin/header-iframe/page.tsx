import { getCurrentUser, isAdmin } from "@/lib/auth/permissions";
import { getAppSettings } from "@/app/actions/app-settings";
import { IframeHeader } from "@/components/admin/IframeHeader";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Header Iframe",
  description: "Admin header component for iframe embedding",
};

export default async function HeaderIframePage() {
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

  // Debug: Log when header iframe page loads (indicates FULL RELOAD)
  const loadInfo = {
    timestamp: new Date().toISOString(),
    pathname: "/admin/header-iframe",
    userEmail: currentUser.email,
    isAdmin: isUserAdmin,
    stackTrace: new Error().stack?.split("\n").slice(0, 5).join("\n"),
  };
  console.log("🟢 [HeaderIframe] PAGE LOADED (FULL RELOAD)", loadInfo);

  return (
    <div
      className="m-0 p-0 min-h-[60px] h-[60px] w-full flex flex-col"
      style={{ backgroundColor: "hsl(var(--admin-background, 216 19% 95%))" }}
    >
      <IframeHeader
        appName={appSettings.appName}
        appLogoUrl={appSettings.appLogoUrl}
        currentUser={currentUser}
      />
    </div>
  );
}
