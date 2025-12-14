import { StorageLayoutTabs } from "@/components/admin/StorageLayoutTabs";
import { StorageTabsClient } from "@/app/admin/storage/page-client";

// Force dynamic rendering for Docker builds
export const dynamic = "force-dynamic";

export default async function StoragePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.tab || "media";

  return (
    <StorageLayoutTabs
      activeTab={activeTab}
      tabsComponent={<StorageTabsClient activeTab={activeTab} showTabsOnly={true} />}
    >
      <StorageTabsClient activeTab={activeTab} />
    </StorageLayoutTabs>
  );
}
