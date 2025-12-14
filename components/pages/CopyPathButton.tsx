"use client";

import { Button } from "@/components/admin-ui/button";
import { Copy } from "lucide-react";

interface CopyPathButtonProps {
  path: string;
}

export function CopyPathButton({ path }: CopyPathButtonProps) {
  const copyPathToClipboard = () => {
    navigator.clipboard.writeText(path);
  };

  return (
    <Button variant="ghost" size="sm" onClick={copyPathToClipboard} className="h-8 w-8 p-0">
      <Copy className="h-4 w-4" />
    </Button>
  );
}
