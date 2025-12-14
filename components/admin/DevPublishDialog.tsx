"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/admin-ui/button";
import { Separator } from "@/components/admin-ui/separator";
import { Input } from "@/components/admin-ui/input";
import { Textarea } from "@/components/admin-ui/textarea";
import { FileUpload } from "@/components/admin-ui/file-upload";
import { OGImagePreview } from "@/components/admin/OGImagePreview";
import { ChevronRight, ChevronDown, HelpCircle, Edit } from "lucide-react";
import { getAppSettings, updateAppSettings } from "@/app/actions/app-settings";
import { logger } from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/admin-ui/tooltip";
import confetti from "canvas-confetti";

interface DevPublishDialogProps {
  subdomain?: string;
  hasPublished?: boolean;
  isAvailable?: boolean;
  showFixedBottomBar?: boolean;
  onDetailsExpand?: (expanded: boolean) => void;
  onPublished?: (published: boolean) => void;
}

export function DevPublishDialog({
  subdomain: initialSubdomain = "myproject",
  hasPublished = false,
  isAvailable = true,
  showFixedBottomBar = true,
  onDetailsExpand,
  onPublished,
}: DevPublishDialogProps) {
  const router = useRouter();
  const [subdomain, setSubdomain] = useState(initialSubdomain);
  const [savedSubdomain, setSavedSubdomain] = useState(initialSubdomain);
  const [isTaken, setIsTaken] = useState(false);

  // App details states
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [appDetailsMode] = useState<"current" | "minimal">("minimal");

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
  const [isAppDetailsExpanded, setIsAppDetailsExpanded] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const { toast } = useToast();

  // Taken subdomains for validation
  const takenDomains = ["myapp", "avi", "app"];

  // Validate subdomain on change
  useEffect(() => {
    const isValid = !takenDomains.includes(subdomain.toLowerCase());
    setIsTaken(!isValid);
  }, [subdomain]);

  // Load app settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getAppSettings();
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
      } catch (error) {
        logger.error("Error loading app settings", {}, error instanceof Error ? error : undefined);
      } finally {
        setIsLoadingDetails(false);
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

  const handleSaveDetails = async (): Promise<boolean> => {
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

      if (result.success) {
        // Update initial details to reflect saved state
        setInitialDetails({
          appName,
          appDescription,
          appLogoUrl: finalLogoUrl,
          appPreviewImageUrl: finalPreviewUrl,
        });

        // Clear pending changes
        setPendingLogoFile(null);
        setPendingPreviewFile(null);
        setPendingLogoRemoval(false);
        setPendingPreviewRemoval(false);

        // Update display URLs to saved URLs (not blob URLs)
        if (finalLogoUrl) {
          setAppLogoUrl(finalLogoUrl);
        }
        if (finalPreviewUrl) {
          setPreviewImageUrl(finalPreviewUrl);
        }

        setSaveSuccess(true);
        setIsSavingDetails(false);
        toast({
          title: "Success",
          description: "App details saved successfully",
        });
        return true;
      } else {
        logger.error("Save failed", { error: result.error });
        toast({
          title: "Error saving settings",
          description: result.error || "Failed to save settings",
          variant: "destructive",
        });
        setIsSavingDetails(false);
        return false;
      }
    } catch (error) {
      logger.error("Error saving settings", {}, error instanceof Error ? error : undefined);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
      setIsSavingDetails(false);
      return false;
    }
  };

  // Track changes to details
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

  // Handle publish
  const handlePublish = async () => {
    if (!isTaken && subdomain.trim() && !isPublishing && !isPublished) {
      setIsPublishing(true);

      // If there are changes, save first
      if (hasDetailsChanges) {
        const saveSuccess = await handleSaveDetails();
        if (!saveSuccess) {
          setIsPublishing(false);
          return; // Don't continue if save failed
        }
      }

      // Minimum 3 seconds wait
      const minWaitPromise = new Promise((resolve) => setTimeout(resolve, 3000));

      // TODO: Replace with actual publish API call
      // For now, simulate publish completion after minimum wait
      const publishPromise = new Promise<boolean>((resolve) => {
        // Simulate checking publish status
        setTimeout(() => {
          // TODO: Check actual publish status from API
          resolve(true); // Assume success for now
        }, 3000);
      });

      // Wait for both minimum time and publish completion
      await Promise.all([minWaitPromise, publishPromise]);

      // Mark as published
      setIsPublished(true);
      setIsPublishing(false);

      // Notify parent component
      onPublished?.(true);

      // Trigger confetti effect
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    }
  };

  const publishButtonText = isPublished
    ? "Published"
    : isPublishing
      ? "Publishing..."
      : saveSuccess
        ? "Changes saved"
        : isSavingDetails
          ? "Saving..."
          : hasDetailsChanges
            ? "Save changes & publish"
            : hasPublished
              ? "Publish changes"
              : "Publish app";
  const isPublishButtonDisabled =
    !isAvailable ||
    isTaken ||
    !subdomain.trim() ||
    isLoadingDetails ||
    isSavingDetails ||
    isPublishing ||
    isPublished;

  return (
    <div className="w-full max-w-lg bg-background flex flex-col h-full">
      {/* Main Content */}
      <div
        style={{ padding: "20px", paddingBottom: showFixedBottomBar ? "0" : "80px" }}
        className="flex-1 overflow-auto"
      >
        {isPublished ? (
          /* Published Success State */
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Your recent version is live 🎉</h2>
              <p className="text-sm text-muted-foreground">Click to view your latest version</p>
              <a
                href={`https://${subdomain}.crunchycone.dev`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-medium text-primary hover:underline transition-colors block"
              >
                https://{subdomain}.crunchycone.dev
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Manage Domain Section */}
            <div className="space-y-3">
              <span className="text-base font-medium">Manage your domain</span>
              <div className="flex items-center gap-2">
                <a
                  href={`https://${subdomain}.crunchycone.dev`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-medium text-muted-foreground/60 hover:text-primary hover:underline transition-colors"
                >
                  https://{subdomain}.crunchycone.dev
                </a>
                <button
                  type="button"
                  onClick={() => {
                    // Handle edit - could open a dialog or focus an input
                    console.log("Edit domain");
                  }}
                  className="p-1 text-primary hover:text-primary/80 transition-colors"
                  aria-label="Edit domain"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  // Handle custom domain connection
                  console.log("Connect custom domain");
                }}
              >
                Connect your own domain
              </Button>
            </div>

            {/* App Details Header */}
            <Separator className="mt-6 mb-3" />
            <button
              type="button"
              onClick={() => {
                const newExpanded = !isAppDetailsExpanded;
                setIsAppDetailsExpanded(newExpanded);
                onDetailsExpand?.(newExpanded);
              }}
              className="flex items-center justify-between w-full p-1 text-left rounded-md transition-colors"
              aria-label="Toggle app details"
            >
              <span className="text-base font-medium">Review your app details</span>
              {isAppDetailsExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {/* App Details Form */}
            {isAppDetailsExpanded && (
              <div className="space-y-3 mt-3">
                {/* App Name */}
                <div>
                  {appDetailsMode === "minimal" ? (
                    <span className="text-sm font-medium mb-1.5 block">
                      Review app details before publishing
                    </span>
                  ) : (
                    <h6 className="mb-1.5">Review app details before publishing</h6>
                  )}
                  <Input
                    id="app-name"
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    disabled={isLoadingDetails}
                    placeholder="My Awesome App"
                  />
                </div>

                {/* App Description */}
                <div>
                  {appDetailsMode === "minimal" ? (
                    <span className="text-sm font-medium mb-1.5 block">App Description</span>
                  ) : (
                    <h6 className="mb-1.5">App Description</h6>
                  )}
                  <Textarea
                    id="app-description"
                    value={appDescription}
                    onChange={(e) => setAppDescription(e.target.value)}
                    disabled={isLoadingDetails}
                    rows={2}
                    placeholder="A brief description of your app"
                  />
                </div>

                {/* App Logo */}
                <div>
                  {appDetailsMode === "minimal" ? (
                    <span className="text-sm font-medium mb-1.5 block">App Logo</span>
                  ) : (
                    <h6 className="mb-1.5">App Logo</h6>
                  )}
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
                  />
                </div>

                {/* Preview Image */}
                {appDetailsMode === "minimal" ? (
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-medium">App preview image</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select the image people will see when sharing your app</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1.5">
                    <h6>App preview image</h6>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select the image people will see when sharing your app</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed Bottom Bar - Only show when not published */}
      {showFixedBottomBar && !isPublished && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="max-w-lg mx-auto">
            <Button
              onClick={handlePublish}
              disabled={isPublishButtonDisabled}
              className={`w-full relative overflow-hidden ${isPublishing ? "animate-shimmer" : ""}`}
            >
              {isPublishing && (
                <div
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  style={{
                    animation: "shimmer 2s infinite",
                  }}
                />
              )}
              {isPublishing ? (
                <span className="relative z-10">Publishing...</span>
              ) : (
                publishButtonText
              )}
            </Button>
          </div>
        </div>
      )}
      {/* Sticky Bottom Bar - Only show when not published */}
      {!showFixedBottomBar && !isPublished && (
        <div className="sticky bottom-0 bg-background border-t border-border p-4 mt-auto">
          <Button
            onClick={handlePublish}
            disabled={isPublishButtonDisabled}
            className={`w-full relative overflow-hidden ${isPublishing ? "animate-shimmer" : ""}`}
          >
            {isPublishing && (
              <div
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{
                  animation: "shimmer 2s infinite",
                }}
              />
            )}
            {isPublishing ? (
              <span className="relative z-10">Publishing...</span>
            ) : (
              publishButtonText
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
