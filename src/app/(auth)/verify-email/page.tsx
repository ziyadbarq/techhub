"use client";

/**
 * Email Verification Page
 * Shown after clicking the verification link in email
 * Better Auth handles the verification automatically when the link is clicked
 */

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Moon,
  Sun,
  ArrowRight,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useSearchParams, useRouter } from "next/navigation";
import { BRANDING, getCopyrightWithTagline } from "@/config/branding";

function VerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const verified = searchParams.get("verified") === "true";
  const error = searchParams.get("error");

  // Auto-redirect to dashboard after successful verification
  useEffect(() => {
    if (verified && !error) {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [verified, error, router]);

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {error === "INVALID_TOKEN"
              ? "This verification link is invalid or has expired."
              : "Failed to verify your email. Please try again."}
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-3">
          <Link href="/dashboard">
            <Button className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 w-full">
              Go to Dashboard
            </Button>
          </Link>
          <p className="text-muted-foreground text-center text-xs">
            You can resend the verification email from your profile settings.
          </p>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="space-y-6">
        <Alert className="border-green-500 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            Your email has been verified successfully! Redirecting to
            dashboard...
          </AlertDescription>
        </Alert>

        <Link href="/dashboard">
          <Button className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 w-full">
            <span>Go to Dashboard</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  // Default state - no params (shouldn't normally happen)
  return (
    <div className="space-y-6">
      <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
        <Shield className="mr-2 h-4 w-4 animate-pulse" />
        Processing verification...
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="relative flex min-h-screen">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="hover:bg-accent h-9 w-9 transition-colors"
          aria-label={
            mounted
              ? `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`
              : "Toggle theme"
          }
        >
          <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      {/* Left Side - Branding */}
      <div className="dark:from-barq-yellow/10 dark:via-background dark:to-barq-light-blue/10 relative hidden flex-1 flex-col justify-between border-r bg-stone-100 p-12 transition-all duration-300 lg:flex dark:border-r-0 dark:bg-transparent dark:bg-gradient-to-br">
        {/* Background Pattern */}
        <div className="bg-grid-pattern absolute inset-0 opacity-5" />

        {/* Logo */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-block transition-opacity hover:opacity-80"
          >
            <Logo className="h-10 w-auto" priority />
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="mb-4 text-4xl font-bold">
              <span className="from-barq-yellow to-barq-yellow/70 bg-gradient-to-r bg-clip-text text-transparent">
                Email
              </span>
              <br />
              Verification
            </h1>
            <p className="text-muted-foreground max-w-lg text-lg">
              Thank you for verifying your email address. Your account is now
              fully set up and ready to use.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-barq-yellow/10 text-barq-yellow flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Account Verified</p>
                <p className="text-muted-foreground text-sm">
                  Your email address has been confirmed
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-barq-yellow/10 text-barq-yellow flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Enhanced Security</p>
                <p className="text-muted-foreground text-sm">
                  Receive important account notifications
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-muted-foreground text-sm">
            {getCopyrightWithTagline(BRANDING.footer.builtFor)}
          </p>
        </div>
      </div>

      {/* Right Side - Content */}
      <div className="bg-background flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex justify-center lg:hidden">
            <Link
              href="/"
              className="inline-block transition-opacity hover:opacity-80"
            >
              <Logo className="h-10 w-auto" priority />
            </Link>
          </div>

          {/* Header */}
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Email Verification
            </h2>
            <p className="text-muted-foreground">
              Your email verification status
            </p>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <Suspense
              fallback={
                <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
                  <Shield className="mr-2 h-4 w-4 animate-pulse" />
                  Processing...
                </div>
              }
            >
              <VerificationContent />
            </Suspense>

            {/* Footer */}
            <div className="space-y-4 pt-4">
              <p className="text-muted-foreground text-center text-xs">
                {BRANDING.contact.support.helpText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
