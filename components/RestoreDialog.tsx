"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/admin-ui/button";
import { AlertTriangle } from "lucide-react";

interface RestoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
  currentVersion: number;
  presentVersion: number;
}

export function RestoreDialog({
  isOpen,
  onClose,
  onRestore,
  currentVersion,
  presentVersion,
}: RestoreDialogProps) {
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Restore Version
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Version #{presentVersion} → Version #{currentVersion}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300">
            Restoring this version will undo all the changes we did after it including any changes
            to the database and database data.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} className="px-4 py-2">
            Cancel
          </Button>
          <Button
            onClick={onRestore}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white"
          >
            Restore
          </Button>
        </div>
      </div>
    </>,
    document.body
  );
}
