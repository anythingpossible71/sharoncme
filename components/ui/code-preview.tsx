"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div
      className={`relative rounded-lg p-4 border border-slate-700 ${className}`}
      style={{ backgroundColor: "#555555" }}
    >
      <pre className="text-sm text-slate-100 font-mono whitespace-pre-wrap pr-5">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="absolute top-4 right-[10px] h-3.5 w-3.5 hover:bg-slate-800"
        title={copied ? "Copied!" : "Copy code"}
      >
        {copied ? (
          <Check className="h-2.5 w-2.5 text-green-400" />
        ) : (
          <Copy className="h-2.5 w-2.5 text-slate-400" />
        )}
      </Button>
    </div>
  );
}
