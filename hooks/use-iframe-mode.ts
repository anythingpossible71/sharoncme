"use client";

import { useSearchParams } from "next/navigation";

/**
 * Hook to check if the current page is in iframe mode
 * @returns true if URL parameter ?mode=iframe is present
 */
export function useIframeMode(): boolean {
  const searchParams = useSearchParams();
  return searchParams.get("mode") === "iframe";
}
