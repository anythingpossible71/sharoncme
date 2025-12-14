"use client";

import { Button } from "@/components/admin-ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface PromptCopyButtonProps {
  text: string;
}

export function PromptCopyButton({ text }: PromptCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="absolute top-2 right-2 h-7 w-7"
      title={copied ? "Copied!" : "Copy prompt"}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}
