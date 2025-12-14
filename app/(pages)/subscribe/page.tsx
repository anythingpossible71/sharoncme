import { getCurrentUser } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/pages/PageHeader";
import { PageHero } from "@/components/pages/PageHero";
import { PageFooterExtended } from "@/components/pages/PageFooterExtended";
import { PagePlaceholder } from "@/components/pages/PagePlaceholder";
import { getAppSettings } from "@/app/actions/app-settings";
import { AdminIframes } from "@/components/admin/AdminIframes";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

// pageDescription: Join our newsletter to receive updates, tips, and exclusive content delivered to your inbox

export const metadata: Metadata = {
  title: "Subscribe",
  description:
    "Join our newsletter to receive updates, tips, and exclusive content delivered to your inbox",
  openGraph: {
    title: "Subscribe",
    description:
      "Join our newsletter to receive updates, tips, and exclusive content delivered to your inbox",
    images: ["/app/(pages)/subscribe/preview.png"],
  },
};

export default async function SubscribePage() {
  const currentUser = await getCurrentUser();
  const appSettings = await getAppSettings();

  return (
    <AdminIframes>
      <PageHeader
        currentUser={currentUser}
        appName={appSettings.appName}
        appLogoUrl={appSettings.appLogoUrl}
      />

      <main className="container mx-auto px-4 py-8">
        <PageHero title="Subscribe" />
        <PagePlaceholder pageName="Subscribe" pagePath="/app/(pages)/subscribe/page.tsx" />
      </main>

      <PageFooterExtended appName={appSettings.appName} appLogoUrl={appSettings.appLogoUrl} />
    </AdminIframes>
  );
}
