"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin-ui/dialog";
import { Button } from "@/components/admin-ui/button";
import { Input } from "@/components/admin-ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/admin-ui/tabs";
import { Search, Upload, Link as LinkIcon, Loader2, Check, X, Crop } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";
import { ImageCropDialog } from "@/components/admin-ui/image-crop-dialog";

interface FileInfo {
  name: string;
  path: string;
  size: number;
  lastModified: string;
  contentType: string;
  visibility: "public" | "private";
  url?: string;
}

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  accept?: string;
  folder?: string;
  title?: string;
}

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  accept = "image/*",
  folder = "",
  title = "Select Media",
}: MediaPickerProps) {
  const [activeTab, setActiveTab] = useState<"library" | "url" | "upload">("library");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [flashingFile, setFlashingFile] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [uploadProgressMap, setUploadProgressMap] = useState<Map<string, number>>(new Map());
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map());
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [fileToCrop, setFileToCrop] = useState<File | null>(null);
  const [croppedFileBlob, setCroppedFileBlob] = useState<Blob | null>(null);
  const [uploadedFileMap, setUploadedFileMap] = useState<Map<string, File>>(new Map()); // Store original File objects for uploaded files
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const pageSize = 20;

  // Load files from API
  const loadFiles = useCallback(
    async (page = 1, resetFiles = false) => {
      try {
        setIsLoading(true);
        const offset = (page - 1) * pageSize;
        const params = new URLSearchParams({
          limit: pageSize.toString(),
          offset: offset.toString(),
        });

        if (searchTerm) {
          params.append("search", searchTerm);
        }

        const response = await fetch(`/api/admin/media/files?${params}`);
        const data = await response.json();

        if (response.ok) {
          const newFiles = data.files || [];
          if (resetFiles) {
            setFiles(newFiles);
          } else {
            setFiles((prevFiles) => [...prevFiles, ...newFiles]);
          }
          setHasMore(data.hasMore || false);
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to load files",
            variant: "destructive",
          });
        }
      } catch (error) {
        logger.error("Error loading files", {}, error instanceof Error ? error : undefined);
        toast({
          title: "Error",
          description: "Failed to load files",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, pageSize, toast]
  );

  // Load files when dialog opens or search changes
  useEffect(() => {
    if (open && activeTab === "library") {
      console.log(
        "📂 [EFFECT] Loading files, current files count:",
        files.length,
        "uploading:",
        uploadingFiles.size
      );
      // Only clear files if we're not currently uploading (to preserve uploading files)
      // Also check if files array is empty or if search term changed
      const shouldReload = uploadingFiles.size === 0 && (files.length === 0 || searchTerm);
      if (shouldReload) {
        console.log("📂 [EFFECT] Clearing and reloading files");
        setCurrentPage(1);
        setFiles([]);
        loadFiles(1, true);
      } else if (uploadingFiles.size > 0) {
        console.log(
          "⏸️ [EFFECT] Skipping file load - files are uploading, preserving:",
          files.length,
          "files"
        );
      }
    }
  }, [open, activeTab, searchTerm, loadFiles]);

  // Debug: Log files changes
  useEffect(() => {
    console.log("📋 [FILES STATE] Files updated, count:", files.length);
    if (files.length > 0) {
      console.log("📋 [FILES STATE] First file:", {
        name: files[0].name,
        path: files[0].path,
        url: files[0].url,
        contentType: files[0].contentType,
      });
    }
  }, [files]);

  // Debug: Log uploading files changes
  useEffect(() => {
    console.log("⏳ [UPLOADING STATE] Uploading files:", Array.from(uploadingFiles));
    console.log("⏳ [UPLOADING STATE] Upload progress map:", Object.fromEntries(uploadProgressMap));
  }, [uploadingFiles, uploadProgressMap]);

  // Load more files when scrolling
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
      if (scrollBottom < 100 && hasMore && !isLoading && activeTab === "library") {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        loadFiles(nextPage, false);
      }
    },
    [hasMore, isLoading, currentPage, loadFiles, activeTab]
  );

  // Handle file selection from library
  const handleFileSelect = (file: FileInfo) => {
    setSelectedFile(file);
  };

  // Handle URL input
  const handleUrlSubmit = () => {
    const trimmedUrl = urlInput.trim();
    if (trimmedUrl) {
      // Validate URL format
      try {
        new URL(trimmedUrl);
        onSelect(trimmedUrl);
        onOpenChange(false);
        setUrlInput("");
        setSelectedFile(null);
      } catch {
        toast({
          title: "Error",
          description: "Please enter a valid URL",
          variant: "destructive",
        });
      }
    }
  };

  // Handle file upload
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    // Validate file type
    if (accept && !file.type.match(accept.replace("*", ".*"))) {
      toast({
        title: "Error",
        description: `File type not supported. Please upload a ${accept} file.`,
        variant: "destructive",
      });
      return;
    }

    console.log("🚀 [UPLOAD START] File selected:", file.name, file.type, file.size);

    setIsUploading(true);
    setUploadProgress(0);

    // Create a temporary file path for the uploading file
    const tempPath = `uploading-${Date.now()}-${file.name}`;
    console.log("📝 [UPLOAD STATE] Created tempPath:", tempPath);

    // Store the original File object for potential cropping
    setUploadedFileMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(tempPath, file);
      return newMap;
    });

    // Create a preview URL from the file object so we can show the image while uploading
    const previewUrl = URL.createObjectURL(file);
    console.log("🖼️ [UPLOAD STATE] Created preview URL:", previewUrl);

    const tempFile: FileInfo = {
      name: file.name,
      path: tempPath,
      size: file.size,
      lastModified: new Date().toISOString(),
      contentType: file.type,
      visibility: "public",
      url: previewUrl, // Use preview URL so image displays during upload
    };
    console.log("📦 [UPLOAD STATE] Created tempFile:", tempFile);

    // Store preview URL for cleanup later
    setPreviewUrls((prev) => {
      const newMap = new Map(prev);
      newMap.set(tempPath, previewUrl);
      console.log("💾 [UPLOAD STATE] Stored preview URL, total:", newMap.size);
      return newMap;
    });

    // Add to uploading files set and show in library immediately
    setUploadingFiles((prev) => {
      const newSet = new Set(prev);
      newSet.add(tempPath);
      console.log("⏳ [UPLOAD STATE] Added to uploadingFiles, total:", newSet.size);
      return newSet;
    });

    setUploadProgressMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(tempPath, 0);
      console.log("📊 [UPLOAD STATE] Set progress to 0%, total:", newMap.size);
      return newMap;
    });

    // Add uploaded file to the beginning of the list FIRST (before switching tabs)
    // This prevents the useEffect from clearing it when we switch tabs
    setFiles((prevFiles) => {
      const newFiles = [tempFile, ...prevFiles];
      console.log("📋 [UPLOAD STATE] Added file to list, total files:", newFiles.length);
      console.log("📋 [UPLOAD STATE] First file in list:", newFiles[0]);
      return newFiles;
    });

    // Switch to library tab to show the uploading file (after adding file)
    console.log("🔄 [UPLOAD STATE] Switching to library tab");
    // Use setTimeout to ensure file is added before tab switch triggers useEffect
    setTimeout(() => {
      setActiveTab("library");
    }, 0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("visibility", "public");
    if (folder) {
      formData.append("folder", folder);
    }

    try {
      // Set initial progress to show upload has started
      setUploadProgressMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(tempPath, 10);
        console.log("📈 [UPLOAD PROGRESS] Upload started: 10%");
        return newMap;
      });

      // Do the actual upload
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      // Set progress to 100% when upload completes
      setUploadProgressMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(tempPath, 100);
        console.log("✅ [UPLOAD COMPLETE] Progress set to 100%");
        return newMap;
      });

      const result = await response.json();
      console.log("📥 [UPLOAD RESPONSE] Received response:", result);

      if (response.ok) {
        const uploadedUrl = result.url || result.filePath;
        const uploadedFilePath = result.filePath;

        // Create file info for the uploaded file
        const uploadedFile: FileInfo = {
          name: result.fileName || file.name,
          path: uploadedFilePath,
          size: result.size || file.size,
          lastModified: new Date().toISOString(),
          contentType: file.type,
          visibility: result.visibility || "public",
          url: uploadedUrl,
        };

        // Revoke the preview URL to free memory
        const previewUrlToRevoke = previewUrls.get(tempPath);
        if (previewUrlToRevoke) {
          URL.revokeObjectURL(previewUrlToRevoke);
          setPreviewUrls((prev) => {
            const newMap = new Map(prev);
            newMap.delete(tempPath);
            return newMap;
          });
        }

        // Remove from uploading files set
        setUploadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tempPath);
          return newSet;
        });
        setUploadProgressMap((prev) => {
          const newMap = new Map(prev);
          newMap.delete(tempPath);
          return newMap;
        });

        // Replace temp file with actual uploaded file in the list
        // This keeps the file visible immediately without needing to refresh
        setFiles((prevFiles) => {
          console.log("🔄 [UPLOAD STATE] Replacing temp file with uploaded file");
          console.log("🔄 [UPLOAD STATE] Current files count:", prevFiles.length);
          const filtered = prevFiles.filter((f) => f.path !== tempPath);
          console.log("🔄 [UPLOAD STATE] After filtering temp file:", filtered.length);
          // Check if uploaded file already exists (shouldn't, but just in case)
          const exists = filtered.some((f) => f.path === uploadedFilePath);
          if (!exists) {
            // Add uploaded file at the beginning
            const newFiles = [uploadedFile, ...filtered];
            console.log("✅ [UPLOAD STATE] Added uploaded file, new count:", newFiles.length);
            return newFiles;
          }
          console.log("⚠️ [UPLOAD STATE] Uploaded file already exists in list");
          return filtered;
        });

        // Remove from uploading files set
        setUploadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tempPath);
          console.log("✅ [UPLOAD STATE] Removed from uploadingFiles, remaining:", newSet.size);
          return newSet;
        });
        setUploadProgressMap((prev) => {
          const newMap = new Map(prev);
          newMap.delete(tempPath);
          console.log("✅ [UPLOAD STATE] Removed from uploadProgressMap");
          return newMap;
        });

        // Store the original File object mapped to the uploaded file path for cropping
        const originalFile = uploadedFileMap.get(tempPath);
        if (originalFile) {
          setUploadedFileMap((prev) => {
            const newMap = new Map(prev);
            newMap.set(uploadedFilePath, originalFile);
            newMap.delete(tempPath);
            return newMap;
          });
        }

        // Auto-select the uploaded file (but don't close dialog)
        console.log("✅ [UPLOAD STATE] Auto-selecting uploaded file");
        setSelectedFile(uploadedFile);

        // Flash the newly uploaded file
        setFlashingFile(uploadedFilePath);
        setTimeout(() => setFlashingFile(null), 2000);

        toast({
          title: "Success",
          description: "File uploaded successfully. Click Select to use it.",
        });
      } else {
        // Revoke preview URL on failure
        const previewUrlToRevoke = previewUrls.get(tempPath);
        if (previewUrlToRevoke) {
          URL.revokeObjectURL(previewUrlToRevoke);
          setPreviewUrls((prev) => {
            const newMap = new Map(prev);
            newMap.delete(tempPath);
            return newMap;
          });
        }

        // Remove failed upload from list
        setUploadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tempPath);
          return newSet;
        });
        setUploadProgressMap((prev) => {
          const newMap = new Map(prev);
          newMap.delete(tempPath);
          return newMap;
        });
        setFiles((prevFiles) => prevFiles.filter((f) => f.path !== tempPath));

        toast({
          title: "Error",
          description: result.error || "Upload failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revoke preview URL on error
      const previewUrlToRevoke = previewUrls.get(tempPath);
      if (previewUrlToRevoke) {
        URL.revokeObjectURL(previewUrlToRevoke);
        setPreviewUrls((prev) => {
          const newMap = new Map(prev);
          newMap.delete(tempPath);
          return newMap;
        });
      }

      // Remove failed upload from list
      setUploadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(tempPath);
        return newSet;
      });
      setUploadProgressMap((prev) => {
        const newMap = new Map(prev);
        newMap.delete(tempPath);
        return newMap;
      });
      setFiles((prevFiles) => prevFiles.filter((f) => f.path !== tempPath));

      logger.error("Upload error", {}, error instanceof Error ? error : undefined);
      toast({
        title: "Error",
        description: "Upload failed",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle confirm selection
  const handleConfirm = async () => {
    if (selectedFile) {
      // If we have a cropped file blob, upload it first
      if (croppedFileBlob && isImage(selectedFile.contentType)) {
        try {
          // Create a File object from the blob
          const croppedFile = new File([croppedFileBlob], selectedFile.name, {
            type: selectedFile.contentType,
          });

          // Upload the cropped file
          const formData = new FormData();
          formData.append("file", croppedFile);
          formData.append("visibility", selectedFile.visibility || "public");
          if (folder) {
            formData.append("folder", folder);
          }

          const response = await fetch("/api/admin/media/upload", {
            method: "POST",
            body: formData,
          });

          const result = await response.json();
          if (response.ok) {
            const uploadedUrl = result.url || result.filePath;
            onSelect(uploadedUrl);
            onOpenChange(false);
            setSelectedFile(null);
            setCroppedFileBlob(null);
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to upload cropped image",
              variant: "destructive",
            });
          }
        } catch (error) {
          logger.error(
            "Failed to upload cropped image",
            {},
            error instanceof Error ? error : undefined
          );
          toast({
            title: "Error",
            description: "Failed to upload cropped image",
            variant: "destructive",
          });
        }
      } else {
        // Use URL if available, otherwise construct from path
        const fileUrl = selectedFile.url || `/api/storage/files/${selectedFile.path}`;
        onSelect(fileUrl);
        onOpenChange(false);
        setSelectedFile(null);
        setCroppedFileBlob(null);
      }
    }
  };

  const handleCropClick = async () => {
    if (!selectedFile) return;

    // Check if we have the original File object from upload
    const originalFile = uploadedFileMap.get(selectedFile.path);
    if (originalFile) {
      // Use the original File object (no need to fetch)
      setFileToCrop(originalFile);
      setCropDialogOpen(true);
    } else if (selectedFile.url || selectedFile.path) {
      // If file is from library, fetch it as a File object
      try {
        const fileUrl = selectedFile.url || `/api/storage/files/${selectedFile.path}`;
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const file = new File([blob], selectedFile.name, { type: selectedFile.contentType });
        setFileToCrop(file);
        setCropDialogOpen(true);
      } catch (error) {
        logger.error(
          "Failed to load file for cropping",
          {},
          error instanceof Error ? error : undefined
        );
        toast({
          title: "Error",
          description: "Failed to load image for cropping",
          variant: "destructive",
        });
      }
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    setCroppedFileBlob(croppedBlob);
    setCropDialogOpen(false);
    toast({
      title: "Success",
      description: "Image cropped successfully. Click 'Add' to use it.",
    });
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setActiveTab("library");
      setSearchTerm("");
      setUrlInput("");
      setSelectedFile(null);
      setFiles([]);
      setCurrentPage(1);
      setUploadProgress(0);
      setIsUploading(false);

      // Clean up any remaining preview URLs
      previewUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      setPreviewUrls(new Map());
      setUploadingFiles(new Set());
      setUploadProgressMap(new Map());
      setCroppedFileBlob(null);
      setUploadedFileMap(new Map());
    }
  }, [open, previewUrls]);

  const isImage = (contentType: string) => contentType?.startsWith("image/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="px-6 pt-4 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="library">Media Library</TabsTrigger>
              <TabsTrigger value="url">Add from URL</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            <TabsContent
              value="library"
              className="flex-1 flex flex-col min-h-0 mt-4 px-6 overflow-hidden data-[state=inactive]:absolute data-[state=inactive]:inset-0 data-[state=inactive]:pointer-events-none"
            >
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search media library..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* File Grid */}
              <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
                {isLoading && files.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : files.length === 0 ? (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No files found
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-3 pb-2">
                    {files.map((file) => {
                      const isSelected = selectedFile?.path === file.path;
                      const isFlashing = flashingFile === file.path;
                      const isUploading = uploadingFiles.has(file.path);
                      const uploadProgress = uploadProgressMap.get(file.path) || 0;

                      // Debug logging for rendering
                      if (isUploading) {
                        console.log("🎨 [RENDER] Rendering uploading file:", {
                          name: file.name,
                          path: file.path,
                          url: file.url,
                          isUploading,
                          uploadProgress,
                          hasPreviewUrl: !!file.url,
                        });
                      }

                      return (
                        <div key={file.path} className="space-y-2">
                          <div
                            onClick={() => !isUploading && handleFileSelect(file)}
                            className={cn(
                              "relative aspect-square rounded-lg border-2 cursor-pointer transition-all overflow-hidden",
                              isSelected
                                ? "border-primary ring-2 ring-primary ring-offset-2"
                                : "border-border hover:border-primary/50",
                              isFlashing && "ring-4 ring-primary animate-pulse",
                              isUploading && "cursor-wait opacity-75"
                            )}
                          >
                            {isImage(file.contentType) ? (
                              <>
                                <img
                                  src={file.url || `/api/storage/files/${file.path}`}
                                  alt={file.name}
                                  className={cn(
                                    "w-full h-full object-cover transition-opacity",
                                    isUploading ? "opacity-40" : "opacity-100"
                                  )}
                                  style={{ display: "block" }}
                                  onLoad={() => {
                                    if (isUploading) {
                                      console.log(
                                        "✅ [IMAGE LOAD] Image loaded successfully:",
                                        file.name,
                                        file.url
                                      );
                                    }
                                  }}
                                  onError={(e) => {
                                    console.error("❌ [IMAGE ERROR] Image failed to load:", {
                                      name: file.name,
                                      url: file.url,
                                      path: file.path,
                                      isUploading,
                                    });
                                    // Only hide image on error if not uploading (to show fallback)
                                    if (!isUploading) {
                                      e.currentTarget.style.display = "none";
                                    }
                                  }}
                                />
                                {isUploading && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center bg-background/95 rounded-lg p-4 shadow-lg border border-border">
                                      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-3" />
                                      <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden mb-2">
                                        <div
                                          className="h-full bg-primary transition-all duration-300 rounded-full"
                                          style={{ width: `${uploadProgress}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-medium text-foreground block">
                                        {uploadProgress}%
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                {isUploading ? (
                                  <div className="text-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                                    <span className="text-xs text-muted-foreground">
                                      {uploadProgress}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">{file.name}</span>
                                )}
                              </div>
                            )}
                            {isSelected && !isUploading && (
                              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                          <p
                            className="text-xs text-muted-foreground truncate text-center px-1"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
                {isLoading && files.length > 0 && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="url"
              className="flex-1 flex flex-col min-h-0 mt-4 px-6 overflow-hidden data-[state=inactive]:absolute data-[state=inactive]:inset-0 data-[state=inactive]:pointer-events-none"
            >
              <div className="flex-1 flex flex-col overflow-y-auto items-start">
                <div className="space-y-4 w-full">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Image URL</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUrlSubmit();
                          }
                        }}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  {urlInput && (
                    <div className="mt-4">
                      <div className="relative aspect-video rounded-lg border border-border overflow-hidden bg-muted">
                        <img
                          src={urlInput}
                          alt="Preview"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="upload"
              className="flex-1 flex flex-col min-h-0 mt-4 px-6 overflow-hidden data-[state=inactive]:absolute data-[state=inactive]:inset-0 data-[state=inactive]:pointer-events-none"
            >
              <div className="flex-1 flex flex-col overflow-y-auto items-start">
                <div className="space-y-4 w-full">
                  <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Click to upload or drag and drop
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Select File"
                      )}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={accept}
                      onChange={handleFileInput}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </div>
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="px-6 pt-2 pb-4 border-t flex justify-between flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {activeTab === "url" && (
              <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
                Add URL
              </Button>
            )}
            {activeTab === "library" && selectedFile && (
              <>
                {isImage(selectedFile.contentType) && (
                  <Button
                    variant="outline"
                    onClick={handleCropClick}
                    disabled={uploadingFiles.size > 0}
                  >
                    <Crop className="h-4 w-4 mr-2" />
                    Crop
                  </Button>
                )}
                <Button onClick={handleConfirm} disabled={!selectedFile || uploadingFiles.size > 0}>
                  {isImage(selectedFile.contentType) ? "Add" : "Select"}
                </Button>
              </>
            )}
            {activeTab === "upload" && selectedFile && isImage(selectedFile.contentType) && (
              <>
                <Button variant="outline" onClick={handleCropClick}>
                  <Crop className="h-4 w-4 mr-2" />
                  Crop
                </Button>
                <Button onClick={handleConfirm} disabled={uploadingFiles.size > 0}>
                  Add
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageFile={fileToCrop}
        onCropComplete={handleCropComplete}
        aspect={1}
        circular={false}
      />
    </Dialog>
  );
}
