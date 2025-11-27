"use client";

/**
 * SSO Blocked Page
 * Displayed when a user attempts to sign in via Microsoft SSO but:
 * - Their email is not found in the Person database
 * - Their Person record is inactive
 * - Their Person record is excluded
 */

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  Shield,
  UserX,
  UserMinus,
  Ban,
  ArrowLeft,
  Mail,
  Moon,
  Sun,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Suspense, useEffect, useState } from "react";
import { BRANDING, getCopyrightWithTagline } from "@/config/branding";

type BlockReason = "person-not-found" | "person-inactive" | "person-excluded";

const reasonConfig: Record<
  BlockReason,
  {
    icon: typeof UserX;
    title: string;
    description: string;
    color: string;
  }
> = {
  "person-not-found": {
    icon: UserX,
    title: "Account Not Found",
    description:
      "Your email address is not registered in our employee database. Only employees who have been synced from the company directory can access this system.",
    color: "text-amber-500",
  },
  "person-inactive": {
    icon: UserMinus,
    title: "Account Deactivated",
    description:
      "Your employee account has been deactivated. This may happen when employment status changes or during extended leave.",
    color: "text-orange-500",
  },
  "person-excluded": {
    icon: Ban,
    title: "Access Restricted",
    description:
      "Your account has been marked as excluded from this system. This is typically applied to service accounts or accounts with special restrictions.",
    color: "text-red-500",
  },
};

function BlockedContent() {
  const searchParams = useSearchParams();
  const reason =
    (searchParams.get("reason") as BlockReason) || "person-not-found";
  const customMessage = searchParams.get("message");

  const config = reasonConfig[reason] || reasonConfig["person-not-found"];
  const Icon = config.icon;

  return (
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

      {/* Error Icon */}
      <div className="flex justify-center">
        <div className={`bg-muted rounded-full p-6 ${config.color}`}>
          <Icon className="h-12 w-12" />
        </div>
      </div>

      {/* Header */}
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight">{config.title}</h2>
        <p className="text-muted-foreground">
          {customMessage || config.description}
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <Button asChild className="w-full" size="lg">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </Button>

        <Button asChild variant="outline" className="w-full" size="lg">
          <a href={`mailto:${BRANDING.contact.support.email}`}>
            <Mail className="mr-2 h-4 w-4" />
            Contact IT Support
          </a>
        </Button>
      </div>

      {/* Help Text */}
      <div className="space-y-4 pt-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="text-barq-yellow h-5 w-5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Need Access?</p>
              <p className="text-muted-foreground text-xs">
                If you believe you should have access to this system, please
                contact IT support. They can verify your employment status and
                ensure your account is properly configured.
              </p>
            </div>
          </div>
        </div>

        <p className="text-muted-foreground text-center text-xs">
          Error code: <code className="font-mono">{reason}</code>
        </p>
      </div>
    </div>
  );
}

export default function AuthBlockedPage() {
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
          aria-pressed={mounted ? resolvedTheme === "dark" : undefined}
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
                Secure Access
              </span>
              <br />
              Employee Verification
            </h1>
            <p className="text-muted-foreground max-w-lg text-lg">
              Access to this system is restricted to verified Barq employees.
              Your identity is validated against our employee directory.
            </p>
          </div>

          {/* Security Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-barq-yellow/10 text-barq-yellow flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Directory-Based Access</p>
                <p className="text-muted-foreground text-sm">
                  Only employees synced from Microsoft Entra ID can sign in
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

      {/* Right Side - Error Content */}
      <div className="bg-background flex flex-1 items-center justify-center p-8">
        <Suspense
          fallback={
            <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
              <Shield className="mr-2 h-4 w-4 animate-pulse" />
              Loading...
            </div>
          }
        >
          <BlockedContent />
        </Suspense>
      </div>
    </div>
  );
}
