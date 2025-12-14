import { getCurrentUser } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/pages/PageHeader";
import { PageFooterExtended } from "@/components/pages/PageFooterExtended";
import { getAppSettings } from "@/app/actions/app-settings";
import { AdminIframes } from "@/components/admin/AdminIframes";
import { AppAdminHero } from "@/components/sections/AppAdminHero";
import { getContactMessages } from "@/app/actions/contact-messages";
import { Inbox } from "lucide-react";
import type { Metadata } from "next";
import { InboxMessagesList } from "@/components/contact/InboxMessagesList";

export const dynamic = "force-dynamic";

// pageDescription: View and manage contact messages in your inbox

export const metadata: Metadata = {
  title: "Contact Us Inbox",
  description: "View and manage contact messages in your inbox",
  openGraph: {
    title: "Contact Us Inbox",
    description: "View and manage contact messages in your inbox",
  },
};

export default async function ContactUsInboxPage() {
  const currentUser = await getCurrentUser();
  const appSettings = await getAppSettings();
  const messagesResult = await getContactMessages();
  const messages = messagesResult.success ? messagesResult.messages : [];

  return (
    <AdminIframes>
      <PageHeader
        currentUser={currentUser}
        appName={appSettings.appName}
        appLogoUrl={appSettings.appLogoUrl}
      />

      <main>
        <AppAdminHero
          title="Contact Us Inbox"
          subtitle="View and manage all contact messages submitted through the contact form."
          icon={<Inbox className="h-6 w-6 text-primary" />}
        />

        {/* Inbox Content Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <InboxMessagesList initialMessages={messages} />
            </div>
          </div>
        </section>
      </main>

      <PageFooterExtended appName={appSettings.appName} appLogoUrl={appSettings.appLogoUrl} />
    </AdminIframes>
  );
}
