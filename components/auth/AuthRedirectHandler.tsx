"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { logger } from "@/lib/logger";

export function AuthRedirectHandler() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  useEffect(() => {
    // Only redirect if user is authenticated and no specific callback URL
    if (status === "authenticated" && session?.user && !adminCheckComplete) {
      const callbackUrl = searchParams?.get("callbackUrl");

      logger.info("AuthRedirectHandler: User is authenticated", {
        email: session.user.email,
        callbackUrl,
      });

      // If no specific callback URL or callback is signin page, check user role
      if (!callbackUrl || callbackUrl.includes("/auth/signin")) {
        // Check if admin exists to prevent redirect loops
        fetch("/api/admin/check")
          .then((res) => res.json())
          .then(async (data) => {
            logger.info("AuthRedirectHandler: Admin check result", data);

            if (data.adminExists) {
              // Redirect all users (including admins) to root
              logger.info("AuthRedirectHandler: Redirecting to root");
              router.replace("/");
            } else {
              logger.info("AuthRedirectHandler: No admin exists, redirecting to setup");
              router.replace("/auth/setup-admin");
            }
          })
          .catch((error) => {
            logger.error("AuthRedirectHandler: Error checking admin status", error);
            // Fallback to root on error
            router.replace("/");
          })
          .finally(() => {
            setAdminCheckComplete(true);
          });
      } else {
        logger.info("AuthRedirectHandler: Redirecting to callback URL", { callbackUrl });
        router.replace(callbackUrl);
        setAdminCheckComplete(true);
      }
    }
  }, [status, session, router, searchParams, adminCheckComplete]);

  // Don't render anything visible
  return null;
}
