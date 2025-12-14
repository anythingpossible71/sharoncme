"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { PageTemplateCard } from "@/components/admin/PageTemplateCard";
import { AdminDocumentationSection } from "@/components/admin/AdminDocumentationSection";
import { Button } from "@/components/admin-ui/button";
import { Input } from "@/components/admin-ui/input";
import { Card, CardContent } from "@/components/admin-ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/admin-ui/tabs";
import { HelpCircle, Search } from "lucide-react";
import { getTemplatePages } from "@/app/actions/template-pages";
import { logger } from "@/lib/logger";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/admin-ui/tooltip";

type TemplatePage = {
  id: string;
  title: string;
  path: string;
  dev_instructions: string;
  preview_image: string | null;
  page_description: string | null;
  requires_login: boolean;
};

export const dynamic = "force-dynamic";

export default function PagesAndComponentsPage() {
  const [templates, setTemplates] = useState<TemplatePage[]>([]);
  const [showDoc, setShowDoc] = useState(false);
  const [activeTab, setActiveTab] = useState("pages");

  // Components tab state
  const [searchTerm, setSearchTerm] = useState("");
  const [showComponentsDoc, setShowComponentsDoc] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(600);
  const [showHoverAnimation, setShowHoverAnimation] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previousHeightRef = useRef(600);

  useEffect(() => {
    const loadTemplates = async () => {
      const result = await getTemplatePages();
      setTemplates(result.success && result.pages ? result.pages : []);
    };
    loadTemplates();
  }, []);

  // Build the iframe URL based on search settings (for Components tab)
  const iframeUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (searchTerm) {
      params.set("search", searchTerm);
    }

    // Always show previews
    params.set("showpreviews", "true");

    return `/components-library?${params.toString()}`;
  }, [searchTerm]);

  // Listen for height updates from iframe (for Components tab)
  useEffect(() => {
    if (activeTab !== "components") return;

    const handleMessage = (event: MessageEvent) => {
      // Verify the message is from our iframe
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "iframe-height") {
        const newHeight = event.data.height;
        const oldHeight = previousHeightRef.current;
        const changed = newHeight !== oldHeight;

        logger.info(`[IFRAME HEIGHT] URL: ${iframeUrl}`);
        logger.info(`[IFRAME HEIGHT] Content Height: ${newHeight}px`);
        logger.info(
          `[IFRAME HEIGHT] Changed: ${changed ? "YES" : "NO"} ${changed ? `(${oldHeight}px → ${newHeight}px, diff: ${newHeight - oldHeight}px)` : ""}`
        );
        logger.info("---");

        previousHeightRef.current = newHeight;
        setIframeHeight(newHeight);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [iframeUrl, activeTab]);

  // Reset height and request new height when URL changes (for Components tab)
  useEffect(() => {
    if (activeTab !== "components") return;

    logger.info("URL changed to", { iframeUrl });
    // Reset height to allow iframe to recalculate
    setIframeHeight(600);
    previousHeightRef.current = 600;

    // Request height once after iframe loads
    const timer = setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        logger.info("Requesting one-time height for URL", { iframeUrl });
        iframeRef.current.contentWindow.postMessage(
          { type: "request-height-once" },
          window.location.origin
        );
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [iframeUrl, activeTab]);

  // Request initial height when iframe loads (for Components tab)
  const handleIframeLoad = () => {
    logger.info("Iframe loaded - requesting one-time height");
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "request-height-once" },
        window.location.origin
      );
    }
  };

  // Trigger hover animation on page load (for Components tab)
  useEffect(() => {
    if (activeTab !== "components" || showComponentsDoc) return;

    const timer = setTimeout(() => {
      setShowHoverAnimation(true);
      // Fade back after animation
      setTimeout(() => {
        setShowHoverAnimation(false);
      }, 1000);
    }, 500);

    return () => clearTimeout(timer);
  }, [showComponentsDoc, activeTab]);

  // Get left action buttons (help icon) for breadcrumb
  const getLeftActionButtons = () => {
    if (activeTab === "pages" && !showDoc) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDoc(true)}
                className="px-0 hover:bg-transparent translate-y-[1px]"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>What are pages and how you use them?</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    if (activeTab === "components" && !showComponentsDoc) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComponentsDoc(true)}
                className={`px-0 hover:bg-transparent translate-y-[1px] transition-colors duration-1000 ${
                  showHoverAnimation ? "bg-accent text-accent-foreground" : ""
                }`}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>What are components and how to use them?</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return null;
  };

  // Tabs component for breadcrumb
  const tabsComponent = (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="pages">Pages</TabsTrigger>
        <TabsTrigger value="components">Components</TabsTrigger>
      </TabsList>
    </Tabs>
  );

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        sectionName="Pages & Components"
        leftActionButtons={getLeftActionButtons()}
        actionButtons={tabsComponent}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="pages" className="mt-0">
          {/* Instructions Section */}
          {showDoc && (
            <AdminDocumentationSection
              title="What are pages and how you use them?"
              description="In your project you will find a folder called (pages). In it we created a set of common placeholder pages you can use to speed up the building of your app. To preview a page, click the preview icon in the card below. If you want to use one of the page templates in a prompt, simply click the copy path icon in the card and paste it into your prompt."
              promptExamples={[
                "I would like to add a contact us page to my app. Add a link to my app's footer connecting to the page /contact",
                "In the /landing page remove the pricing section",
                "In the /contact page add a 'How did you learn about us?' option with the following options: Google, Facebook, Blog post, Other",
                "Add a section to my admin that lets me edit the team members in the /about page including uploading their images",
              ]}
              defaultExpanded={true}
              onToggle={(isExpanded) => setShowDoc(isExpanded)}
            />
          )}

          {/* Page Template Cards - Responsive grid that wraps on smaller screens */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 300px))",
              width: "100%",
              columnGap: "1.5rem", // Fixed 24px horizontal gap
              rowGap: "1.5rem", // Fixed 24px vertical gap
            }}
          >
            {templates.map((template) => (
              <PageTemplateCard key={template.id} template={template} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="components" className="mt-0">
          {/* Information Section */}
          {showComponentsDoc && (
            <AdminDocumentationSection
              title="What are components and how to use them?"
              description="Components are reusable code elements like buttons and dropdowns or even full blocks like headers, pricing section or hero section. We have embedded some of them in your template pages and you can edit or remove any of them. To use or edit components or blocks simply copy their path from the preview card and describe what you want in your prompt. See examples below:"
              promptExamples={[
                '"Change the background of my components/ui/form.tsx to light green"',
              ]}
              defaultExpanded={true}
              onToggle={(isExpanded) => setShowComponentsDoc(isExpanded)}
            />
          )}

          {/* Search and Filters */}
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search components..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Components Library Iframe */}
          <Card className="p-0 overflow-hidden">
            <iframe
              key={iframeUrl}
              ref={iframeRef}
              src={iframeUrl}
              onLoad={handleIframeLoad}
              className="w-full border-0"
              style={{ height: `${iframeHeight}px`, overflow: "hidden" }}
              title="Components Library"
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
