"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logger } from "@/lib/logger";

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  onCropComplete: (croppedImageBlob: Blob | null) => void;
  aspect?: number;
}

type CropMode = "none" | "rectangle" | "circle";

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

export function ImageCropper({
  open,
  onOpenChange,
  imageFile,
  onCropComplete,
  aspect = 1,
}: ImageCropperProps) {
  const [cropMode, setCropMode] = useState<CropMode>("none");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cropAreaStyle, setCropAreaStyle] = useState<React.CSSProperties>({});
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image when file changes
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else {
      setImageSrc(null);
    }
  }, [imageFile]);

  // Reset crop when mode changes
  useEffect(() => {
    if (cropMode === "none") {
      setCrop(undefined);
      setCompletedCrop(undefined);
      setCropAreaStyle({});
    } else if (cropMode === "rectangle" || cropMode === "circle") {
      // Initialize crop when switching to crop mode
      if (imgRef.current) {
        const { width, height } = imgRef.current;
        setCrop(centerAspectCrop(width, height, aspect));
      }
    }
  }, [cropMode, aspect]);

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

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (cropMode !== "none" && aspect && !crop) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspect));
      }
    },
    [aspect, cropMode, crop]
  );

  const getCroppedImg = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("No 2d context"));
          return;
        }

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;

        if (cropMode === "circle") {
          // Create circular crop
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

  const handleCropComplete = async () => {
    if (cropMode === "none") {
      // No crop - return original file
      if (imageFile) {
        const blob = new Blob([imageFile], { type: imageFile.type });
        onCropComplete(blob);
      } else {
        onCropComplete(null);
      }
      onOpenChange(false);
      return;
    }

    if (!imgRef.current || !completedCrop) {
      logger.error("Cannot crop: missing image or crop data");
      return;
    }

    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      onCropComplete(croppedBlob);
      onOpenChange(false);
      setCrop(undefined);
      setCompletedCrop(undefined);
    } catch (error) {
      logger.error("Failed to crop image", {}, error instanceof Error ? error : undefined);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setCropAreaStyle({});
    setCropMode("none");
  };

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      setCropAreaStyle({});
      setCropMode("none");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 pb-0 overflow-hidden z-[200]">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Crop Mode Tabs */}
            <Tabs value={cropMode} onValueChange={(value) => setCropMode(value as CropMode)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="none">No Crop</TabsTrigger>
                <TabsTrigger value="rectangle">Rectangle</TabsTrigger>
                <TabsTrigger value="circle">Circle</TabsTrigger>
              </TabsList>
            </Tabs>

            {imageSrc && (
              <div className="flex flex-col items-center">
                <div ref={containerRef} className="relative inline-block">
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
                      aspect={aspect}
                      className={`max-w-full ${cropMode === "circle" ? "circular-crop-mode" : ""}`}
                    >
                      <img
                        ref={imgRef}
                        alt="Crop me"
                        src={imageSrc}
                        style={{ maxWidth: "100%", maxHeight: "70vh", display: "block" }}
                        onLoad={onImageLoad}
                      />
                    </ReactCrop>
                  ) : (
                    <img
                      ref={imgRef}
                      alt="Preview"
                      src={imageSrc}
                      style={{ maxWidth: "100%", maxHeight: "70vh", display: "block" }}
                      onLoad={onImageLoad}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t bg-background p-4 flex justify-center gap-2 mt-auto">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleCropComplete}>
            {cropMode === "none" ? "Use Original" : "Apply Crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
