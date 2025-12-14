"use client";

import { useEffect, useState } from "react";
import { AddServiceButton } from "./AddServiceButton";

interface WindowWithDialog extends Window {
  __openAddServiceDialog?: () => void;
}

export function AddServiceButtonWrapper() {
  const [openDialog, setOpenDialog] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Check if the dialog opener function is available
    const checkDialog = () => {
      const win = window as WindowWithDialog;
      if (win.__openAddServiceDialog) {
        setOpenDialog(() => win.__openAddServiceDialog!);
      } else {
        // Retry after a short delay if not ready yet
        setTimeout(checkDialog, 100);
      }
    };
    checkDialog();
  }, []);

  const handleClick = () => {
    if (openDialog) {
      openDialog();
    }
  };

  return <AddServiceButton onClick={handleClick} />;
}
