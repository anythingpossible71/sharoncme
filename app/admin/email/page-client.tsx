"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/admin-ui/tabs";
import { EmailTemplatesView } from "@/components/admin/EmailTemplatesView";
import { EmailConfigForm } from "@/components/admin/EmailConfigForm";
import { Mail, Settings } from "lucide-react";

interface EmailTabsClientProps {
  activeTab: string;
  showTabsOnly?: boolean;
}

export function EmailTabsClient({ activeTab, showTabsOnly = false }: EmailTabsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`/admin/email?${params.toString()}`);
  };

  // Custom tabs list for breadcrumb (hugs content, not stretched)
  const tabsList = (
    <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
      <button
        onClick={() => handleTabChange("templates")}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
          activeTab === "templates"
            ? "bg-background text-foreground shadow-sm"
            : "hover:bg-background/50"
        }`}
      >
        <Mail className="h-4 w-4 mr-2" />
        Email Templates
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
        Email Provider
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
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="provider" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Email Provider
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="templates" className="mt-0">
        <EmailTemplatesView />
      </TabsContent>

      <TabsContent value="provider" className="mt-0">
        <EmailConfigForm />
      </TabsContent>
    </Tabs>
  );
}
