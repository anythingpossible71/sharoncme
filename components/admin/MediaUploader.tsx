"use client";

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from "react";
import { Card, CardContent } from "@/components/admin-ui/card";
import { Button } from "@/components/admin-ui/button";
import { Input } from "@/components/admin-ui/input";
import { Label } from "@/components/admin-ui/label";
import { Checkbox } from "@/components/admin-ui/checkbox";
import { Alert, AlertDescription } from "@/components/admin-ui/alert";
import { Badge } from "@/components/admin-ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin-ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/admin-ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/admin-ui/dropdown-menu";
import {
  Upload,
  Search,
  Eye,
  Trash2,
  Download,
  Image,
  FileText,
  File,
  Loader2,
  RefreshCcw,
  Filter,
  Lock,
  Unlock,
  MoreHorizontal,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import NextImage from "next/image";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

interface FileInfo {
  name: string;
  path: string;
  size: number;
  lastModified: string;
  contentType: string;
  visibility: "public" | "private";
  url?: string;
}

interface UploadResult {
  success: boolean;
  fileName: string;
  filePath: string;
  size: number;
  contentType: string;
  visibility: "public" | "private";
  url?: string;
}

export interface MediaUploaderRef {
  openUploadDialog: () => void;
  refreshFiles: () => void;
}

export const MediaUploader = forwardRef<MediaUploaderRef>((props, ref) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadVisibility, setUploadVisibility] = useState<"public" | "private">("public");
  const [uploadFolder, setUploadFolder] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [flashingFile, setFlashingFile] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [pageSize] = useState(20);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null); // Track which file's delete dialog is open
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set()); // Track which files are currently being deleted
  const [hasScrollableContent, setHasScrollableContent] = useState(false);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);

  // Check if table has scrollable content and update shadow state
  const checkScrollState = useCallback(() => {
    if (tableScrollRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = tableScrollRef.current;
      const hasScroll = scrollWidth > clientWidth;
      const isScrolled = scrollLeft > 0;
      setHasScrollableContent(hasScroll && isScrolled);
    }
  }, []);

  // Set up scroll detection
  useEffect(() => {
    const scrollContainer = tableScrollRef.current;
    if (!scrollContainer) return;

    // Initial check
    checkScrollState();

    // Check on resize
    const resizeObserver = new ResizeObserver(() => {
      checkScrollState();
    });
    resizeObserver.observe(scrollContainer);

    // Check on scroll
    scrollContainer.addEventListener("scroll", checkScrollState);

    return () => {
      resizeObserver.disconnect();
      scrollContainer.removeEventListener("scroll", checkScrollState);
    };
  }, [checkScrollState, filteredFiles]);

  // Load files from API
  const loadFiles = useCallback(
    async (page = 1, resetFiles = false) => {
      // Prevent duplicate requests
      if (loadingRef.current) {
        return;
      }

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      loadingRef.current = true;

      try {
        const offset = (page - 1) * pageSize;
        const params = new URLSearchParams({
          limit: pageSize.toString(),
          offset: offset.toString(),
        });

        if (searchTerm) {
          params.append("search", searchTerm);
        }

        const response = await fetch(`/api/admin/media/files?${params}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (response.ok) {
          const newFiles = data.files || [];
          if (resetFiles) {
            setFiles(newFiles);
          } else {
            setFiles((prevFiles) => prevFiles.concat(newFiles));
          }
          setTotalCount(data.totalCount || 0);
          setHasMore(data.hasMore || false);
          setMessage(null);
        } else {
          setMessage({ type: "error", text: data.error || "Failed to load files" });
        }
      } catch (error) {
        // Ignore aborted requests
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setMessage({ type: "error", text: "Failed to load files" });
        logger.error("Error loading files", {}, error instanceof Error ? error : undefined);
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [pageSize, searchTerm]
  );

  // Load files on mount and when search changes
  useEffect(() => {
    setCurrentPage(1);
    setFiles([]);
    loadingRef.current = false; // Reset loading state on search change
    loadFiles(1, true);

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]); // Only depend on searchTerm, not loadFiles

  // Load files on page change
  useEffect(() => {
    if (currentPage > 1) {
      loadingRef.current = false; // Reset loading state on page change
      loadFiles(currentPage, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]); // Only depend on currentPage, not loadFiles

  // Since search is now handled server-side, filtered files are just the files
  useEffect(() => {
    setFilteredFiles(files);
  }, [files]);

  // Functions to expose to parent
  const openUploadDialog = () => {
    setUploadDialogOpen(true);
  };

  const refreshFiles = () => {
    loadFiles(1, true);
  };

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    openUploadDialog,
    refreshFiles,
  }));

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("visibility", uploadVisibility);
    if (uploadFolder) {
      formData.append("folder", uploadFolder);
    }

    try {
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const result: UploadResult = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: `File uploaded successfully: ${result.fileName}` });
        setSelectedFile(null);
        setUploadFolder("");
        setUploadVisibility("public"); // Reset to default
        setUploadDialogOpen(false);
        setCurrentPage(1);
        setFiles([]);
        loadingRef.current = false;
        // Small delay to work around Next.js 16/Turbopack routing bug
        await new Promise((resolve) => setTimeout(resolve, 100));
        await loadFiles(1, true); // Refresh file list from beginning

        // Flash the newly uploaded file
        setFlashingFile(result.filePath);
        setTimeout(() => setFlashingFile(null), 2000);
      } else {
        setMessage({
          type: "error",
          text: (result as { error?: string }).error || "Upload failed",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Upload failed" });
      logger.error("Upload error", {}, error instanceof Error ? error : undefined);
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle file visibility
  const toggleVisibility = async (filePath: string, currentVisibility: "public" | "private") => {
    const newVisibility = currentVisibility === "public" ? "private" : "public";

    try {
      const response = await fetch(`/api/admin/media/files/${encodeURIComponent(filePath)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ visibility: newVisibility }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: `File visibility changed to ${newVisibility}` });
        setCurrentPage(1);
        setFiles([]);
        loadingRef.current = false;
        // Small delay to work around Next.js 16/Turbopack routing bug
        await new Promise((resolve) => setTimeout(resolve, 100));
        await loadFiles(1, true); // Refresh file list
      } else {
        const data = await response.json();
        setMessage({ type: "error", text: data.error || "Failed to update visibility" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update visibility" });
      logger.error("Visibility update error", {}, error instanceof Error ? error : undefined);
    }
  };

  // Delete file
  const deleteFile = async (filePath: string) => {
    // Note: Confirmation is handled by the Dialog component, no need for browser confirm()
    // Mark file as being deleted
    setDeletingFiles((prev) => {
      const newSet = new Set(prev);
      newSet.add(filePath);
      return newSet;
    });

    try {
      logger.debug("Deleting file", { filePath });
      const response = await fetch(`/api/admin/media/files/${encodeURIComponent(filePath)}`, {
        method: "DELETE",
      });

      logger.debug("Delete response", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });

      let responseData;
      try {
        responseData = await response.json();
        logger.debug("Delete response data", { responseData });
      } catch (jsonError) {
        logger.error("Failed to parse delete response", { status: response.status });
        // If we can't parse JSON but status is 200-299, assume success
        if (response.ok) {
          responseData = { success: true };
        } else {
          throw new Error("Failed to parse response");
        }
      }

      // Check for success in response data or response.ok
      if (response.ok || responseData?.success) {
        setMessage({ type: "success", text: "File deleted successfully" });

        // Close the delete dialog
        setDeleteDialogOpen(null);

        // Refresh all files from the server
        setCurrentPage(1);
        setFiles([]);
        loadingRef.current = false;
        // Small delay to work around Next.js 16/Turbopack routing bug
        await new Promise((resolve) => setTimeout(resolve, 100));
        await loadFiles(1, true);
      } else {
        const errorMessage =
          responseData?.error || responseData?.message || "Failed to delete file";
        setMessage({ type: "error", text: errorMessage });
        logger.error("Delete failed", {
          status: response.status,
          responseData,
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete file" });
      logger.error("Delete error", { filePath }, error instanceof Error ? error : undefined);
    } finally {
      // Remove from deleting set regardless of success/failure
      setDeletingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(filePath);
        return newSet;
      });
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get file icon
  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith("image/")) {
      return <Image className="h-4 w-4" aria-label="Image file" />;
    } else if (
      contentType.includes("pdf") ||
      contentType.includes("document") ||
      contentType.includes("text")
    ) {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  // Get thumbnail URL for image files
  const getThumbnailUrl = (file: FileInfo) => {
    if (file.contentType.startsWith("image/")) {
      return `/api/storage/files/${encodeURIComponent(file.path)}`;
    }
    return null;
  };

  // Check if file is an image
  const isImageFile = (contentType: string) => {
    return contentType.startsWith("image/");
  };

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        {/* Message Display */}
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Header with Search and Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex items-center gap-2">
              {searchTerm && (
                <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
                  <Filter className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={refreshFiles}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Add File
              </Button>
            </div>
          </div>

          <Dialog
            open={uploadDialogOpen}
            onOpenChange={(open) => {
              setUploadDialogOpen(open);
              if (!open) {
                // Reset to default when dialog closes
                setUploadVisibility("public");
                setSelectedFile(null);
                setUploadFolder("");
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload New File
                </DialogTitle>
                <DialogDescription>Add a new file to your media library</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept="*/*"
                  />
                  <p className="text-sm text-muted-foreground">Maximum file size: 50MB</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="make-private"
                    checked={uploadVisibility === "private"}
                    onCheckedChange={(checked) =>
                      setUploadVisibility(checked ? "private" : "public")
                    }
                    className="border-gray-400 data-[state=checked]:border-gray-400"
                  />
                  <Label htmlFor="make-private" className="text-sm font-normal cursor-pointer">
                    Make this file private
                  </Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {totalCount > 0
                ? `${filteredFiles.length} of ${totalCount} files`
                : `${filteredFiles.length} files`}
            </div>

            {/* Pagination Controls - Only show when needed */}
            {totalCount > pageSize && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {Math.ceil(totalCount / pageSize)}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={!hasMore || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Files Table */}
        <div className="border rounded-md overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading files...
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <Upload className="h-6 w-6 mr-2" />
              {files.length === 0 ? "No files uploaded yet" : "No files match your filters"}
            </div>
          ) : (
            <div ref={tableScrollRef} className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Preview</TableHead>
                    <TableHead className="min-w-[200px]">Name</TableHead>
                    <TableHead className="min-w-[100px]">Type</TableHead>
                    <TableHead className="min-w-[100px]">Size</TableHead>
                    <TableHead className="min-w-[120px]">Visibility</TableHead>
                    <TableHead className="min-w-[120px]">Modified</TableHead>
                    <TableHead
                      className={cn(
                        "text-right sticky right-0 bg-card z-10 min-w-[100px] border-l transition-shadow",
                        hasScrollableContent && "shadow-[inset_4px_0_6px_-2px_rgba(0,0,0,0.1)]"
                      )}
                    >
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => {
                    const isDeleting = deletingFiles.has(file.path);
                    return (
                      <TableRow
                        key={file.path}
                        className={cn(
                          flashingFile === file.path
                            ? "animate-pulse bg-green-50 border-green-200"
                            : "",
                          isDeleting && "opacity-50 bg-muted/50"
                        )}
                      >
                        <TableCell className="w-16 relative">
                          {isDeleting && (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10 rounded">
                              <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                            </div>
                          )}
                          {isImageFile(file.contentType) ? (
                            <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                              <NextImage
                                src={getThumbnailUrl(file)!}
                                alt={file.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                              {getFileIcon(file.contentType)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isDeleting && (
                              <span className="text-sm text-muted-foreground italic">
                                Deleting...
                              </span>
                            )}
                            <a
                              href={`/api/storage/files/${encodeURIComponent(file.path)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate max-w-[200px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              title={`Click to view ${file.name}`}
                            >
                              {file.name}
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{file.contentType.split("/")[0]}</Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(file.size)}</TableCell>
                        <TableCell>
                          <Badge variant={file.visibility === "public" ? "default" : "secondary"}>
                            {file.visibility}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(file.lastModified).toLocaleDateString()}</TableCell>
                        <TableCell
                          className={cn(
                            "text-right sticky right-0 z-10 border-l min-w-[100px] transition-shadow",
                            flashingFile === file.path
                              ? "bg-green-50"
                              : isDeleting
                                ? "bg-muted/50"
                                : "bg-card",
                            hasScrollableContent && "shadow-[inset_4px_0_6px_-2px_rgba(0,0,0,0.1)]"
                          )}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="cursor-pointer"
                                  >
                                    <Info className="mr-2 h-4 w-4" />
                                    File Details
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      {getFileIcon(file.contentType)}
                                      File Details
                                    </DialogTitle>
                                    <DialogDescription>
                                      Comprehensive information about this file
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-3">
                                        <div>
                                          <Label className="text-sm font-semibold text-muted-foreground">
                                            File Name
                                          </Label>
                                          <p className="text-sm break-all">{file.name}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-semibold text-muted-foreground">
                                            File Path
                                          </Label>
                                          <p className="text-sm font-mono break-all bg-muted px-2 py-1 rounded">
                                            {file.path}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-semibold text-muted-foreground">
                                            File Size
                                          </Label>
                                          <p className="text-sm">{formatFileSize(file.size)}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-semibold text-muted-foreground">
                                            Content Type
                                          </Label>
                                          <p className="text-sm font-mono">{file.contentType}</p>
                                        </div>
                                      </div>
                                      <div className="space-y-3">
                                        <div>
                                          <Label className="text-sm font-semibold text-muted-foreground">
                                            Visibility
                                          </Label>
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              variant={
                                                file.visibility === "public"
                                                  ? "default"
                                                  : "secondary"
                                              }
                                            >
                                              {file.visibility}
                                            </Badge>
                                            {file.visibility === "public" ? (
                                              <Unlock className="h-4 w-4 text-green-600" />
                                            ) : (
                                              <Lock className="h-4 w-4 text-orange-600" />
                                            )}
                                          </div>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-semibold text-muted-foreground">
                                            Last Modified
                                          </Label>
                                          <p className="text-sm">
                                            {new Date(file.lastModified).toLocaleString()}
                                          </p>
                                        </div>
                                        {file.url && (
                                          <div>
                                            <Label className="text-sm font-semibold text-muted-foreground">
                                              Public URL
                                            </Label>
                                            <p className="text-sm break-all">
                                              <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                              >
                                                {file.url}
                                              </a>
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="border-t pt-4">
                                      <Label className="text-sm font-semibold text-muted-foreground">
                                        Quick Actions
                                      </Label>
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        <Button size="sm" variant="outline" asChild>
                                          <a
                                            href={`/api/storage/files/${encodeURIComponent(file.path)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <Eye className="mr-2 h-4 w-4" />
                                            View File
                                          </a>
                                        </Button>
                                        {file.url && (
                                          <Button size="sm" variant="outline" asChild>
                                            <a
                                              href={file.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <Download className="mr-2 h-4 w-4" />
                                              Public URL
                                            </a>
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            toggleVisibility(file.path, file.visibility)
                                          }
                                        >
                                          {file.visibility === "public" ? (
                                            <>
                                              <Lock className="mr-2 h-4 w-4" />
                                              Make Private
                                            </>
                                          ) : (
                                            <>
                                              <Unlock className="mr-2 h-4 w-4" />
                                              Make Public
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <DropdownMenuItem asChild>
                                <a
                                  href={`/api/storage/files/${encodeURIComponent(file.path)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center cursor-pointer"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View File
                                </a>
                              </DropdownMenuItem>

                              {file.url && (
                                <DropdownMenuItem asChild>
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Public URL
                                  </a>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() => toggleVisibility(file.path, file.visibility)}
                                className="cursor-pointer"
                              >
                                {file.visibility === "public" ? (
                                  <>
                                    <Lock className="mr-2 h-4 w-4" />
                                    Make Private
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="mr-2 h-4 w-4" />
                                    Make Public
                                  </>
                                )}
                              </DropdownMenuItem>

                              <Dialog
                                open={deleteDialogOpen === file.path}
                                onOpenChange={(open) =>
                                  setDeleteDialogOpen(open ? file.path : null)
                                }
                              >
                                <DialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      if (!isDeleting) {
                                        setDeleteDialogOpen(file.path);
                                      }
                                    }}
                                    className="text-destructive cursor-pointer"
                                    disabled={isDeleting}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {isDeleting ? "Deleting..." : "Delete File"}
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete File</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete &quot;{file.name}&quot;? This
                                      action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => setDeleteDialogOpen(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => deleteFile(file.path)}
                                      disabled={isDeleting}
                                    >
                                      {isDeleting ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Deleting...
                                        </>
                                      ) : (
                                        "Delete"
                                      )}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

MediaUploader.displayName = "MediaUploader";
