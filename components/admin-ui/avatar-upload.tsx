"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { MediaPicker } from "@/components/admin-ui/media-picker";

interface AvatarUploadProps {
  onUpload: (file: File) => Promise<string | null>;
  onUrlSelect?: (url: string) => void; // Optional callback when URL is selected directly (for library files)
  onFileSelect?: (file: File) => void; // Optional callback when file is selected (for crop dialog)
  currentUrl?: string | null;
  isUploading?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  name?: string; // For generating initials
}

// Generate initials from name
function getInitials(name: string): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function AvatarUpload({
  onUpload,
  onUrlSelect,
  onFileSelect,
  currentUrl,
  isUploading = false,
  accept = "image/*",
  maxSize = 5,
  className,
  name = "",
}: AvatarUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const [urlLoadError, setUrlLoadError] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync currentUrl with previewUrl
  useEffect(() => {
    if (currentUrl) {
      setPreviewUrl(currentUrl);
      setUrlLoadError(false);
    } else {
      setPreviewUrl(null);
    }
  }, [currentUrl]);

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
    (file: File) => {
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

      // If onFileSelect callback is provided, use it (for external crop dialog)
      if (onFileSelect) {
        onFileSelect(file);
        return;
      }

      // Otherwise, open media picker
      setMediaPickerOpen(true);
    },
    [maxSize, accept, onFileSelect]
  );

  const handleMediaSelect = useCallback(
    async (url: string) => {
      try {
        setUrlLoadError(false);
        setPreviewUrl(url);

        // If URL is from our storage, use it directly (no need to re-upload)
        if (url.startsWith("/api/storage/files/") || url.includes("/api/storage/files/")) {
          if (onUrlSelect) {
            onUrlSelect(url);
          } else if (onUpload) {
            // Fallback: fetch and upload if onUrlSelect not provided
            const response = await fetch(url);
            if (response.ok) {
              const blob = await response.blob();
              const file = new File([blob], "avatar.png", { type: blob.type || "image/png" });
              await onUpload(file);
            }
          }
        } else {
          // External URL - fetch and upload
          if (onUpload) {
            setUploadProgress(10);

            const response = await fetch(url);
            if (!response.ok) {
              throw new Error("Failed to fetch image");
            }

            const blob = await response.blob();
            const file = new File([blob], "avatar.png", { type: blob.type || "image/png" });

            // Simulate progress
            const progressInterval = setInterval(() => {
              setUploadProgress((prev) => {
                if (prev >= 90) {
                  clearInterval(progressInterval);
                  return 90;
                }
                return prev + 10;
              });
            }, 100);

            const uploadedUrl = await onUpload(file);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (uploadedUrl) {
              setPreviewUrl(uploadedUrl);
            }

            setTimeout(() => setUploadProgress(0), 1000);
          }
        }
      } catch (error) {
        logger.error("Failed to load media", {}, error instanceof Error ? error : undefined);
        setUrlLoadError(true);
        setUploadProgress(0);
        setPreviewUrl(currentUrl || null);
      }
    },
    [onUpload, onUrlSelect, currentUrl]
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

  const hasImage = !!previewUrl && !urlLoadError;
  const initials = getInitials(name);

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative w-24 h-24 rounded-full overflow-hidden border-2 transition-colors",
          dragActive
            ? "border-primary bg-primary/10 cursor-pointer"
            : "border-border hover:border-primary/50 cursor-pointer",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => setMediaPickerOpen(true)}
      >
        {hasImage ? (
          <>
            <img
              src={previewUrl!}
              alt={name || "Avatar"}
              className="w-full h-full object-cover"
              onError={(e) => {
                logger.error("Image failed to load", { previewUrl });
                setUrlLoadError(true);
                e.currentTarget.src = "";
              }}
              onLoad={() => {
                setUrlLoadError(false);
              }}
            />
            {/* Upload overlay on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="h-6 w-6 text-white" />
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-2xl font-semibold text-muted-foreground">{initials}</span>
          </div>
        )}

        {/* Progress bar */}
        {isUploading && uploadProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
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

      {/* Media Picker Dialog */}
      <MediaPicker
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleMediaSelect}
        accept={accept}
        folder="team"
        title="Select Avatar"
      />
    </div>
  );
}
