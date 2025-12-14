"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/admin-ui/tabs";
import { MediaPageClient } from "@/app/admin/storage/media/page-client";
import { StorageConfigForm } from "@/components/admin/StorageConfigForm";
import { Upload, Settings } from "lucide-react";

interface StorageTabsClientProps {
  activeTab: string;
  showTabsOnly?: boolean;
}

export function StorageTabsClient({ activeTab, showTabsOnly = false }: StorageTabsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`/admin/storage?${params.toString()}`);
  };

  // Custom tabs list for breadcrumb (hugs content, not stretched)
  const tabsList = (
    <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
      <button
        onClick={() => handleTabChange("media")}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
          activeTab === "media"
            ? "bg-background text-foreground shadow-sm"
            : "hover:bg-background/50"
        }`}
      >
        <Upload className="h-4 w-4 mr-2" />
        Media
      </button>
      <button
        onClick={() => handleTabChange("provider")}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
          activeTab === "provider"
            ? "bg-background text-foreground shadow-sm"
            : "hover:bg-background/50"
        }`}
      >
        <Settings className="h-4 w-4 mr-2" />
        Storage Provider
      </button>
    </div>
  );

  if (showTabsOnly) {
    // Just render the tabs list for the breadcrumb
    return tabsList;
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      {/* TabsList is rendered in breadcrumb, so hide it here */}
      <div className="hidden">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Media
          </TabsTrigger>
          <TabsTrigger value="provider" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Storage Provider
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="media" className="mt-0">
        <MediaPageClient />
      </TabsContent>

      <TabsContent value="provider" className="mt-0">
        <StorageConfigForm />
      </TabsContent>
    </Tabs>
  );
}
