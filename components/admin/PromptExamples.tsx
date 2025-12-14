"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/admin-ui/button";
import { CodePreview } from "@/components/admin/CodePreview";

const promptExamples = [
  "I would like to add a contact us page to my app. Add a link to my app's footer connecting to the page /contact",
  "In the /landing page remove the pricing section",
  "In the /contact page add a 'How did you learn about us?' option with the following options: Google, Facebook, Blog post, Other",
  "Add a section to my admin that lets me edit the team members in the /about page including uploading their images",
];

export function PromptExamples() {
  const [showAll, setShowAll] = useState(false);

  const displayedExamples = showAll ? promptExamples : [promptExamples[0]];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Example prompts:</p>

      <div className="space-y-3">
        {displayedExamples.map((prompt, index) => (
          <CodePreview key={index} code={prompt} />
        ))}
      </div>

      {promptExamples.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          {showAll ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Show less examples
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Show more examples ({promptExamples.length - 1} more)
            </>
          )}
        </Button>
      )}
    </div>
  );
}
