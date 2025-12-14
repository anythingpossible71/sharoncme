import { EmailLayoutTabs } from "@/components/admin/EmailLayoutTabs";
import { EmailTabsClient } from "@/app/admin/email/page-client";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Email - Builder Admin",
  description: "Manage email templates and provider configuration",
};

export default async function EmailPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.tab || "templates";

  return (
    <EmailLayoutTabs
      activeTab={activeTab}
      tabsComponent={<EmailTabsClient activeTab={activeTab} showTabsOnly={true} />}
    >
      <EmailTabsClient activeTab={activeTab} />
    </EmailLayoutTabs>
  );
}
