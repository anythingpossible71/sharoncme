"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface Position {
  x: number;
  y: number;
}

export function AdminBackBubble() {
  // Check if we're in an iframe synchronously (runs immediately, no delay)
  const [isInIframe] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const inIframe = window.self !== window.top;
      if (inIframe) {
        console.log("🔵 [AdminBackBubble] Iframe identified - hiding bubble:", {
          url: window.location.href,
          pathname: window.location.pathname,
          origin: window.location.origin,
        });
      }
      return inIframe;
    } catch (e) {
      // Cross-origin iframe will throw, assume we're in iframe
      console.log("🔵 [AdminBackBubble] Iframe identified (cross-origin) - hiding bubble:", {
        url: window.location.href,
        pathname: window.location.pathname,
        origin: window.location.origin,
        error: e instanceof Error ? e.message : String(e),
      });
      return true;
    }
  });

  // Get initial corner from localStorage synchronously if available
  const getInitialCorner = (): Corner => {
    if (typeof window !== "undefined") {
      const savedCorner = localStorage.getItem("debugBubbleCorner") as Corner | null;
      return savedCorner || "bottom-right";
    }
    return "bottom-right";
  };

  const [corner, setCorner] = useState<Corner>(getInitialCorner());
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [_mounted, setMounted] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Check if showbubble=false is in URL params
  const shouldHideBubble = searchParams.get("showbubble") === "false";

  // Get position for a specific corner
  const getCornerPosition = useCallback((corner: Corner): Position => {
    const margin = 16;
    const size = 39; // Bubble size (reduced by 10% from 43px)
    const windowWidth = typeof window !== "undefined" ? window.innerWidth : 1920;
    const windowHeight = typeof window !== "undefined" ? window.innerHeight : 1080;

    switch (corner) {
      case "top-left":
        return { x: margin, y: margin };
      case "top-right":
        return { x: windowWidth - size - margin, y: margin };
      case "bottom-left":
        return { x: margin, y: windowHeight - size - margin };
      case "bottom-right":
        return { x: windowWidth - size - margin, y: windowHeight - size - margin };
    }
  }, []);

  // Calculate initial position immediately
  const [position, setPosition] = useState<Position>(() => {
    const initialCorner = getInitialCorner();
    return getCornerPosition(initialCorner);
  });

  // Calculate which corner is closest
  const getClosestCorner = useCallback(
    (x: number, y: number): Corner => {
      const windowWidth = typeof window !== "undefined" ? window.innerWidth : 1920;
      const windowHeight = typeof window !== "undefined" ? window.innerHeight : 1080;
      const threshold = 150; // Distance threshold for snapping

      const distances = {
        "top-left": Math.sqrt(x ** 2 + y ** 2),
        "top-right": Math.sqrt((windowWidth - x) ** 2 + y ** 2),
        "bottom-left": Math.sqrt(x ** 2 + (windowHeight - y) ** 2),
        "bottom-right": Math.sqrt((windowWidth - x) ** 2 + (windowHeight - y) ** 2),
      };

      let closestCorner: Corner = "bottom-right";
      let minDistance = Infinity;

      for (const [corner, distance] of Object.entries(distances)) {
        if (distance < minDistance) {
          minDistance = distance;
          closestCorner = corner as Corner;
        }
      }

      // Only snap if within threshold
      return minDistance < threshold ? closestCorner : corner;
    },
    [corner]
  );

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
      setIsDragging(true);
    }
  }, []);

  // Handle drag move
  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const newX = clientX - dragOffset.x;
      const newY = clientY - dragOffset.y;

      // Update position
      setPosition({ x: newX, y: newY });

      // Check for corner snapping
      const bubbleCenter = {
        x: newX + 19.5, // Half of bubble size (39px / 2)
        y: newY + 19.5,
      };

      const newCorner = getClosestCorner(bubbleCenter.x, bubbleCenter.y);
      if (newCorner !== corner) {
        setCorner(newCorner);
      }
    },
    [isDragging, dragOffset, corner, getClosestCorner]
  );

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // Snap to corner
    const cornerPos = getCornerPosition(corner);
    setPosition(cornerPos);

    // Save position to localStorage
    localStorage.setItem("debugBubbleCorner", corner);
  }, [isDragging, corner, getCornerPosition]);

  // Add drag event listeners
  useEffect(() => {
    if (isDragging) {
      const handleMove = (e: MouseEvent | TouchEvent) => handleDragMove(e);
      const handleEnd = () => handleDragEnd();

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleEnd);
      document.addEventListener("touchmove", handleMove, { passive: false });
      document.addEventListener("touchend", handleEnd);

      return () => {
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleEnd);
        document.removeEventListener("touchmove", handleMove);
        document.removeEventListener("touchend", handleEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Update position on mount once window dimensions are available
  useEffect(() => {
    setMounted(true);
    // Recalculate position once window is available (for accurate dimensions)
    const updatePosition = () => {
      // Re-read corner from localStorage to ensure we have the latest value
      const currentCorner = getInitialCorner();
      setCorner(currentCorner);
      const cornerPos = getCornerPosition(currentCorner);
      setPosition(cornerPos);
      // Also update the ref directly to ensure it's visible immediately
      if (bubbleRef.current) {
        bubbleRef.current.style.left = `${cornerPos.x}px`;
        bubbleRef.current.style.top = `${cornerPos.y}px`;
        bubbleRef.current.style.display = "flex"; // Ensure it's visible
        bubbleRef.current.style.visibility = "visible"; // Ensure it's visible
        bubbleRef.current.style.opacity = "1"; // Ensure it's visible
      }
    };

    // Wait for next frame to ensure window dimensions are available
    requestAnimationFrame(() => {
      updatePosition();
      // Also update after a short delay as backup
      setTimeout(updatePosition, 100);
    });
  }, [getCornerPosition]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Reposition to current corner when window resizes
      const cornerPos = getCornerPosition(corner);
      setPosition(cornerPos);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [corner]);

  // Early returns after all hooks are called
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  // Hide bubble if in iframe or showbubble=false is in URL params
  if (isInIframe || shouldHideBubble) {
    return null;
  }

  const handleBubbleClick = () => {
    // Don't navigate if we just finished dragging
    if (isDragging) return;
    // Navigate back to app (home page) in the same tab
    router.push("/");
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={!isDragging ? undefined : false}>
        <TooltipTrigger asChild>
          <div
            ref={bubbleRef}
            id="admin-back-bubble"
            className={`fixed z-[999999] flex items-center justify-center rounded-full bg-black/90 text-2xl shadow-lg ring-1 ring-white/10 dark:bg-white/90 dark:ring-black/10 select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{
              zIndex: 999999,
              left: `${position.x}px`,
              top: `${position.y}px`,
              width: "39px",
              height: "39px",
              transition: isDragging ? "none" : "none",
            }}
            role="button"
            aria-label="Back to app"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            onClick={(_e) => {
              if (!isDragging) {
                handleBubbleClick();
              }
            }}
          >
            <Home
              width={20}
              height={20}
              className="pointer-events-none text-white dark:text-black"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent
          side={corner === "top-left" || corner === "bottom-left" ? "right" : "left"}
          align="center"
          sideOffset={8}
          className="bg-black/90 dark:bg-white/90 text-white dark:text-black border-0 shadow-lg rounded-[40px] px-3 py-1.5 text-xs"
        >
          <p>Back to app</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
