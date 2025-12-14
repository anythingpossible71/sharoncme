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
} from "@/components/admin-ui/dialog";
import { Button } from "@/components/admin-ui/button";
import { logger } from "@/lib/logger";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  onCropComplete: (croppedImageBlob: Blob) => void;
  aspect?: number;
  circular?: boolean;
}

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

export function ImageCropDialog({
  open,
  onOpenChange,
  imageFile,
  onCropComplete,
  aspect = 1,
  circular = true,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cropAreaStyle, setCropAreaStyle] = useState<React.CSSProperties>({});
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  // Calculate circular overlay position based on crop
  useEffect(() => {
    if (!circular || !crop || !imgRef.current || !containerRef.current) {
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
  }, [circular, crop, imageSrc]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (aspect) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspect));
      }
    },
    [aspect]
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

        if (circular) {
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
    [circular]
  );

  const handleCropComplete = async () => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {imageSrc && (
            <div className="flex flex-col items-center">
              <div ref={containerRef} className="relative inline-block">
                {/* Circular overlay mask */}
                {circular && crop && Object.keys(cropAreaStyle).length > 0 && (
                  <div style={cropAreaStyle} />
                )}
                {/* Hide default crop selection border for circular mode */}
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => {
                    setCrop(percentCrop);
                  }}
                  onComplete={(c) => {
                    setCompletedCrop(c);
                  }}
                  aspect={aspect}
                  className={`max-w-full ${circular ? "circular-crop-mode" : ""}`}
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imageSrc}
                    style={{ maxWidth: "100%", maxHeight: "70vh", display: "block" }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </div>
              {circular && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  The image will be cropped to a circle
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCropComplete} disabled={!completedCrop}>
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
