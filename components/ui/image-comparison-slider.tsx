"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface ImageComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  maxWidth?: number;
}

export function ImageComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  className = "",
  maxWidth = 800,
}: ImageComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [containerHeight, setContainerHeight] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Listen to the height of the anchor image and set container height accordingly
  useEffect(() => {
    const updateHeight = () => {
      if (imageRef.current) {
        const imgHeight = imageRef.current.offsetHeight;
        setContainerHeight(imgHeight);
      }
    };

    // Initial height calculation
    updateHeight();

    // Listen for image load
    const img = imageRef.current;
    if (img) {
      img.addEventListener("load", updateHeight);
      return () => img.removeEventListener("load", updateHeight);
    }
  }, [beforeImage]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <div className={`relative ${className}`}>
      {/* Container with max width and dynamic height */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg shadow-lg"
        style={{
          maxWidth: `${maxWidth}px`,
          height: `${containerHeight}px`,
          width: "100%",
        }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseLeave={() => setSliderPosition(50)}
      >
        {/* Before Image (Background) */}
        <div className="absolute inset-0">
          <Image src={beforeImage} alt={beforeLabel} fill className="object-cover" priority />
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-medium">
            {beforeLabel}
          </div>
        </div>

        {/* After Image (Clipped) */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        >
          <Image ref={imageRef} src={afterImage} alt={afterLabel} fill className="object-cover" />
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-medium">
            {afterLabel}
          </div>
        </div>

        {/* Slider Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Slider Handle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-300 cursor-grab active:cursor-grabbing flex items-center justify-center">
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-1 h-4 bg-gray-400"></div>
              <div className="w-1 h-4 bg-gray-400 ml-0.5"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-sm text-muted-foreground mt-2 text-center">
        Drag the slider to compare images
      </p>
    </div>
  );
}
