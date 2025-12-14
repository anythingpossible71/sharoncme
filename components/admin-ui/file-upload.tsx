"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Trash2, Undo2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface FileUploadProps {
  onUpload: (file: File) => Promise<string | null>;
  onRemove?: () => void;
  onUndo?: () => void;
  currentUrl?: string | null;
  isMarkedForRemoval?: boolean;
  isUploading?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  placeholder?: string;
  thumbnailSize?: {
    width: number;
    height: number;
  };
  isDefault?: boolean; // If true, logo cannot be deleted, only replaced
}

export function FileUpload({
  onUpload,
  onRemove,
  onUndo,
  currentUrl,
  isMarkedForRemoval = false,
  isUploading = false,
  accept = "image/*",
  maxSize = 10,
  className,
  placeholder = "Upload a file",
  thumbnailSize: _thumbnailSize = { width: 80, height: 80 },
  isDefault = false,
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

        // Create temporary blob URL for immediate display (will be replaced by resized version)
        const tempBlobUrl = URL.createObjectURL(file);
        setUploadedFile({
          name: file.name,
          size: formatFileSize(file.size),
          url: tempBlobUrl,
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

        // Call onUpload which may resize the image and return a resized blob URL
        const url = await onUpload(file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Update with the URL from onUpload (may be resized blob URL or storage URL)
        // This URL should be used for preview instead of the original blob URL
        if (url) {
          // Revoke the temporary blob URL to free memory
          URL.revokeObjectURL(tempBlobUrl);
          // Use the URL from onUpload (resized) as the preview URL
          setUploadedFile((prev) => (prev ? { ...prev, url: url, realUrl: url } : null));
        } else {
          // If onUpload didn't return a URL, keep the temp blob URL
          // (fallback for components that don't resize)
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
    if (isMarkedForRemoval && onUndo) {
      // If marked for removal, undo instead
      onUndo();
    } else {
      setUploadedFile(null);
      if (onRemove) {
        onRemove();
      }
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
    <div
      className={cn(
        (hasImage && !isMarkedForRemoval) || (isDefault && !isMarkedForRemoval)
          ? "inline-block"
          : "w-full",
        className
      )}
    >
      <div
        className={cn(
          "border border-input rounded-lg transition-colors bg-card",
          hasImage && !isMarkedForRemoval && isDefault
            ? "p-0 pb-0 w-[70px] h-[70px]"
            : hasImage && !isMarkedForRemoval
              ? "p-1"
              : isDefault && !isMarkedForRemoval
                ? "p-0 pb-0 w-[70px] h-[70px]"
                : "p-2",
          isMarkedForRemoval
            ? "hover:border-ring cursor-pointer"
            : dragActive
              ? "border-ring bg-accent cursor-pointer"
              : hasImage && !isMarkedForRemoval && isDefault
                ? "cursor-pointer"
                : "hover:border-ring cursor-pointer",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {hasImage && !isMarkedForRemoval ? (
          /* When image is present - compact view that hugs the image */
          <div className="relative inline-block group w-full h-full">
            {/* Preview Container - 68x68 to account for 1px border on each side (70px total) */}
            <div
              className={cn(
                "w-[68px] h-[68px] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden",
                "cursor-pointer relative",
                isDefault && "group-hover:bg-black/20 transition-colors"
              )}
            >
              {!urlLoadError && previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="App logo"
                    className={cn(
                      "w-full h-full object-contain",
                      isDefault && "group-hover:opacity-60 transition-opacity"
                    )}
                    width={68}
                    height={68}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                    onError={(e) => {
                      logger.error("Image failed to load", { previewUrl });
                      setUrlLoadError(true);
                      e.currentTarget.src = "";
                    }}
                    onLoad={() => {
                      setUrlLoadError(false);
                    }}
                  />
                  {/* Edit icon - shown on hover for default logos */}
                  {isDefault && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Pencil className="h-5 w-5 text-foreground" />
                    </div>
                  )}
                </>
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            {/* Delete button - only show if not default */}
            {!isDefault && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute -top-2 -right-2 p-1 bg-background border border-border rounded-full text-muted-foreground hover:text-destructive transition-colors shadow-sm"
                title="Remove image"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            {/* Progress bar */}
            {isUploading && uploadProgress > 0 && (
              <div className="absolute bottom-0 left-0 right-0">
                <div className="w-full bg-secondary rounded-full h-1">
                  <div
                    className="bg-primary h-1 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : isDefault && !isMarkedForRemoval ? (
          /* When isDefault and no image - show compact upload area without text */
          <div className="relative inline-block group">
            {/* Preview Container - 68x68 to account for 1px border */}
            <div
              className={cn(
                "w-[68px] h-[68px] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden",
                "cursor-pointer relative",
                "group-hover:bg-black/20 transition-colors"
              )}
            >
              <Upload className="h-5 w-5 text-muted-foreground group-hover:opacity-60 transition-opacity" />
            </div>
          </div>
        ) : (
          /* When no image - show placeholder with file info */
          <div className="flex items-center gap-4">
            {/* Preview Container - 36x36px square */}
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden",
                isMarkedForRemoval ? "" : "bg-muted",
                "cursor-pointer"
              )}
            >
              {isMarkedForRemoval ? (
                <Upload className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* File info or upload prompt */}
            <div className="flex-1 min-w-0">
              {isMarkedForRemoval ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Image removed</p>
                    </div>
                    {/* Undo button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onUndo) {
                          onUndo();
                        }
                      }}
                      className="flex-shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors"
                      title="Undo removal"
                    >
                      <Undo2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{placeholder}</p>
              )}
            </div>
          </div>
        )}
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
