"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { Archive, X } from "lucide-react";

// Mock snapshot data for display
const mockSnapshotData: Record<string, { title: string; date: string }> = {
  "snapshot-001": {
    title: "Homepage v2.1",
    date: "January 15, 2024 at 10:30 AM",
  },
  "snapshot-002": {
    title: "Dashboard Layout",
    date: "January 14, 2024 at 3:45 PM",
  },
  "snapshot-003": {
    title: "Mobile Checkout Flow",
    date: "January 13, 2024 at 9:20 AM",
  },
  "snapshot-004": {
    title: "Settings Page Redesign",
    date: "January 12, 2024 at 2:15 PM",
  },
  "snapshot-005": {
    title: "Landing Page A/B Test",
    date: "January 11, 2024 at 11:00 AM",
  },
  "snapshot-006": {
    title: "Admin Panel v1.8",
    date: "January 10, 2024 at 4:30 PM",
  },
};

export function SnapshotHeader() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const snapshotId = searchParams.get("snapshotid");

  // Don't show on header-iframe or sidebar-iframe pages
  if (pathname === "/admin/header-iframe" || pathname === "/admin/sidebar-iframe") {
    return null;
  }

  if (!snapshotId) {
    return null;
  }

  const snapshotData = mockSnapshotData[snapshotId] || {
    title: "Unknown Snapshot",
    date: "Unknown Date",
  };

  const handleClose = () => {
    // Remove the snapshotid parameter from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("snapshotid");
    window.history.replaceState({}, "", url.toString());
    // Reload to remove the header
    window.location.reload();
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <Archive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                You are viewing a snapshot from {snapshotData.date}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Snapshot: {snapshotData.title}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
            aria-label="Close snapshot view"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
