"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/admin-ui/button";

interface CodePreviewProps {
  code: string;
  className?: string;
}

export function CodePreview({ code, className = "" }: CodePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative rounded-lg p-4 border border-border bg-muted ${className}`}>
      <pre className="text-sm text-foreground font-mono whitespace-pre-wrap pr-5">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="absolute top-4 right-[10px] h-3.5 w-3.5 hover:bg-muted/80"
        title={copied ? "Copied!" : "Copy code"}
      >
        {copied ? (
          <Check className="h-2.5 w-2.5 text-primary" />
        ) : (
          <Copy className="h-2.5 w-2.5 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
