"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin-ui/card";
import { Button } from "@/components/admin-ui/button";
import { Input } from "@/components/admin-ui/input";
import { PasswordInput } from "@/components/admin-ui/password-input";
import { Separator } from "@/components/admin-ui/separator";
import Image from "next/image";
import Link from "next/link";
import { logger } from "@/lib/logger";

export default function MockCCAuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock - no real sign in flow
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleOAuthSignIn = (provider: "google" | "github") => {
    // Mock - no real OAuth flow
    logger.info(`Mock sign in with ${provider}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <svg
              width="48"
              height="48"
              viewBox="0 0 43 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                ['--scoop-color' as string]: 'hsl(var(--primary))',
              }}
            >
              {/* Ice cream scoop - synced with theme primary color */}
              <path
                d="M35.0692 15.0273C35.0692 11.5722 33.6175 8.25869 31.0335 5.8156C28.4494 3.37251 24.9447 2 21.2904 2C17.636 2 14.1313 3.37251 11.5473 5.8156C8.96322 8.25869 7.51153 11.5722 7.51153 15.0273"
                fill="var(--scoop-color)"
              />
              <path
                d="M35.0692 15.0273C36.5309 15.0273 37.9328 15.5763 38.9664 16.5535C40 17.5308 40.5807 18.8562 40.5807 20.2382C40.5807 21.6202 40 22.9456 38.9664 23.9229C37.9328 24.9001 36.5309 25.4491 35.0692 25.4491H7.51153C6.04978 25.4491 4.6479 24.9001 3.61429 23.9229C2.58068 22.9456 2 21.6202 2 20.2382C2 18.8562 2.58068 17.5308 3.61429 16.5535C4.6479 15.5763 6.04978 15.0273 7.51153 15.0273"
                fill="var(--scoop-color)"
              />
              <path
                d="M7.51153 25.4491H35.0692C36.5309 25.4491 37.9328 24.9001 38.9664 23.9229C40 22.9456 40.5807 21.6202 40.5807 20.2382C40.5807 18.8562 40 17.5308 38.9664 16.5535C37.9328 15.5763 36.5309 15.0273 35.0692 15.0273C35.0692 11.5722 33.6175 8.25869 31.0335 5.8156C28.4494 3.37251 24.9447 2 21.2904 2C17.636 2 14.1313 3.37251 11.5473 5.8156C8.96322 8.25869 7.51153 11.5722 7.51153 15.0273C6.04978 15.0273 4.6479 15.5763 3.61429 16.5535C2.58068 17.5308 2 18.8562 2 20.2382C2 21.6202 2.58068 22.9456 3.61429 23.9229C4.6479 24.9001 6.04978 25.4491 7.51153 25.4491Z"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Ice cream cone - white fill */}
              <path
                d="M7.51154 25.4492L18.7551 52.4157C18.9668 52.8857 19.3201 53.2864 19.7708 53.5681C20.2216 53.8498 20.75 54 21.2904 54C21.8307 54 22.3591 53.8498 22.8099 53.5681C23.2607 53.2864 23.6139 52.8857 23.8257 52.4157L35.0692 25.4492"
                fill="white"
              />
              <path
                d="M7.51154 25.4492L18.7551 52.4157C18.9668 52.8857 19.3201 53.2864 19.7708 53.5681C20.2216 53.8498 20.75 54 21.2904 54C21.8307 54 22.3591 53.8498 22.8099 53.5681C23.2607 53.2864 23.6139 52.8857 23.8257 52.4157L35.0692 25.4492H7.51154Z"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl">Welcome Builder</CardTitle>
          <CardDescription>
            Sign in to your Crunchy&lt;cone&gt; to manage your projects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OAuth Providers Section */}
          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">Sign in with</div>
            <div className="grid gap-2">
              <Button
                variant="outline"
                onClick={() => handleOAuthSignIn("google")}
                disabled={isLoading}
                className="w-full"
              >
                <Image
                  src="/icons/google-icon.svg"
                  alt="Google"
                  width={16}
                  height={16}
                  className="mr-2"
                />
                Sign in with Google
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOAuthSignIn("github")}
                disabled={isLoading}
                className="w-full"
              >
                <Image
                  src="/icons/github-icon.svg"
                  alt="GitHub"
                  width={16}
                  height={16}
                  className="mr-2"
                />
                Sign in with GitHub
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="#" className="text-primary hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

