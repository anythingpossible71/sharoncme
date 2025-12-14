"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/admin-ui/button";
import { Input } from "@/components/admin-ui/input";
import { Textarea } from "@/components/admin-ui/textarea";
import { Card, CardContent } from "@/components/admin-ui/card";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { FileUpload } from "@/components/admin-ui/file-upload";
import { OGImagePreview } from "@/components/admin/OGImagePreview";
import { getAppSettings, updateAppSettings } from "@/app/actions/app-settings";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { ChevronDown, ChevronUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default function PublishSettingsPage() {
  // Website details states
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Image states - UI display URLs (may be object URLs for pending uploads)
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Pending changes - files to upload or flags for deletion
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingPreviewFile, setPendingPreviewFile] = useState<File | null>(null);
  const [pendingLogoRemoval, setPendingLogoRemoval] = useState(false);
  const [pendingPreviewRemoval, setPendingPreviewRemoval] = useState(false);

  // Store original URLs/files before removal (for undo)
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [originalPendingLogoFile, setOriginalPendingLogoFile] = useState<File | null>(null);
  const [originalPendingPreviewFile, setOriginalPendingPreviewFile] = useState<File | null>(null);
  const [originalLogoObjectUrl, setOriginalLogoObjectUrl] = useState<string | null>(null);
  const [originalPreviewObjectUrl, setOriginalPreviewObjectUrl] = useState<string | null>(null);

  // Object URLs for preview (must be cleaned up)
  const [logoObjectUrl, setLogoObjectUrl] = useState<string | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);

  const [initialDetails, setInitialDetails] = useState<{
    appName: string;
    appDescription: string;
    appLogoUrl: string | null;
    appPreviewImageUrl: string | null;
  } | null>(null);
  const [hasDetailsChanges, setHasDetailsChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPreviewImageCollapsed, setIsPreviewImageCollapsed] = useState(true);

  const { toast } = useToast();

  // Load app settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getAppSettings();
        logger.info("Loaded settings", {
          appName: settings.appName,
          appDescription: settings.appDescription,
          appLogoUrl: settings.appLogoUrl,
        });
        const loadedName = settings.appName || "";
        const loadedDescription = settings.appDescription || "";
        const loadedLogoUrl = settings.appLogoUrl || null;
        const loadedPreviewUrl = settings.appPreviewImageUrl || null;

        setAppName(loadedName);
        setAppDescription(loadedDescription);
        setAppLogoUrl(loadedLogoUrl);
        setPreviewImageUrl(loadedPreviewUrl);
        setInitialDetails({
          appName: loadedName,
          appDescription: loadedDescription,
          appLogoUrl: loadedLogoUrl,
          appPreviewImageUrl: loadedPreviewUrl,
        });
        setSaveSuccess(false);
        logger.info("State set - appLogoUrl", { appLogoUrl: settings.appLogoUrl || null });
      } catch (error) {
        logger.error("Error loading app settings", {}, error instanceof Error ? error : undefined);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Resize image client-side for preview to exact container size
  const resizeImageForPreview = async (file: File, containerSize: number = 36): Promise<string> => {
    return new Promise((resolve, reject) => {
      // For SVGs, return original blob URL (they scale automatically)
      if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
        resolve(URL.createObjectURL(file));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate dimensions maintaining aspect ratio to fit within containerSize
          let width = img.width;
          let height = img.height;

          // Scale to fit container while maintaining aspect ratio
          const scale = Math.min(containerSize / width, containerSize / height);
          width = width * scale;
          height = height * scale;

          // Create canvas at exact container size
          const canvas = document.createElement("canvas");
          canvas.width = containerSize;
          canvas.height = containerSize;
          const ctx = canvas.getContext("2d", { alpha: true });

          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          // Clear canvas (transparent background)
          ctx.clearRect(0, 0, containerSize, containerSize);

          // Center the image
          const x = (containerSize - width) / 2;
          const y = (containerSize - height) / 2;

          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Draw resized image
          ctx.drawImage(img, x, y, width, height);

          // Convert to blob URL
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(URL.createObjectURL(blob));
              } else {
                reject(new Error("Failed to create blob"));
              }
            },
            file.type || "image/png",
            0.95
          );
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (file: File): Promise<string | null> => {
    try {
      // Clean up previous object URL if exists
      if (logoObjectUrl) {
        URL.revokeObjectURL(logoObjectUrl);
      }

      // Resize image for preview to exact container size (36x36px)
      const objectUrl = await resizeImageForPreview(file, 36);
      setLogoObjectUrl(objectUrl);

      // Store original file for later upload and update UI immediately with resized preview
      setPendingLogoFile(file);
      setPendingLogoRemoval(false);
      setAppLogoUrl(objectUrl);

      logger.info("Logo file selected for upload", { fileName: file.name });
      return objectUrl;
    } catch (error) {
      logger.error("Error preparing logo upload", {}, error instanceof Error ? error : undefined);
      toast({
        title: "Error",
        description: "Failed to prepare logo for upload",
        variant: "destructive",
      });
      return null;
    }
  };

  const handlePreviewUpload = async (file: File): Promise<string | null> => {
    try {
      // Clean up previous object URL if exists
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }

      // Resize image for preview (larger size for preview image, e.g., 800px max)
      const objectUrl = await resizeImageForPreview(file, 800);
      setPreviewObjectUrl(objectUrl);

      // Store original file for later upload and update UI immediately with resized preview
      setPendingPreviewFile(file);
      setPendingPreviewRemoval(false);
      setPreviewImageUrl(objectUrl);

      logger.info("Preview image file selected for upload", { fileName: file.name });
      return objectUrl;
    } catch (error) {
      logger.error(
        "Error preparing preview image upload",
        {},
        error instanceof Error ? error : undefined
      );
      toast({
        title: "Error",
        description: "Failed to prepare preview image for upload",
        variant: "destructive",
      });
      return null;
    }
  };

  const removeLogo = async () => {
    try {
      // Store original state before removal (for undo)
      // If there's a pending file (new upload), store it
      if (pendingLogoFile) {
        setOriginalPendingLogoFile(pendingLogoFile);
        // Store blob URL if it exists
        if (logoObjectUrl) {
          setOriginalLogoObjectUrl(logoObjectUrl);
        } else if (appLogoUrl && appLogoUrl.startsWith("blob:")) {
          setOriginalLogoObjectUrl(appLogoUrl);
        }
      } else {
        // If no pending file, store the saved URL
        if (appLogoUrl && !appLogoUrl.startsWith("blob:")) {
          setOriginalLogoUrl(appLogoUrl);
        } else if (initialDetails?.appLogoUrl) {
          setOriginalLogoUrl(initialDetails.appLogoUrl);
        }
      }

      // Don't revoke object URL yet - we might need it for undo
      // Only revoke if we're not storing it for undo
      if (logoObjectUrl && !pendingLogoFile) {
        URL.revokeObjectURL(logoObjectUrl);
        setLogoObjectUrl(null);
      }

      // Mark for removal and hide image in UI
      setPendingLogoFile(null);
      setPendingLogoRemoval(true);
      setAppLogoUrl(null); // Hide image from UI

      logger.info("Logo marked for removal");
    } catch (error) {
      logger.error("Error removing logo", {}, error instanceof Error ? error : undefined);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove logo",
        variant: "destructive",
      });
    }
  };

  const undoLogo = () => {
    // Restore original state
    if (originalPendingLogoFile) {
      // Restore pending file (new upload that wasn't saved)
      setPendingLogoFile(originalPendingLogoFile);
      // Restore blob URL if we have it
      if (originalLogoObjectUrl) {
        setLogoObjectUrl(originalLogoObjectUrl);
        setAppLogoUrl(originalLogoObjectUrl);
      } else {
        // Recreate blob URL from file
        const blobUrl = URL.createObjectURL(originalPendingLogoFile);
        setLogoObjectUrl(blobUrl);
        setAppLogoUrl(blobUrl);
      }
      setPendingLogoRemoval(false);
      setOriginalPendingLogoFile(null);
      setOriginalLogoObjectUrl(null);
      logger.info("Logo removal undone (restored pending file)");
    } else if (originalLogoUrl) {
      // Restore saved URL
      setAppLogoUrl(originalLogoUrl);
      setPendingLogoRemoval(false);
      setOriginalLogoUrl(null);
      logger.info("Logo removal undone (restored saved URL)");
    }
  };

  const removePreview = async () => {
    try {
      // Store original state before removal (for undo)
      // If there's a pending file (new upload), store it
      if (pendingPreviewFile) {
        setOriginalPendingPreviewFile(pendingPreviewFile);
        // Store blob URL if it exists
        if (previewObjectUrl) {
          setOriginalPreviewObjectUrl(previewObjectUrl);
        } else if (previewImageUrl && previewImageUrl.startsWith("blob:")) {
          setOriginalPreviewObjectUrl(previewImageUrl);
        }
      } else {
        // If no pending file, store the saved URL
        if (previewImageUrl && !previewImageUrl.startsWith("blob:")) {
          setOriginalPreviewUrl(previewImageUrl);
        } else if (initialDetails?.appPreviewImageUrl) {
          setOriginalPreviewUrl(initialDetails.appPreviewImageUrl);
        }
      }

      // Don't revoke object URL yet - we might need it for undo
      // Only revoke if we're not storing it for undo
      if (previewObjectUrl && !pendingPreviewFile) {
        URL.revokeObjectURL(previewObjectUrl);
        setPreviewObjectUrl(null);
      }

      // Mark for removal and hide image in UI
      setPendingPreviewFile(null);
      setPendingPreviewRemoval(true);
      setPreviewImageUrl(null); // Hide image from UI

      logger.info("Preview image marked for removal");
    } catch (error) {
      logger.error("Error removing preview image", {}, error instanceof Error ? error : undefined);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove preview image",
        variant: "destructive",
      });
    }
  };

  const undoPreview = () => {
    // Restore original state
    if (originalPendingPreviewFile) {
      // Restore pending file (new upload that wasn't saved)
      setPendingPreviewFile(originalPendingPreviewFile);
      // Restore blob URL if we have it
      if (originalPreviewObjectUrl) {
        setPreviewObjectUrl(originalPreviewObjectUrl);
        setPreviewImageUrl(originalPreviewObjectUrl);
      } else {
        // Recreate blob URL from file
        const blobUrl = URL.createObjectURL(originalPendingPreviewFile);
        setPreviewObjectUrl(blobUrl);
        setPreviewImageUrl(blobUrl);
      }
      setPendingPreviewRemoval(false);
      setOriginalPendingPreviewFile(null);
      setOriginalPreviewObjectUrl(null);
      logger.info("Preview image removal undone (restored pending file)");
    } else if (originalPreviewUrl) {
      // Restore saved URL
      setPreviewImageUrl(originalPreviewUrl);
      setPendingPreviewRemoval(false);
      setOriginalPreviewUrl(null);
      logger.info("Preview image removal undone (restored saved URL)");
    }
  };

  const handleSaveDetails = async () => {
    setIsSavingDetails(true);
    setSaveSuccess(false);
    try {
      let finalLogoUrl: string | null = null;
      let finalPreviewUrl: string | null = null;

      // Handle logo upload/removal
      if (pendingLogoRemoval) {
        // Delete existing logo
        const deleteResponse = await fetch("/api/admin/app-logo/delete", {
          method: "POST",
        });
        const deleteResult = await deleteResponse.json();
        if (!deleteResponse.ok || !deleteResult.success) {
          throw new Error(deleteResult.error || "Failed to delete logo");
        }
        finalLogoUrl = null;
      } else if (pendingLogoFile) {
        // Upload new logo
        const formData = new FormData();
        formData.append("file", pendingLogoFile);
        const uploadResponse = await fetch("/api/admin/app-logo/upload", {
          method: "POST",
          body: formData,
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok || !uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || "Failed to upload logo");
        }
        finalLogoUrl = uploadResult.url;
        // Clean up object URL
        if (logoObjectUrl) {
          URL.revokeObjectURL(logoObjectUrl);
          setLogoObjectUrl(null);
        }
      } else {
        // Keep existing logo
        finalLogoUrl = initialDetails?.appLogoUrl || null;
      }

      // Handle preview image upload/removal
      if (pendingPreviewRemoval) {
        // Delete existing preview image
        const deleteResponse = await fetch("/api/admin/app-preview-image/delete", {
          method: "POST",
        });
        const deleteResult = await deleteResponse.json();
        if (!deleteResponse.ok || !deleteResult.success) {
          throw new Error(deleteResult.error || "Failed to delete preview image");
        }
        finalPreviewUrl = null;
      } else if (pendingPreviewFile) {
        // Upload new preview image
        const formData = new FormData();
        formData.append("file", pendingPreviewFile);
        const uploadResponse = await fetch("/api/admin/app-preview-image/upload", {
          method: "POST",
          body: formData,
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok || !uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || "Failed to upload preview image");
        }
        finalPreviewUrl = uploadResult.url;
        // Clean up object URL
        if (previewObjectUrl) {
          URL.revokeObjectURL(previewObjectUrl);
          setPreviewObjectUrl(null);
        }
      } else {
        // Keep existing preview image
        finalPreviewUrl = initialDetails?.appPreviewImageUrl || null;
      }

      logger.info("Saving details with:", {
        appName,
        appDescription,
        appLogoUrl: finalLogoUrl,
        previewImageUrl: finalPreviewUrl,
      });

      // Get current settings and update only details fields (preserve address fields)
      const currentSettings = await getAppSettings();
      const result = await updateAppSettings({
        ...currentSettings,
        appName,
        appDescription,
        appLogoUrl: finalLogoUrl || undefined,
        appPreviewImageUrl: finalPreviewUrl || undefined,
      });

      logger.info("Save result", { success: result.success });

      if (result.success) {
        // Reload settings to ensure state is in sync with database
        const updatedSettings = await getAppSettings();
        const updatedName = updatedSettings.appName || "";
        const updatedDescription = updatedSettings.appDescription || "";
        const updatedLogoUrl = updatedSettings.appLogoUrl || null;
        const updatedPreviewUrl = updatedSettings.appPreviewImageUrl || null;

        setAppName(updatedName);
        setAppDescription(updatedDescription);
        setAppLogoUrl(updatedLogoUrl);
        setPreviewImageUrl(updatedPreviewUrl);

        // Clear pending changes
        setPendingLogoFile(null);
        setPendingPreviewFile(null);
        setPendingLogoRemoval(false);
        setPendingPreviewRemoval(false);
        setOriginalLogoUrl(null);
        setOriginalPreviewUrl(null);
        setOriginalPendingLogoFile(null);
        setOriginalPendingPreviewFile(null);
        setOriginalLogoObjectUrl(null);
        setOriginalPreviewObjectUrl(null);

        setInitialDetails({
          appName: updatedName,
          appDescription: updatedDescription,
          appLogoUrl: updatedLogoUrl,
          appPreviewImageUrl: updatedPreviewUrl,
        });
        setSaveSuccess(true);
        setHasDetailsChanges(false);

        toast({
          title: "Changes saved",
          description: "Your website details have been updated successfully.",
        });
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        logger.error("Save failed", { error: result.error });
        toast({
          title: "Error saving settings",
          description: result.error || "Failed to save settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error("Error saving settings", {}, error instanceof Error ? error : undefined);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSavingDetails(false);
    }
  };

  useEffect(() => {
    if (!initialDetails) {
      setHasDetailsChanges(false);
      return;
    }

    const descriptionToCompare = appDescription ?? "";
    const initialDescription = initialDetails.appDescription ?? "";

    // Check for text changes
    const textChanged =
      appName !== initialDetails.appName || descriptionToCompare !== initialDescription;

    // Check for image changes (pending uploads or removals)
    const logoChanged = pendingLogoFile !== null || pendingLogoRemoval;
    const previewChanged = pendingPreviewFile !== null || pendingPreviewRemoval;

    const dirty = textChanged || logoChanged || previewChanged;

    setHasDetailsChanges(dirty);
    if (dirty) {
      setSaveSuccess(false);
    }
  }, [
    appName,
    appDescription,
    pendingLogoFile,
    pendingPreviewFile,
    pendingLogoRemoval,
    pendingPreviewRemoval,
    initialDetails,
  ]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (logoObjectUrl) {
        URL.revokeObjectURL(logoObjectUrl);
      }
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    };
  }, [logoObjectUrl, previewObjectUrl]);

  const handleCancel = () => {
    if (!initialDetails) return;

    // Reset all fields to initial values
    setAppName(initialDetails.appName);
    setAppDescription(initialDetails.appDescription);
    setAppLogoUrl(initialDetails.appLogoUrl);
    setPreviewImageUrl(initialDetails.appPreviewImageUrl);

    // Clear all pending changes
    setPendingLogoFile(null);
    setPendingPreviewFile(null);
    setPendingLogoRemoval(false);
    setPendingPreviewRemoval(false);
    setOriginalLogoUrl(null);
    setOriginalPreviewUrl(null);
    setOriginalPendingLogoFile(null);
    setOriginalPendingPreviewFile(null);

    // Clean up object URLs
    if (logoObjectUrl) {
      URL.revokeObjectURL(logoObjectUrl);
      setLogoObjectUrl(null);
    }
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl(null);
    }

    setHasDetailsChanges(false);
    setSaveSuccess(false);

    toast({
      title: "Changes cancelled",
      description: "All changes have been reset to the last saved state.",
    });
  };

  const detailsButtonLabel = saveSuccess
    ? "Changes saved"
    : isSavingDetails
      ? "Saving..."
      : "Save Changes";
  const isDetailsButtonDisabled = isLoading || isSavingDetails || !hasDetailsChanges;

  return (
    <div className="flex flex-col min-h-full relative">
      <div className="space-y-6 flex-1 pb-20">
        <AdminBreadcrumb sectionName="App details" />

        <div className="space-y-6">
          {/* Website Details Section */}
          <Card>
            <CardContent className="pt-5">
              <div className="space-y-6 max-w-[600px]">
                <div className="space-y-6">
                  {/* App Logo and App Name - side by side */}
                  <div className="flex items-start gap-4">
                    {/* App Logo - floated left */}
                    <div className="flex-shrink-0">
                      <FileUpload
                        onUpload={handleLogoUpload}
                        onRemove={removeLogo}
                        onUndo={undoLogo}
                        currentUrl={appLogoUrl}
                        isMarkedForRemoval={pendingLogoRemoval}
                        isUploading={false}
                        accept="image/*"
                        maxSize={5}
                        placeholder="Upload your app logo"
                        isDefault={true}
                      />
                    </div>

                    {/* App Name */}
                    <div className="flex-1 space-y-2">
                      <h6>App Name</h6>
                      <Input
                        id="app-name"
                        type="text"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        disabled={isLoading}
                        placeholder="My Awesome App"
                      />
                    </div>
                  </div>

                  {/* App Description */}
                  <div className="space-y-2">
                    <h6>App Description</h6>
                    <Textarea
                      id="app-description"
                      value={appDescription}
                      onChange={(e) => setAppDescription(e.target.value)}
                      disabled={isLoading}
                      rows={2}
                      placeholder="A brief description of your app"
                      className="min-h-0"
                    />
                  </div>

                  {/* Preview Image */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setIsPreviewImageCollapsed(!isPreviewImageCollapsed)}
                      className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                    >
                      <h6>App preview image</h6>
                      {isPreviewImageCollapsed ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    {!isPreviewImageCollapsed && (
                      <>
                        <p className="text-sm text-muted-foreground mt-1">
                          Select the image people will see when sharing your app
                        </p>
                        <OGImagePreview
                          onUpload={handlePreviewUpload}
                          onRemove={removePreview}
                          onUndo={undoPreview}
                          currentUrl={previewImageUrl}
                          isMarkedForRemoval={pendingPreviewRemoval}
                          isUploading={false}
                          accept="image/*"
                          maxSize={10}
                        />
                      </>
                    )}
                  </div>

                  {/* Save and Cancel Buttons */}
                  <div className="flex justify-start gap-3 pt-4">
                    {hasDetailsChanges && (
                      <Button
                        onClick={handleCancel}
                        disabled={isLoading || isSavingDetails}
                        size="lg"
                        variant="outline"
                        className="min-w-[140px]"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      onClick={handleSaveDetails}
                      disabled={isDetailsButtonDisabled}
                      size="lg"
                      className="min-w-[140px]"
                    >
                      {detailsButtonLabel}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
