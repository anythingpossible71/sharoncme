import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface NoPublishedVersionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NoPublishedVersionDialog({ isOpen, onClose }: NoPublishedVersionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-6 w-6 text-amber-500" />
            <DialogTitle>No published versions yet</DialogTitle>
          </div>
          <DialogDescription>
            There are no published versions yet. Publish your project to see it live.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
