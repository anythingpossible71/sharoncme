"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Rocket } from "lucide-react";
import confetti from "canvas-confetti";
import { checkPublishStatus } from "@/app/actions/check-publish-status";
import { checkBuildStatus, type BuildStatus } from "@/app/actions/check-build-status";
import { getCurrentCommitSha } from "@/app/actions/get-current-commit";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";
import { AlreadyPublishedDialog } from "./AlreadyPublishedDialog";
import { BuildingInProgressDialog } from "./BuildingInProgressDialog";

type PublishState =
  | "idle"
  | "waiting"
  | "building"
  | "deploying"
  | "success"
  | "failed"
  | "canceled";

interface PublishButtonProps {
  publishUrl?: string;
  className?: string;
}

export function PublishButton({
  publishUrl = "https://myproject.crunchycone.dev",
  className = "",
}: PublishButtonProps) {
  const [state, setState] = useState<PublishState>("idle");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showAlreadyPublishedDialog, setShowAlreadyPublishedDialog] = useState(false);
  const [showBuildingDialog, setShowBuildingDialog] = useState(false);
  const [actualPublishUrl, setActualPublishUrl] = useState<string>(publishUrl);

  const waitingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const waitingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buildIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const expectedCommitRef = useRef<string | null>(null);

  // 2 minute timeout for waiting state
  const WAITING_TIMEOUT_MS = 2 * 60 * 1000;

  // Fetch build status on mount (non-blocking)
  useEffect(() => {
    const fetchInitialStatus = async () => {
      try {
        const response = await fetch("/api/admin/build-status");
        const data = await response.json();

        if (data.success && data.status) {
          const status = data.status as BuildStatus;
          if (status === "pending" || status === "running" || status === "deploying") {
            // Build in progress - update state and start polling
            setState(status === "deploying" ? "deploying" : "building");
            startBuildPolling();
          }
        }
      } catch {
        // Silently fail - just means we don't know initial status
      }
    };

    fetchInitialStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup intervals and timeouts on unmount
  useEffect(() => {
    return () => {
      if (waitingIntervalRef.current) {
        clearInterval(waitingIntervalRef.current);
      }
      if (waitingTimeoutRef.current) {
        clearTimeout(waitingTimeoutRef.current);
      }
      if (buildIntervalRef.current) {
        clearInterval(buildIntervalRef.current);
      }
    };
  }, []);

  const triggerConfetti = () => {
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

      // Left side confetti burst
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });

      // Right side confetti burst
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const clearWaitingTimers = () => {
    if (waitingIntervalRef.current) {
      clearInterval(waitingIntervalRef.current);
      waitingIntervalRef.current = null;
    }
    if (waitingTimeoutRef.current) {
      clearTimeout(waitingTimeoutRef.current);
      waitingTimeoutRef.current = null;
    }
  };

  const startWaitingPolling = () => {
    // Start polling for push completion
    waitingIntervalRef.current = setInterval(async () => {
      try {
        const result = await checkPublishStatus();

        if (!result.needsCommit) {
          // Clean up waiting timers
          clearWaitingTimers();

          // Get the current commit SHA before starting build polling
          const commitSha = await getCurrentCommitSha();
          expectedCommitRef.current = commitSha;

          // Close unsaved dialog and start building
          setShowUnsavedDialog(false);
          setState("building");
          startBuildPolling();
        }
      } catch (error) {
        console.error("Error polling publish status:", error);
      }
    }, 2000); // Poll every 2 seconds

    // Start 2-minute timeout
    waitingTimeoutRef.current = setTimeout(() => {
      // Timeout reached - push didn't complete in time
      clearWaitingTimers();
      setShowUnsavedDialog(false);
      setState("idle");
      console.warn("Push operation timed out after 2 minutes");
    }, WAITING_TIMEOUT_MS);
  };

  const startBuildPolling = () => {
    buildIntervalRef.current = setInterval(async () => {
      try {
        const result = await checkBuildStatus();

        // If we're waiting for a specific commit, check if this build matches
        if (expectedCommitRef.current && result.commitSha) {
          if (result.commitSha !== expectedCommitRef.current) {
            // This build is for a different commit (probably the previous one)
            // Keep polling until we see our commit
            console.log(
              "Waiting for build with commit:",
              expectedCommitRef.current.substring(0, 7)
            );
            return;
          }
        }

        if (result.status === "success") {
          // Stop polling
          if (buildIntervalRef.current) {
            clearInterval(buildIntervalRef.current);
            buildIntervalRef.current = null;
          }
          // Clear expected commit
          expectedCommitRef.current = null;

          // Update publish URL if available
          if (result.publishUrl) {
            setActualPublishUrl(result.publishUrl);
          }

          // Update state and show success
          setState("success");
          triggerConfetti();
        } else if (result.status === "failed" || result.status === "canceled") {
          // Stop polling
          if (buildIntervalRef.current) {
            clearInterval(buildIntervalRef.current);
            buildIntervalRef.current = null;
          }
          // Clear expected commit
          expectedCommitRef.current = null;

          // Update state and show error
          setState(result.status);
        } else if (result.status === "deploying") {
          // Update state to deploying (keep polling)
          setState("deploying");
        }
        // Keep polling if status is "pending", "running", or "deploying"
      } catch (error) {
        console.error("Error polling build status:", error);
        // Could show error dialog here
      }
    }, 3000); // Poll every 3 seconds
  };

  const handlePublishClick = async () => {
    // If building or deploying, show the building in progress dialog
    if (state === "building" || state === "deploying") {
      setShowBuildingDialog(true);
      return;
    }

    if (state !== "idle") return;

    try {
      const result = await checkPublishStatus();

      if (result.needsCommit) {
        // Show unsaved changes dialog
        setShowUnsavedDialog(true);
      } else {
        // No changes - show already published dialog
        setShowAlreadyPublishedDialog(true);
      }
    } catch (error) {
      console.error("Error checking publish status:", error);
      // Could show error toast here
    }
  };

  const handleConfirmUnsaved = () => {
    // User confirmed they ran the prompt
    setState("waiting");
    startWaitingPolling();
  };

  const handleCancelUnsaved = () => {
    clearWaitingTimers();
    setShowUnsavedDialog(false);
    setState("idle");
  };

  const handleCloseAlreadyPublished = () => {
    setShowAlreadyPublishedDialog(false);
  };

  const handleCloseBuildingDialog = () => {
    setShowBuildingDialog(false);
  };

  const getButtonText = () => {
    switch (state) {
      case "idle":
        return "Publish";
      case "waiting":
        return "Waiting...";
      case "building":
        return "Building";
      case "deploying":
        return "Deploying";
      default:
        return "Publish";
    }
  };

  const isButtonDisabled = state === "waiting";
  const showShimmer = state === "waiting" || state === "building" || state === "deploying";

  return (
    <>
      {/* Publish Button with Popover for Unsaved Changes */}
      <Popover open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <PopoverTrigger asChild>
          <Button
            onClick={handlePublishClick}
            disabled={isButtonDisabled}
            className={`relative overflow-hidden ${showShimmer ? "animate-shimmer" : ""} ${className}`}
          >
            {showShimmer && (
              <div
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{
                  animation: "shimmer 2s infinite",
                }}
              />
            )}
            <Rocket className="h-4 w-4 mr-2" />
            <span className="relative z-10">{getButtonText()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="end">
          <UnsavedChangesDialog onPromptRun={handleConfirmUnsaved} onCancel={handleCancelUnsaved} />
        </PopoverContent>
      </Popover>

      {/* Already Published Dialog */}
      <AlreadyPublishedDialog
        isOpen={showAlreadyPublishedDialog}
        onClose={handleCloseAlreadyPublished}
        publishUrl={actualPublishUrl}
      />

      {/* Building In Progress Dialog */}
      <BuildingInProgressDialog
        isOpen={showBuildingDialog}
        onClose={handleCloseBuildingDialog}
        state={state === "deploying" ? "deploying" : "building"}
      />
    </>
  );
}
