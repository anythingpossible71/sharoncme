"use client";
import { logger } from "@/lib/logger";

export function ClientCrash() {
  // Explicitly log to console before throwing
  logger.error("Intentional client-side crash: testing console log capture");
  logger.info("This is a test log message");
  logger.warn("This is a test warning");

  // Then throw an error
  throw new Error("Intentional client-side crash: testing console log capture");
}
