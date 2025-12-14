"use client";

import { useRef, useEffect } from "react";
import { MediaUploader, MediaUploaderRef } from "@/components/admin/MediaUploader";

export function MediaPageClient() {
  const uploaderRef = useRef<MediaUploaderRef>(null);

  // Listen for custom events to open dialogs
  useEffect(() => {
    const handleRefreshFiles = () => {
      uploaderRef.current?.refreshFiles();
    };

    const handleOpenUploadDialog = () => {
      uploaderRef.current?.openUploadDialog();
    };

    window.addEventListener("refreshFiles", handleRefreshFiles);
    window.addEventListener("openUploadDialog", handleOpenUploadDialog);

    return () => {
      window.removeEventListener("refreshFiles", handleRefreshFiles);
      window.removeEventListener("openUploadDialog", handleOpenUploadDialog);
    };
  }, []);

  return <MediaUploader ref={uploaderRef} />;
}
