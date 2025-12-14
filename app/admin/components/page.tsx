"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/admin-ui/card";
import { Button } from "@/components/admin-ui/button";
import { Input } from "@/components/admin-ui/input";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminDocumentationSection } from "@/components/admin/AdminDocumentationSection";
import { Search, HelpCircle } from "lucide-react";
import { logger } from "@/lib/logger";

export default function AdminComponentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDoc, setShowDoc] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(600);
  const [showHoverAnimation, setShowHoverAnimation] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previousHeightRef = useRef(600);

  // Build the iframe URL based on search settings
  const iframeUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (searchTerm) {
      params.set("search", searchTerm);
    }

    // Always show previews
    params.set("showpreviews", "true");

    return `/components-library?${params.toString()}`;
  }, [searchTerm]);

  // Listen for height updates from iframe
  useEffect(() => {
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
  }, [iframeUrl]);

  // Reset height and request new height when URL changes (one-time only)
  useEffect(() => {
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
  }, [iframeUrl]);

  // Request initial height when iframe loads (one-time only)
  const handleIframeLoad = () => {
    logger.info("Iframe loaded - requesting one-time height");
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "request-height-once" },
        window.location.origin
      );
    }
  };

  // Trigger hover animation on page load
  useEffect(() => {
    if (!showDoc) {
      const timer = setTimeout(() => {
        setShowHoverAnimation(true);
        // Fade back after animation
        setTimeout(() => {
          setShowHoverAnimation(false);
        }, 1000);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [showDoc]);

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        sectionName="Component Templates"
        actionButtons={
          !showDoc ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDoc(true)}
              className={`flex items-center gap-2 transition-colors duration-1000 ${
                showHoverAnimation ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              What are components and how to use them?
            </Button>
          ) : null
        }
      />

      {/* Information Section */}
      {showDoc && (
        <AdminDocumentationSection
          title="What are components and how to use them?"
          description="Components are reusable code elements like buttons and dropdowns or even full blocks like headers, pricing section or hero section. We have embedded some of them in your template pages and you can edit or remove any of them. To use or edit components or blocks simply copy their path from the preview card and describe what you want in your prompt. See examples below:"
          promptExamples={['"Change the background of my components/ui/form.tsx to light green"']}
          defaultExpanded={true}
          onToggle={(isExpanded) => setShowDoc(isExpanded)}
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
    </div>
  );
}
