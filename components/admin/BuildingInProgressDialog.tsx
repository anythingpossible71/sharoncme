import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface BuildingInProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  state: "building" | "deploying";
}

export function BuildingInProgressDialog({
  isOpen,
  onClose,
  state,
}: BuildingInProgressDialogProps) {
  const title = state === "deploying" ? "Deploying in progress" : "Building in progress";
  const description =
    state === "deploying"
      ? "We are deploying your project. It may take a few minutes. Please wait."
      : "We are building the project. It may take a few minutes. Please wait.";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
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
