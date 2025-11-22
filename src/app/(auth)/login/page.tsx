"use client";

/**
 * Login Page
 * Email/password and OAuth login with Microsoft via Better Auth
 * Split-screen design with branding and SAMA compliance messaging
 */

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Shield, Lock, ShieldCheck, FileCheck, Moon, Sun } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Separator } from "@/components/ui/separator";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { BRANDING, getCopyrightWithTagline } from "@/config/branding";

export default function LoginPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleMicrosoftLogin = async () => {
    await authClient.signIn.social({
      provider: "microsoft",
      callbackURL: "/dashboard",
    });
  };

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
      <div className="bg-muted/30 dark:from-barq-yellow/10 dark:via-background dark:to-barq-light-blue/10 relative hidden flex-1 flex-col justify-between border-r p-12 lg:flex dark:border-r-0 dark:bg-gradient-to-br">
        {/* Background Pattern */}
        <div className="bg-grid-pattern absolute inset-0 opacity-5" />

        {/* Logo */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-block transition-opacity hover:opacity-80"
          >
            <Logo className="h-10 w-auto" />
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="mb-4 text-4xl font-bold">
              <span className="from-barq-yellow to-barq-yellow/70 bg-gradient-to-r bg-clip-text text-transparent">
                SAMA-Ready
              </span>
              <br />
              IT Asset Management
            </h1>
            <p className="text-muted-foreground max-w-lg text-lg">
              {BRANDING.taglines.auth}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-barq-yellow/10 text-barq-yellow flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">
                  {BRANDING.sama.compliance.ready}
                </p>
                <p className="text-muted-foreground text-sm">
                  {BRANDING.sama.compliance.features[0]} and{" "}
                  {BRANDING.sama.compliance.features[1].toLowerCase()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-barq-yellow/10 text-barq-yellow flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Enterprise Security</p>
                <p className="text-muted-foreground text-sm">
                  OAuth 2.0 and AES-256-GCM encryption
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-barq-yellow/10 text-barq-yellow flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Complete Visibility</p>
                <p className="text-muted-foreground text-sm">
                  Track 26+ entity types with 115+ use cases
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

      {/* Right Side - Login Form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex justify-center lg:hidden">
            <Link
              href="/"
              className="inline-block transition-opacity hover:opacity-80"
            >
              <Logo className="h-10 w-auto" />
            </Link>
          </div>

          {/* Header */}
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              {BRANDING.auth.login.heading}
            </h2>
            <p className="text-muted-foreground">
              {BRANDING.auth.login.subheading}
            </p>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            <Suspense
              fallback={
                <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
                  <Shield className="mr-2 h-4 w-4 animate-pulse" />
                  Loading secure login...
                </div>
              }
            >
              <LoginForm />
            </Suspense>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background text-muted-foreground px-2">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Microsoft Login Button */}
            <Button
              onClick={handleMicrosoftLogin}
              className="w-full"
              size="lg"
              variant="outline"
            >
              <svg
                className="mr-2 h-5 w-5"
                viewBox="0 0 21 21"
                fill="currentColor"
              >
                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
              </svg>
              Continue with Microsoft
            </Button>

            {/* Footer */}
            <div className="space-y-4 pt-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="text-barq-yellow h-4 w-4 flex-shrink-0" />
                  <p className="text-muted-foreground text-xs">
                    {BRANDING.sama.compliance.internal}
                  </p>
                </div>
              </div>

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
