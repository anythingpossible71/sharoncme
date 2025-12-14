"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { Mail } from "lucide-react";
import { hasMagicLinkProvider } from "@/lib/auth/providers";

const forgotPasswordSchema = z.object({
  email: z.string().email({ error: "Invalid email address" }),
});

const magicLinkSchema = z.object({
  email: z.string().email({ error: "Invalid email address" }),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
type MagicLinkData = z.infer<typeof magicLinkSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const showMagicLink = hasMagicLinkProvider();

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const magicLinkForm = useForm<MagicLinkData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordData) {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to send reset email");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onMagicLinkSubmit(data: MagicLinkData) {
    try {
      setIsMagicLinkLoading(true);
      setError(null);

      const result = await signIn("email", {
        email: data.email,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error || "Failed to send magic link");
      }

      setMagicLinkSent(true);
    } catch (err) {
      if (err instanceof Error) {
        const errorMessage =
          err.message.includes("Too many requests") || err.message.includes("rate limit")
            ? "Too many magic link requests. Please try again later."
            : err.message;
        setError(errorMessage);
      } else {
        setError("Failed to send magic link. Please try again.");
      }
    } finally {
      setIsMagicLinkLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <Card>
            <CardHeader className="space-y-1">
              <div>
                <CardTitle className="text-2xl">Forgot Password</CardTitle>
                <CardDescription>Enter your email to receive a password reset link</CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              {success ? (
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      <strong>Check your email!</strong> We&apos;ve sent a password reset link to
                      your email address.
                    </AlertDescription>
                  </Alert>

                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Didn&apos;t receive the email? Check your spam folder or try again.
                    </p>

                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSuccess(false);
                          form.reset();
                        }}
                      >
                        Try Different Email
                      </Button>

                      <Link href="/auth/signin">
                        <Button variant="ghost" className="w-full">
                          Back to Sign In
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="Enter your email address"
                                  className="pl-10"
                                  disabled={isLoading}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </form>
                  </Form>

                  {showMagicLink && (
                    <div className="space-y-4">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            Or use magic link
                          </span>
                        </div>
                      </div>
                      <Form {...magicLinkForm}>
                        <form
                          onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)}
                          className="space-y-4"
                        >
                          {magicLinkSent && (
                            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                              <AlertDescription className="text-green-700 dark:text-green-300">
                                Check your email! We&apos;ve sent a magic link to sign in.
                              </AlertDescription>
                            </Alert>
                          )}
                          <FormField
                            control={magicLinkForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    {...field}
                                    disabled={isMagicLinkLoading || magicLinkSent}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="submit"
                            className="w-full"
                            variant="outline"
                            disabled={isMagicLinkLoading || magicLinkSent}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            {isMagicLinkLoading
                              ? "Sending..."
                              : magicLinkSent
                                ? "Magic Link Sent"
                                : "Send Magic Link"}
                          </Button>
                          {magicLinkSent && (
                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full"
                              onClick={() => {
                                setMagicLinkSent(false);
                                magicLinkForm.reset();
                              }}
                            >
                              Try Different Email
                            </Button>
                          )}
                        </form>
                      </Form>
                    </div>
                  )}
                </div>
              )}

              {!success && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Remember your password?{" "}
                    <Link href="/auth/signin" className="font-medium text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
