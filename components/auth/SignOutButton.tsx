"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions/auth";

interface SignOutButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  children?: React.ReactNode;
}

export function SignOutButton({
  className = "w-full",
  variant = "outline",
  children = "Sign Out",
}: SignOutButtonProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent double clicks

    setIsSigningOut(true);

    try {
      // Use server action to sign out (avoids CSRF issues with Turbopack)
      const result = await signOutAction({ redirectTo: "/" });

      if (result.success) {
        // Check if we're in an iframe
        const isInIframe = window.self !== window.top;

        if (isInIframe) {
          // In iframe: use window.location to navigate
          window.location.href = result.redirectTo;
        } else {
          // Not in iframe: use router
          router.push(result.redirectTo);
          router.refresh();
        }
      }
    } catch {
      // Fallback: just redirect to home
      window.location.replace("/");
    }

    setIsSigningOut(false);
  };

  return (
    <Button
      type="button"
      className={className}
      variant={variant}
      onClick={handleSignOut}
      disabled={isSigningOut}
    >
      {isSigningOut ? "Signing out..." : children}
    </Button>
  );
}
