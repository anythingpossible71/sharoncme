"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/admin-ui/card";
import { Button } from "@/components/admin-ui/button";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { CodePreview } from "@/components/admin/CodePreview";

interface AdminDocumentationSectionProps {
  title: string;
  description: string;
  promptExamples?: string[];
  defaultExpanded?: boolean;
  onToggle?: (isExpanded: boolean) => void;
}

export function AdminDocumentationSection({
  title,
  description,
  promptExamples = [],
  defaultExpanded = false,
  onToggle,
}: AdminDocumentationSectionProps) {
  const [showContent, setShowContent] = useState(defaultExpanded);
  const [showAllExamples, setShowAllExamples] = useState(true);

  // Update showContent when defaultExpanded prop changes
  useEffect(() => {
    setShowContent(defaultExpanded);
  }, [defaultExpanded]);

  // Notify parent when visibility changes
  useEffect(() => {
    onToggle?.(showContent);
  }, [showContent, onToggle]);

  // If collapsed, don't render anything
  if (!showContent) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowContent(false)}
            className="h-8 w-8"
            title="Close documentation"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground">{description}</p>

          {promptExamples.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                {promptExamples.length === 1 ? "Example prompt:" : "Example prompts:"}
              </p>
              <div className="space-y-3">
                {promptExamples.length === 1 ? (
                  <CodePreview code={promptExamples[0]} />
                ) : (
                  <>
                    <CodePreview code={promptExamples[0]} />
                    {showAllExamples && (
                      <div className="space-y-3">
                        {promptExamples.slice(1).map((prompt, index) => (
                          <CodePreview key={index + 1} code={prompt} />
                        ))}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllExamples(!showAllExamples)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {showAllExamples ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Show fewer examples
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Show more examples
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
