"use client";

import { Button } from "@/components/admin-ui/button";
import { Checkbox } from "@/components/admin-ui/checkbox";
import { Label } from "@/components/admin-ui/label";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface UnsavedChangesContentProps {
  onPromptRun?: () => void;
  onCancel?: () => void;
}

const PROMPT_TEXT = "push latest changes";

export function UnsavedChangesContent({ onPromptRun, onCancel }: UnsavedChangesContentProps) {
  const [copied, setCopied] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const { toast } = useToast();

  const handleCopyPrompt = async () => {
    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(PROMPT_TEXT);
      setCopied(true);

      // Trigger Cursor deeplink
      const deeplink = `cursor://anysphere.cursor-deeplink/prompt?text=${encodeURIComponent(PROMPT_TEXT)}`;
      window.location.href = deeplink;

      toast({
        title: "Prompt copied",
        description: "Opening Cursor prompt...",
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-lg font-semibold mb-2">You have unsaved changes</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Please push your latest changes to production before publishing. Use this prompt to push
          your code to production.
        </p>

        <div className="mb-6">
          <div className="bg-muted rounded-lg p-4 font-mono text-sm flex items-center justify-between">
            <code className="flex-1">{PROMPT_TEXT}</code>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyPrompt}
              className="ml-4 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy prompt
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox
              id="confirm-prompt"
              checked={isChecked}
              onCheckedChange={(checked) => setIsChecked(checked === true)}
              className="border-muted-foreground data-[state=checked]:border-primary"
            />
            <Label
              htmlFor="confirm-prompt"
              className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I run the &quot;{PROMPT_TEXT}&quot; prompt
            </Label>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-auto pt-4 border-t">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={() => {
            onPromptRun?.();
          }}
          disabled={!isChecked}
          className="flex-1"
        >
          Publish
        </Button>
      </div>
    </div>
  );
}

// Alias for backward compatibility
export { UnsavedChangesContent as UnsavedChangesDialog };
