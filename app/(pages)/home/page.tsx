import { getCurrentUser } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/pages/PageHeader";
import { PageHero } from "@/components/pages/PageHero";
import { PageFooterExtended } from "@/components/pages/PageFooterExtended";
import { PagePlaceholder } from "@/components/pages/PagePlaceholder";
import { getAppSettings } from "@/app/actions/app-settings";
import { AdminIframes } from "@/components/admin/AdminIframes";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

// pageDescription: Your personalized dashboard showing recent activity, quick actions, and account overview

export const metadata: Metadata = {
  title: "Home Dashboard",
  description:
    "Your personalized dashboard showing recent activity, quick actions, and account overview",
  openGraph: {
    title: "Home Dashboard",
    description:
      "Your personalized dashboard showing recent activity, quick actions, and account overview",
    images: ["/app/(pages)/home/preview.png"],
  },
};

export default async function HomePage() {
  // Check if user is authenticated
  const currentUser = await getCurrentUser();

  // If user is not signed in, redirect to root
  if (!currentUser) {
    redirect("/");
  }

  const appSettings = await getAppSettings();

  return (
    <AdminIframes>
      <PageHeader
        currentUser={currentUser}
        appName={appSettings.appName}
        appLogoUrl={appSettings.appLogoUrl}
      />

      <main className="container mx-auto px-4 py-8">
        <PageHero title="Home" />
        <PagePlaceholder pageName="Home" pagePath="/app/(pages)/home/page.tsx" />
      </main>

      <PageFooterExtended appName={appSettings.appName} appLogoUrl={appSettings.appLogoUrl} />
    </AdminIframes>
  );
}
