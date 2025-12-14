"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface FileUploadProps {
  onUpload: (file: File) => Promise<string | null>;
  onRemove?: () => void;
  currentUrl?: string | null;
  isUploading?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  placeholder?: string;
  thumbnailSize?: {
    width: number;
    height: number;
  };
}

export function FileUpload({
  onUpload,
  onRemove,
  currentUrl,
  isUploading = false,
  accept = "image/*",
  maxSize = 10,
  className,
  placeholder = "Upload a file",
  thumbnailSize: _thumbnailSize = { width: 80, height: 80 },
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    url: string;
    realUrl?: string; // Storage URL after upload
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File size must be less than ${maxSize}MB`);
        return;
      }

      // Validate file type
      if (accept && !file.type.match(accept.replace("*", ".*"))) {
        alert(`File type not supported. Please upload a ${accept} file.`);
        return;
      }

      try {
        // Reset error state when new file is selected
        setUrlLoadError(false);
        setUploadProgress(0);
        setUploadedFile({
          name: file.name,
          size: formatFileSize(file.size),
          url: URL.createObjectURL(file),
        });

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        const url = await onUpload(file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Update with actual URL if provided (from storage)
        // Store the real URL separately from the blob URL
        if (url) {
          setUploadedFile((prev) => (prev ? { ...prev, realUrl: url } : null));
          // Keep blob URL for now, parent will update currentUrl
        }

        // Reset progress after a short delay
        setTimeout(() => setUploadProgress(0), 1000);
      } catch (error) {
        logger.error("Upload failed", {}, error instanceof Error ? error : undefined);
        setUploadProgress(0);
        setUploadedFile(null);
      }
    },
    [maxSize, accept, onUpload, formatFileSize]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setUploadedFile(null);
    if (onRemove) {
      onRemove();
    }
  };

  // Track if the real URL failed to load
  const [urlLoadError, setUrlLoadError] = useState(false);

  // Sync currentUrl with uploadedFile when it's updated from parent
  // Also handle case where currentUrl exists but no uploadedFile (loaded from database)
  useEffect(() => {
    if (currentUrl && typeof currentUrl === "string") {
      // If we have a currentUrl from parent (after upload or from database)
      if (uploadedFile) {
        // Update with real URL, keep blob URL as fallback
        setUploadedFile((prev) => (prev ? { ...prev, realUrl: currentUrl } : null));
      } else {
        // If we have currentUrl but no uploadedFile, this means it's loaded from database
        // Create a minimal uploadedFile entry so the image displays
        setUploadedFile({
          name: "Current file",
          size: "",
          url: currentUrl, // Use currentUrl as the display URL
          realUrl: currentUrl,
        });
      }
      setUrlLoadError(false); // Reset error state when new URL is set
    } else if (
      !currentUrl &&
      uploadedFile &&
      uploadedFile.url &&
      !uploadedFile.url.startsWith("blob:")
    ) {
      // If currentUrl is cleared (removed), clear uploadedFile if it's not a blob
      setUploadedFile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUrl]);

  // Simple logic:
  // - Has image: currentUrl (from database) OR uploadedFile with real URL (just uploaded) OR blob URL (during upload)
  // - No image: show placeholder

  // Preview URL priority:
  // 1. uploadedFile.url (blob URL - show immediately when file is selected)
  // 2. uploadedFile.realUrl (just uploaded, storage URL)
  // 3. currentUrl (from database) if not failed
  // 4. null (show placeholder)
  const previewUrl = uploadedFile?.url
    ? uploadedFile.url
    : uploadedFile?.realUrl || (currentUrl && !urlLoadError ? currentUrl : null);

  // Display URL: Only show if it's a real storage URL (not blob)
  const displayUrl =
    currentUrl && !urlLoadError && typeof currentUrl === "string"
      ? currentUrl
      : uploadedFile?.realUrl && typeof uploadedFile.realUrl === "string"
        ? uploadedFile.realUrl
        : null;

  const displayName = uploadedFile?.name || "";
  const displaySize = uploadedFile?.size || "";

  // Simple check: do we have an image to show?
  const hasImage = !!previewUrl;

  // Truncate URL for display
  const truncateUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    const start = url.substring(0, 15);
    const end = url.substring(url.length - 20);
    return `${start}...${end}`;
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-colors",
          hasImage
            ? "border-gray-200 dark:border-gray-700 cursor-default"
            : dragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950 cursor-pointer"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!hasImage ? openFileDialog : undefined}
      >
        <div className="flex items-center gap-4">
          {/* Preview Container - 36x36px square */}
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden",
              hasImage && !urlLoadError && previewUrl ? "" : "bg-muted"
            )}
          >
            {hasImage && !urlLoadError && previewUrl ? (
              <img
                src={previewUrl}
                alt={displayName || "Preview"}
                className={cn(
                  "w-full h-full max-w-full max-h-full",
                  previewUrl.toLowerCase().endsWith(".svg") ? "object-contain" : "object-cover"
                )}
                style={{ maxWidth: "100%", maxHeight: "100%" }}
                onError={(e) => {
                  // If image fails to load, show placeholder but keep metadata so user can remove it
                  logger.error("Image failed to load", { previewUrl });
                  setUrlLoadError(true);
                  // Clear the src to prevent repeated error attempts
                  e.currentTarget.src = "";
                }}
                onLoad={() => {
                  // Image loaded successfully
                  setUrlLoadError(false);
                }}
              />
            ) : (
              <Upload className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          {/* File info or upload prompt */}
          <div className="flex-1 min-w-0">
            {hasImage ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {displayName}
                    </p>
                    {displaySize && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{displaySize}</p>
                    )}
                    {/* Only show URL if it's a real storage URL (not a blob URL) */}
                    {displayUrl &&
                      typeof displayUrl === "string" &&
                      !displayUrl.startsWith("blob:") && (
                        <p
                          className="text-xs text-gray-500 dark:text-gray-400 truncate"
                          title={displayUrl}
                        >
                          {truncateUrl(displayUrl)}
                        </p>
                      )}
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Progress bar */}
                {isUploading && uploadProgress > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">{placeholder}</p>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}
