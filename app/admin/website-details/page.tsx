"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/admin-ui/button";
import { Input } from "@/components/admin-ui/input";
import { Textarea } from "@/components/admin-ui/textarea";
import { Label } from "@/components/admin-ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/admin-ui/card";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { FileUpload } from "@/components/admin-ui/file-upload";
import { getAppSettings, updateAppSettings } from "@/app/actions/app-settings";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export default function PublishSettingsPage() {
  // Website details states
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [_appLogo, setAppLogo] = useState<File | null>(null);
  const [_previewImage, setPreviewImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Upload states - must be declared before useEffect
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingPreview, setIsUploadingPreview] = useState(false);

  const [initialDetails, setInitialDetails] = useState<{
    appName: string;
    appDescription: string;
    appLogoUrl: string | null;
    appPreviewImageUrl: string | null;
  } | null>(null);
  const [hasDetailsChanges, setHasDetailsChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  // Upload functions
  const uploadFile = async (file: File, _type: "logo" | "preview"): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("visibility", "public"); // Ensure files are public
    formData.append("folder", "website-assets"); // Organize in a specific folder

    try {
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      logger.info("Upload API response", { success: result.success, hasUrl: !!result.url });

      if (response.ok && result.success) {
        const url = result.url || null;
        logger.info("Upload successful", { url });
        if (!url) {
          logger.warn("Upload succeeded but no URL returned");
        }
        return url;
      } else {
        logger.error("Upload failed", { error: result.error || "Unknown error" });
        return null;
      }
    } catch (error) {
      logger.error("Upload error", {}, error instanceof Error ? error : undefined);
      return null;
    }
  };

  const handleLogoUpload = async (file: File): Promise<string | null> => {
    setIsUploadingLogo(true);
    try {
      // Upload logo to /public folder using new endpoint
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/app-logo/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      logger.info("Logo upload API response", { success: result.success, hasUrl: !!result.url });

      if (response.ok && result.success) {
        const url = result.url || null;
        logger.info("Logo upload result", { url, file: file.name });
        if (url) {
          setAppLogo(file);
          setAppLogoUrl(url);
          logger.info("Logo URL set to state", { url });
          logger.info("Current appLogoUrl state after set", { url });
          return url;
        } else {
          logger.error("Logo upload failed - no URL returned");
          toast({
            title: "Upload failed",
            description: "Failed to upload logo. Please try again.",
            variant: "destructive",
          });
          return null;
        }
      } else {
        logger.error("Logo upload failed", { error: result.error || "Unknown error" });
        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload logo. Please try again.",
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      logger.error("Logo upload error", {}, error instanceof Error ? error : undefined);
      toast({
        title: "Upload error",
        description: error instanceof Error ? error.message : "Failed to upload logo",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handlePreviewUpload = async (file: File): Promise<string | null> => {
    setIsUploadingPreview(true);
    const url = await uploadFile(file, "preview");
    if (url) {
      setPreviewImage(file);
      setPreviewImageUrl(url);
    }
    setIsUploadingPreview(false);
    return url;
  };

  const removeLogo = async () => {
    try {
      // Delete logo file from /public
      const response = await fetch("/api/admin/app-logo/delete", {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Reload settings to ensure state is in sync
        const updatedSettings = await getAppSettings();
        const updatedLogoUrl = updatedSettings.appLogoUrl || null;

        setAppLogo(null);
        setAppLogoUrl(updatedLogoUrl);
        setInitialDetails((prev) => ({
          ...prev!,
          appLogoUrl: updatedLogoUrl,
        }));
        setHasDetailsChanges(true);

        toast({
          title: "Logo removed",
          description: "The logo has been removed successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to remove logo",
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error("Error removing logo", {}, error instanceof Error ? error : undefined);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove logo",
        variant: "destructive",
      });
    }
  };

  const removePreview = () => {
    setPreviewImage(null);
    setPreviewImageUrl(null);
  };

  const handleSaveDetails = async () => {
    setIsSavingDetails(true);
    setSaveSuccess(false);
    try {
      // Ensure we have the latest state values
      const logoUrlToSave = appLogoUrl || undefined;
      const previewUrlToSave = previewImageUrl || undefined;

      logger.info("Saving details with:", {
        appName,
        appDescription,
        appLogoUrl: logoUrlToSave,
        previewImageUrl: previewUrlToSave,
        appLogoUrlState: appLogoUrl,
        previewImageUrlState: previewImageUrl,
      });

      // Get current settings and update only details fields (preserve address fields)
      const currentSettings = await getAppSettings();
      const result = await updateAppSettings({
        ...currentSettings,
        appName,
        appDescription,
        appLogoUrl: logoUrlToSave,
        appPreviewImageUrl: previewUrlToSave,
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

    const dirty =
      appName !== initialDetails.appName ||
      descriptionToCompare !== initialDescription ||
      (appLogoUrl || null) !== (initialDetails.appLogoUrl || null) ||
      (previewImageUrl || null) !== (initialDetails.appPreviewImageUrl || null);

    setHasDetailsChanges(dirty);
    if (dirty) {
      setSaveSuccess(false);
    }
  }, [appName, appDescription, appLogoUrl, previewImageUrl, initialDetails]);

  const detailsButtonLabel = saveSuccess
    ? "Changes saved"
    : isSavingDetails
      ? "Saving..."
      : "Save Changes";
  const isDetailsButtonDisabled = isLoading || isSavingDetails || !hasDetailsChanges;

  return (
    <div className="space-y-6">
      <AdminBreadcrumb sectionName="Website details" />

      <div className="space-y-6">
        {/* Website Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Website Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 max-w-[600px]">
              <div className="space-y-6">
                {/* App Name */}
                <div className="space-y-2">
                  <Label htmlFor="app-name">App Name</Label>
                  <Input
                    id="app-name"
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    disabled={isLoading}
                    placeholder="My Awesome App"
                  />
                </div>

                {/* App Description */}
                <div className="space-y-2">
                  <Label htmlFor="app-description">App Description</Label>
                  <Textarea
                    id="app-description"
                    value={appDescription}
                    onChange={(e) => setAppDescription(e.target.value)}
                    disabled={isLoading}
                    rows={4}
                    placeholder="A brief description of your app"
                  />
                </div>

                {/* App Logo */}
                <div className="space-y-2">
                  <Label>App Logo</Label>
                  <FileUpload
                    onUpload={handleLogoUpload}
                    onRemove={removeLogo}
                    currentUrl={appLogoUrl}
                    isUploading={isUploadingLogo}
                    accept="image/*"
                    maxSize={5}
                    placeholder="Upload your app logo"
                  />
                </div>

                {/* Preview Image */}
                <div className="space-y-2">
                  <Label>Preview Image</Label>
                  <FileUpload
                    onUpload={handlePreviewUpload}
                    onRemove={removePreview}
                    currentUrl={previewImageUrl}
                    isUploading={isUploadingPreview}
                    accept="image/*"
                    maxSize={10}
                    placeholder="Upload a preview image for your website"
                  />
                </div>
              </div>

              {/* Save Button for Website Details */}
              <div className="pt-6 flex justify-start">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
