"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, PartyPopper } from "lucide-react";

interface AlreadyPublishedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  publishUrl: string;
}

export function AlreadyPublishedDialog({
  isOpen,
  onClose,
  publishUrl,
}: AlreadyPublishedDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <PartyPopper className="h-6 w-6 text-primary" />
            <DialogTitle>Your project is already published 🎉</DialogTitle>
          </div>
          <DialogDescription>
            No changes detected. Your latest version is already live.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <a
            href={publishUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-base font-medium text-primary hover:underline transition-colors"
          >
            {publishUrl}
            <ExternalLink className="h-4 w-4" />
          </a>
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
