"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/admin-ui/card";
import { Button } from "@/components/admin-ui/button";
import { Badge } from "@/components/admin-ui/badge";
import { Copy, Lock, Check, ExternalLink, Info } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/admin-ui/tooltip";

interface TemplatePageProps {
  template: {
    id: string;
    title: string;
    path: string;
    dev_instructions: string;
    preview_image: string | null;
    page_description: string | null;
    requires_login: boolean;
  };
}

export function PageTemplateCard({ template }: TemplatePageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(template.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Add mode=temp-full-screen parameter to iframe URL
  const getIframeUrl = (path: string) => {
    const url = new URL(path, window.location.origin);
    url.searchParams.set("mode", "temp-full-screen");
    return url.pathname + url.search;
  };

  // Parse dev instructions for links
  const renderInstructions = (text: string) => {
    // Replace "admin components library" with link
    const componentsLibraryLink = text.replace(
      /admin components library/gi,
      '<a href="/admin/components" class="text-primary hover:underline">admin components library</a>'
    );

    // Replace "admin database viewer" with link
    const databaseViewerLink = componentsLibraryLink.replace(
      /admin database viewer/gi,
      '<a href="/admin/database" class="text-primary hover:underline">admin database viewer</a>'
    );

    return <span dangerouslySetInnerHTML={{ __html: databaseViewerLink }} />;
  };

  const descriptionText = template.page_description || template.dev_instructions;

  return (
    <Card className="group" style={{ minWidth: "250px", maxWidth: "300px", padding: "10px" }}>
      <CardHeader style={{ padding: "10px" }}>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">
            <a
              href={template.path}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline cursor-pointer"
            >
              {template.title}
            </a>
          </CardTitle>
          <div className="flex items-center gap-1">
            {template.requires_login && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-muted"
                      aria-label="Requires login"
                    >
                      <Lock className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Requires login</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-muted"
                    aria-label={descriptionText || "Page information"}
                  >
                    <Info className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm text-muted-foreground">
                    {descriptionText || "No description available"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4" style={{ padding: "10px" }}>
        {/* Preview Iframe - Clickable, full width, auto height */}
        {/* <a href={template.path} target="_blank" rel="noopener noreferrer" className="block w-full">
          <div
            className="bg-muted rounded-md overflow-hidden border-2 border-border/80 relative"
            style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden" }}
          >
            <iframe
              src={getIframeUrl(template.path)}
              className="w-full h-full border-0"
              style={{
                transform: "scale(0.2)",
                transformOrigin: "top left",
                width: "500%",
                height: "500%",
                overflow: "hidden",
                display: "block",
              }}
              title={`${template.title} preview`}
              sandbox="allow-same-origin allow-scripts"
              scrolling="no"
            />
          </div>
        </a> */}

        {/* Path Display with Copy and Open Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded px-3 py-2 border">
            <code className="font-mono text-sm text-foreground flex-1">{template.path}</code>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="h-6 w-6 hover:bg-muted"
                    aria-label={copied ? "Copied!" : "Copy path"}
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{copied ? "Copied!" : "Copy path"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(template.path, "_blank", "noopener,noreferrer")}
                    className="h-6 w-6 hover:bg-muted"
                    aria-label="Open in new tab"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Open in new tab</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
