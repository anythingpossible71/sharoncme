"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "@/components/admin-ui/card";
import { Trash2, Image as ImageIcon, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface OGImagePreviewProps {
  onUpload: (file: File) => Promise<string | null>;
  onRemove?: () => void;
  onUndo?: () => void;
  currentUrl?: string | null;
  isMarkedForRemoval?: boolean;
  isUploading?: boolean;
  accept?: string;
  maxSize?: number; // in MB
}

export function OGImagePreview({
  onUpload,
  onRemove,
  onUndo,
  currentUrl,
  isMarkedForRemoval = false,
  isUploading = false,
  accept = "image/*",
  maxSize = 10,
}: OGImagePreviewProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Show preview immediately
        const blobUrl = URL.createObjectURL(file);
        setPreviewUrl(blobUrl);

        const url = await onUpload(file);
        if (url) {
          // Update with actual URL from storage
          URL.revokeObjectURL(blobUrl);
          setPreviewUrl(url);
        }
      } catch (error) {
        logger.error("Upload failed", {}, error instanceof Error ? error : undefined);
        setPreviewUrl(null);
      }
    },
    [maxSize, accept, onUpload]
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
      setPreviewUrl(null);
      if (onRemove) {
        onRemove();
      }
    }
  };

  // Update preview when currentUrl changes
  useEffect(() => {
    if (currentUrl) {
      setPreviewUrl(currentUrl);
      setImageLoadError(false); // Reset error when URL changes
    } else {
      setPreviewUrl(null);
      setImageLoadError(false);
    }
  }, [currentUrl]);

  const hasImage = !!previewUrl;

  return (
    <div className="w-full">
      <Card className="overflow-hidden relative">
        {/* Remove/Undo button - positioned at top right of card - show if has image OR marked for removal */}
        {(hasImage || isMarkedForRemoval) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive transition-colors z-10"
            title={isMarkedForRemoval ? "Undo removal" : "Remove image"}
          >
            {isMarkedForRemoval ? <Undo2 className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
          </button>
        )}
        {/* Post Card Skeleton */}
        <div className="p-2 space-y-3">
          {/* Header - Avatar and name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted-foreground/20 flex-shrink-0"></div>
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-muted-foreground/20 rounded-full w-24"></div>
              <div className="h-2 bg-muted-foreground/15 rounded-full w-32"></div>
            </div>
          </div>

          {/* Image Section - Upload trigger and preview */}
          <div
            className={cn(
              "relative w-full aspect-video rounded-lg overflow-hidden border border-input transition-colors",
              hasImage
                ? "cursor-default"
                : isMarkedForRemoval
                  ? "cursor-pointer hover:border-ring"
                  : dragActive
                    ? "bg-accent cursor-pointer"
                    : "cursor-pointer hover:border-ring",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={
              !hasImage
                ? isMarkedForRemoval && onUndo
                  ? (e) => {
                      e.stopPropagation();
                      onUndo();
                    }
                  : openFileDialog
                : undefined
            }
          >
            {hasImage && previewUrl && !imageLoadError ? (
              <img
                src={previewUrl}
                alt="OG:Image preview"
                className="w-full h-full object-cover"
                onError={() => {
                  logger.error("Preview image failed to load", {
                    url: previewUrl,
                    error: "Image load error",
                  });
                  setImageLoadError(true);
                  setPreviewUrl(null);
                }}
                onLoad={() => {
                  setImageLoadError(false);
                  logger.debug("Preview image loaded successfully", { url: previewUrl });
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-muted/30">
                {isMarkedForRemoval ? (
                  <>
                    <Undo2 className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      Image removed - click undo to restore
                    </p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      {isUploading ? "Uploading..." : "Click or drag to upload OG:Image"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This will appear when your site is shared
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

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
