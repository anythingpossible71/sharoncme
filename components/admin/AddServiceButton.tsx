"use client";

import { Button } from "@/components/admin-ui/button";
import { Plus } from "lucide-react";

interface AddServiceButtonProps {
  onClick: () => void;
}

export function AddServiceButton({ onClick }: AddServiceButtonProps) {
  return (
    <Button size="sm" onClick={onClick}>
      <Plus className="h-4 w-4 mr-2" />
      Add a service
    </Button>
  );
}
