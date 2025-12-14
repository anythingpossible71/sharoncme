"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { User, Settings, Menu, Home, Users, Mail, Inbox, BookOpen } from "lucide-react";
import type { Prisma } from "@prisma/client";

// User type with included relations from getCurrentUser
type UserWithRoles = Prisma.UserGetPayload<{
  include: {
    profile: true;
    roles: {
      include: {
        role: true;
      };
    };
  };
}>;

interface PageHeaderProps {
  currentUser: UserWithRoles | null;
  appName?: string;
  appLogoUrl?: string;
}

export function PageHeader({ currentUser, appName = "Your App", appLogoUrl }: PageHeaderProps) {
  // Check if we're in an iframe synchronously (runs immediately, no delay)
  const [isInIframe] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const inIframe = window.self !== window.top;
      if (inIframe) {
        console.log("🔵 [PageHeader] Iframe identified:", {
          url: window.location.href,
          pathname: window.location.pathname,
          origin: window.location.origin,
        });
      }
      return inIframe;
    } catch (e) {
      console.log("🔵 [PageHeader] Iframe identified (cross-origin):", {
        url: window.location.href,
        pathname: window.location.pathname,
        origin: window.location.origin,
        error: e instanceof Error ? e.message : String(e),
      });
      return true;
    }
  });

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
        isInIframe ? "bg-purple-600/95" : "bg-background/95"
      }`}
    >
      <div className="h-[74px] flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          {/* App Icon - Show logo if exists, otherwise placeholder */}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${appLogoUrl ? "" : "bg-muted"}`}
          >
            {appLogoUrl ? (
              <img
                src={appLogoUrl}
                alt={appName || "App logo"}
                className={`w-full h-full ${appLogoUrl.toLowerCase().endsWith(".svg") ? "object-contain" : "object-cover"}`}
              />
            ) : null}
          </div>
          <Link href="/" className="font-bold text-xl">
            {appName}
          </Link>
        </div>

        <div className="flex items-center space-x-4 ml-auto">
          <ThemeToggle />

          {currentUser ? (
            // Signed in mode - existing avatar dropdown
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.image || ""} alt={currentUser.name || ""} />
                    <AvatarFallback>
                      {currentUser.name?.charAt(0) || currentUser.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <SignOutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Unsigned mode - sign in button only
            <Button variant="outline" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          )}

          {/* Navigation Menu - positioned to the right of avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Navigation menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/" className="flex items-center">
                  <Home className="mr-2 h-4 w-4" />
                  <span>Home</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/about" className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  <span>About us</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/contact" className="flex items-center">
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Contact us</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/blog" className="flex items-center">
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>Blog</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>App admin</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/contact-us-inbox" className="flex items-center">
                  <Inbox className="mr-2 h-4 w-4" />
                  <span>Inbox</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
