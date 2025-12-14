"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/admin-ui/button";
import { Input } from "@/components/admin-ui/input";
import { Textarea } from "@/components/admin-ui/textarea";
import { Card, CardContent } from "@/components/admin-ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin-ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/admin-ui/tabs";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AvatarUpload } from "@/components/admin-ui/avatar-upload";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  reorderTeamMembers,
  type TeamMemberData,
} from "@/app/actions/team-members";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, X, GripVertical, ArrowLeft } from "lucide-react";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<TeamMemberData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<Omit<TeamMemberData, "id" | "order">>({
    name: "",
    role: "",
    bio: "",
    avatar_url: "",
    github_url: "",
    linkedin_url: "",
    twitter_url: "",
    email: "",
  });

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Track which avatars failed to load
  const [failedAvatars, setFailedAvatars] = useState<Set<string>>(new Set());

  // Image upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isCropMode, setIsCropMode] = useState(false);
  const [selectedFileForCrop, setSelectedFileForCrop] = useState<File | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMemberData | null>(null);

  // Crop state
  const [cropMode, setCropMode] = useState<"none" | "rectangle" | "circle">("none");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cropAreaStyle, setCropAreaStyle] = useState<React.CSSProperties>({});
  const [imageDisplaySize, setImageDisplaySize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  // Reset crop mode when dialog closes
  useEffect(() => {
    if (!isAdding && editingId === null) {
      setIsCropMode(false);
      setSelectedFileForCrop(null);
      setImageSrc(null);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setCropAreaStyle({});
      setCropMode("none");
    }
  }, [isAdding, editingId]);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      // Reset failed avatars when reloading members
      setFailedAvatars(new Set());
      const data = await getTeamMembers();
      setMembers(data);
    } catch (error) {
      logger.error("Failed to load team members", {}, error instanceof Error ? error : undefined);
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFileForCrop(file);
    setIsCropMode(true);
    // Load image for cropping
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
    return centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight
      ),
      mediaWidth,
      mediaHeight
    );
  }

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      // Wait for CSS to apply, then get displayed size
      requestAnimationFrame(() => {
        const rect = img.getBoundingClientRect();
        const displayedWidth = rect.width;
        const displayedHeight = rect.height;

        // Store the displayed size so we can set explicit dimensions
        if (displayedWidth > 0 && displayedHeight > 0) {
          setImageDisplaySize({ width: displayedWidth, height: displayedHeight });

          if (cropMode !== "none" && !crop) {
            setCrop(centerAspectCrop(displayedWidth, displayedHeight, 1));
          }
        }
      });
    },
    [cropMode, crop]
  );

  // Reset crop when mode changes
  useEffect(() => {
    if (isCropMode && imageSrc) {
      if (cropMode === "none") {
        setCrop(undefined);
        setCompletedCrop(undefined);
        setCropAreaStyle({});
      } else if (cropMode === "rectangle" || cropMode === "circle") {
        // Wait for image to be rendered and CSS to apply, then get displayed size
        const timer = setTimeout(() => {
          if (imgRef.current) {
            const rect = imgRef.current.getBoundingClientRect();
            const displayedWidth = rect.width;
            const displayedHeight = rect.height;
            if (displayedWidth > 0 && displayedHeight > 0) {
              setImageDisplaySize({ width: displayedWidth, height: displayedHeight });
              setCrop(centerAspectCrop(displayedWidth, displayedHeight, 1));
            }
          }
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [cropMode, isCropMode, imageSrc]);

  // Calculate circular overlay position based on crop
  useEffect(() => {
    if (cropMode !== "circle" || !crop || !imgRef.current || !containerRef.current) {
      setCropAreaStyle({});
      return;
    }

    const updateCropArea = () => {
      if (!imgRef.current || !containerRef.current) return;

      const imgRect = imgRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      const cropWidth = (crop.width / 100) * imgRect.width;
      const cropHeight = (crop.height / 100) * imgRect.height;
      const cropLeft = (crop.x / 100) * imgRect.width + (imgRect.left - containerRect.left);
      const cropTop = (crop.y / 100) * imgRect.height + (imgRect.top - containerRect.top);

      setCropAreaStyle({
        position: "absolute",
        left: `${cropLeft}px`,
        top: `${cropTop}px`,
        width: `${cropWidth}px`,
        height: `${cropHeight}px`,
        borderRadius: "50%",
        border: "2px solid white",
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
        pointerEvents: "none",
        zIndex: 10,
      });
    };

    updateCropArea();
    const interval = setInterval(updateCropArea, 50);

    return () => clearInterval(interval);
  }, [cropMode, crop, imageSrc]);

  const getCroppedImg = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("No 2d context"));
          return;
        }

        // Use getBoundingClientRect to get the actual displayed size
        const rect = image.getBoundingClientRect();
        const displayedWidth = rect.width;
        const displayedHeight = rect.height;

        // Calculate scale factors based on displayed size
        const scaleX = image.naturalWidth / displayedWidth;
        const scaleY = image.naturalHeight / displayedHeight;

        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;

        if (cropMode === "circle") {
          ctx.beginPath();
          ctx.arc(
            canvas.width / 2,
            canvas.height / 2,
            Math.min(canvas.width, canvas.height) / 2,
            0,
            2 * Math.PI
          );
          ctx.clip();
        }

        ctx.drawImage(
          image,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          canvas.width,
          canvas.height
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas is empty"));
              return;
            }
            resolve(blob);
          },
          "image/png",
          1
        );
      });
    },
    [cropMode]
  );

  const handleApplyCrop = async () => {
    if (cropMode === "none") {
      // No crop - use original file
      if (selectedFileForCrop) {
        await handleCropComplete(
          new Blob([selectedFileForCrop], { type: selectedFileForCrop.type })
        );
      } else {
        setIsCropMode(false);
        setSelectedFileForCrop(null);
        setImageSrc(null);
      }
      return;
    }

    if (!imgRef.current || !completedCrop) {
      logger.error("Cannot crop: missing image or crop data");
      return;
    }

    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      await handleCropComplete(croppedBlob);
    } catch (error) {
      logger.error("Failed to crop image", {}, error instanceof Error ? error : undefined);
      toast({
        title: "Error",
        description: "Failed to crop image",
        variant: "destructive",
      });
    }
  };

  const handleCancelCrop = () => {
    setIsCropMode(false);
    setSelectedFileForCrop(null);
    setImageSrc(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setCropAreaStyle({});
    setCropMode("none");
  };

  const handleCropComplete = async (croppedBlob: Blob | null) => {
    if (!croppedBlob) {
      setIsCropMode(false);
      setSelectedFileForCrop(null);
      setImageSrc(null);
      return;
    }

    try {
      setIsUploadingAvatar(true);

      // Convert blob to file
      const croppedFile = new File([croppedBlob], "avatar.png", {
        type: croppedBlob.type || "image/png",
      });

      // Upload to CrunchyCone storage
      const formData = new FormData();
      formData.append("file", croppedFile);
      formData.append("visibility", "public");
      formData.append("folder", "team");

      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      const avatarUrl = result.url || result.filePath;
      setFormData((prev) => ({ ...prev, avatar_url: avatarUrl }));
      toast({
        title: "Success",
        description: "Avatar uploaded successfully",
      });

      // Exit crop mode
      setIsCropMode(false);
      setSelectedFileForCrop(null);
      setImageSrc(null);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setCropAreaStyle({});
      setCropMode("none");
    } catch (error) {
      logger.error("Failed to upload avatar", {}, error instanceof Error ? error : undefined);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarUpload = async (file: File): Promise<string | null> => {
    try {
      setIsUploadingAvatar(true);

      // Upload to CrunchyCone storage
      const formData = new FormData();
      formData.append("file", file);
      formData.append("visibility", "public");
      formData.append("folder", "team");

      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      const avatarUrl = result.url || result.filePath;
      setFormData((prev) => ({ ...prev, avatar_url: avatarUrl }));
      toast({
        title: "Success",
        description: "Avatar uploaded successfully",
      });

      return avatarUrl;
    } catch (error) {
      logger.error("Failed to upload avatar", {}, error instanceof Error ? error : undefined);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarUrlSelect = (url: string) => {
    setFormData((prev) => ({ ...prev, avatar_url: url }));
    toast({
      title: "Success",
      description: "Avatar selected",
    });
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      name: "",
      role: "",
      bio: "",
      avatar_url: "",
      github_url: "",
      linkedin_url: "",
      twitter_url: "",
      email: "",
    });
  };

  const handleEdit = (member: TeamMemberData) => {
    setEditingId(member.id!);
    setIsAdding(false);
    setFormData({
      name: member.name,
      role: member.role,
      bio: member.bio || "",
      avatar_url: member.avatar_url || "",
      github_url: member.github_url || "",
      linkedin_url: member.linkedin_url || "",
      twitter_url: member.twitter_url || "",
      email: member.email || "",
    });
  };

  const handleCancel = () => {
    if (isCropMode) {
      handleCancelCrop();
      return;
    }
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: "",
      role: "",
      bio: "",
      avatar_url: "",
      github_url: "",
      linkedin_url: "",
      twitter_url: "",
      email: "",
    });
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        // Set order to end of list
        const newOrder = members.length;
        const result = await createTeamMember({ ...formData, order: newOrder });
        if (result.success) {
          toast({
            title: "Success",
            description: "Team member added successfully",
          });
          handleCancel();
          loadMembers();
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to add team member",
            variant: "destructive",
          });
        }
      } else if (editingId) {
        // Keep existing order when updating
        const existingMember = members.find((m) => m.id === editingId);
        const result = await updateTeamMember(editingId, {
          ...formData,
          order: existingMember?.order || 0,
        });
        if (result.success) {
          toast({
            title: "Success",
            description: "Team member updated successfully",
          });
          handleCancel();
          loadMembers();
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update team member",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      logger.error("Failed to save team member", {}, error instanceof Error ? error : undefined);
      toast({
        title: "Error",
        description: "Failed to save team member",
        variant: "destructive",
      });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", index.toString());
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if we're actually leaving the element (not entering a child)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newMembers = [...members];
    const draggedMember = newMembers[draggedIndex];
    newMembers.splice(draggedIndex, 1);
    newMembers.splice(dropIndex, 0, draggedMember);

    // Update order in database
    const memberIds = newMembers.map((m) => m.id!);
    const result = await reorderTeamMembers(memberIds);

    if (result.success) {
      // Update local state with new order
      setMembers(newMembers.map((m, i) => ({ ...m, order: i })));
      toast({
        title: "Success",
        description: "Team members reordered successfully",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to reorder team members",
        variant: "destructive",
      });
      // Reload to restore original order
      loadMembers();
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDeleteClick = (member: TeamMemberData) => {
    setMemberToDelete(member);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete?.id) return;

    try {
      const result = await deleteTeamMember(memberToDelete.id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Team member deleted successfully",
        });
        setMemberToDelete(null);
        loadMembers();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete team member",
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error("Failed to delete team member", {}, error instanceof Error ? error : undefined);
      toast({
        title: "Error",
        description: "Failed to delete team member",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCancel = () => {
    setMemberToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AdminBreadcrumb sectionName="Team Settings" />
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        sectionName="Team Settings"
        actionButtons={
          !isAdding && !editingId ? (
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          ) : null
        }
      />

      {/* Add/Edit Dialog */}
      <Dialog
        open={isAdding || editingId !== null}
        onOpenChange={(open) => !open && handleCancel()}
      >
        <DialogContent
          className={`max-w-2xl max-h-[90vh] grid grid-rows-[auto_1fr_auto] p-0 overflow-hidden ${isCropMode ? "[&>button]:hidden" : ""}`}
        >
          {isCropMode ? (
            <>
              {/* Header - Fixed */}
              <div className="border-b bg-background p-6 pb-4">
                <DialogHeader className="flex flex-row items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancelCrop}
                    className="h-8 w-8 -ml-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <DialogTitle className="flex-1">Crop Image</DialogTitle>
                </DialogHeader>
              </div>

              {/* Content Area - Flexible */}
              <div className="px-6 pt-4 overflow-hidden grid grid-rows-[auto_1fr] min-h-0">
                {/* Tabs - Fixed */}
                <div className="mb-4">
                  <Tabs
                    value={cropMode}
                    onValueChange={(value) => setCropMode(value as "none" | "rectangle" | "circle")}
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="none">No Crop</TabsTrigger>
                      <TabsTrigger value="rectangle">Rectangle</TabsTrigger>
                      <TabsTrigger value="circle">Circle</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Image Container - Takes remaining space */}
                {imageSrc && (
                  <div className="min-h-0 flex items-center justify-center overflow-hidden">
                    <div
                      ref={containerRef}
                      className="relative w-full h-full flex items-center justify-center"
                    >
                      {/* Circular overlay mask */}
                      {cropMode === "circle" && crop && Object.keys(cropAreaStyle).length > 0 && (
                        <div style={cropAreaStyle} />
                      )}
                      {/* Hide default crop selection border for circular mode */}
                      {cropMode !== "none" ? (
                        <ReactCrop
                          crop={crop}
                          onChange={(_, percentCrop) => {
                            setCrop(percentCrop);
                          }}
                          onComplete={(c) => {
                            setCompletedCrop(c);
                          }}
                          aspect={1}
                          className={`${cropMode === "circle" ? "circular-crop-mode" : ""}`}
                        >
                          <img
                            ref={imgRef}
                            alt="Crop me"
                            src={imageSrc}
                            style={{
                              display: "block",
                              maxWidth: "100%",
                              maxHeight: "100%",
                              width: imageDisplaySize ? `${imageDisplaySize.width}px` : "auto",
                              height: imageDisplaySize ? `${imageDisplaySize.height}px` : "auto",
                              objectFit: "contain",
                            }}
                            onLoad={onImageLoad}
                          />
                        </ReactCrop>
                      ) : (
                        <img
                          ref={imgRef}
                          alt="Preview"
                          src={imageSrc}
                          style={{
                            display: "block",
                            maxWidth: "100%",
                            maxHeight: "100%",
                            width: "auto",
                            height: "auto",
                            objectFit: "contain",
                          }}
                          onLoad={onImageLoad}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer - Fixed */}
              <DialogFooter className="border-t bg-background p-4 flex justify-center gap-2">
                <Button variant="outline" onClick={handleCancelCrop}>
                  Cancel
                </Button>
                <Button onClick={handleApplyCrop}>
                  {cropMode === "none" ? "Use Original" : "Apply Crop"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="sticky top-0 z-10 border-b bg-background p-6 pb-4">
                <DialogHeader>
                  <DialogTitle>{isAdding ? "Add Team Member" : "Edit Team Member"}</DialogTitle>
                </DialogHeader>
              </div>
              <div className="p-6 pt-4 overflow-y-auto flex-1">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Avatar</label>
                      <AvatarUpload
                        onUpload={handleAvatarUpload}
                        onUrlSelect={handleAvatarUrlSelect}
                        currentUrl={formData.avatar_url || undefined}
                        isUploading={isUploadingAvatar}
                        accept="image/*"
                        maxSize={5}
                        name={formData.name}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, name: e.target.value }))
                          }
                          placeholder="John Doe"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <Input
                          value={formData.role}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, role: e.target.value }))
                          }
                          placeholder="Founder & CEO"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bio</label>
                      <Textarea
                        value={formData.bio}
                        onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                        placeholder="Building products that developers love..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">GitHub URL</label>
                        <Input
                          value={formData.github_url}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, github_url: e.target.value }))
                          }
                          placeholder="https://github.com/username"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">LinkedIn URL</label>
                        <Input
                          value={formData.linkedin_url}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, linkedin_url: e.target.value }))
                          }
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Twitter URL</label>
                        <Input
                          value={formData.twitter_url}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, twitter_url: e.target.value }))
                          }
                          placeholder="https://twitter.com/username"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, email: e.target.value }))
                          }
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="border-t bg-background p-4 flex justify-center gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={memberToDelete !== null} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team Member</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <strong>{memberToDelete?.name}</strong>? This action
              cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Members List */}
      <div className="space-y-4">
        {members.map((member, index) => {
          // Generate initials for avatar
          const getInitials = (name: string) => {
            if (!name) return "??";
            const parts = name.trim().split(/\s+/);
            if (parts.length >= 2) {
              return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
          };

          const initials = getInitials(member.name);
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <Card
              key={member.id}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={(e) => handleDragLeave(e)}
              onDrop={(e) => handleDrop(e, index)}
              className={cn(
                "transition-all",
                isDragging && "opacity-50",
                isDragOver && "border-primary border-2"
              )}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Drag handle */}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      className="cursor-move text-muted-foreground hover:text-foreground transition-colors pt-1"
                    >
                      <GripVertical className="h-5 w-5" />
                    </div>

                    {/* Avatar */}
                    {member.avatar_url && member.id && !failedAvatars.has(member.id) ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-16 h-16 rounded-full object-cover"
                        onError={(e) => {
                          logger.debug("Avatar image failed to load", {
                            memberId: member.id,
                            avatarUrl: member.avatar_url,
                          });
                          if (member.id) {
                            setFailedAvatars((prev) => {
                              const newSet = new Set(prev);
                              newSet.add(member.id!);
                              return newSet;
                            });
                          }
                          // Hide the broken image
                          e.currentTarget.style.display = "none";
                        }}
                        onLoad={(e) => {
                          // Show the image if it loads successfully
                          e.currentTarget.style.display = "block";
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xl font-semibold text-muted-foreground">
                          {initials}
                        </span>
                      </div>
                    )}

                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                      {member.bio && (
                        <p className="text-sm text-muted-foreground mt-2">{member.bio}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        {member.github_url && <span>GitHub</span>}
                        {member.linkedin_url && <span>LinkedIn</span>}
                        {member.twitter_url && <span>Twitter</span>}
                        {member.email && <span>Email</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(member)}>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(member)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {members.length === 0 && !isAdding && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No team members yet. Click "Add Team Member" to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
