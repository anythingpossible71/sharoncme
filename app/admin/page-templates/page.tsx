"use client";

import { useState } from "react";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { PageTemplateCard } from "@/components/admin/PageTemplateCard";
import { AdminDocumentationSection } from "@/components/admin/AdminDocumentationSection";
import { Button } from "@/components/admin-ui/button";
import { HelpCircle } from "lucide-react";
import { getTemplatePages } from "@/app/actions/template-pages";
import { useEffect } from "react";

// Type matching what getTemplatePages actually returns
interface TemplatePage {
  id: string;
  title: string;
  path: string;
  dev_instructions: string;
  preview_image: string | null;
  page_description: string | null;
  requires_login: boolean;
}

export const dynamic = "force-dynamic";

export default function PageTemplatesPage() {
  const [templates, setTemplates] = useState<TemplatePage[]>([]);
  const [showDoc, setShowDoc] = useState(false);
  const [showHoverAnimation, setShowHoverAnimation] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      const result = await getTemplatePages();
      setTemplates(result.success && result.pages ? result.pages : []);
    };
    loadTemplates();
  }, []);

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
        sectionName="Page Templates"
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
              What are page templates and how you use them?
            </Button>
          ) : null
        }
      />

      {/* Instructions Section */}
      {showDoc && (
        <AdminDocumentationSection
          title="What are page templates and how you use them?"
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

      {/* Page Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <PageTemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
