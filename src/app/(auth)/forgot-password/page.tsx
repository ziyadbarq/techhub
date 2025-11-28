"use client";

/**
 * Forgot Password Page
 * Request a password reset link via email
 * Split-screen design matching login/register pages
 */

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Shield, Lock, KeyRound, Moon, Sun } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { BRANDING, getCopyrightWithTagline } from "@/config/branding";

export default function ForgotPasswordPage() {
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
                Secure
              </span>
              <br />
              Password Recovery
            </h1>
            <p className="text-muted-foreground max-w-lg text-lg">
              We&apos;ll send you a secure link to reset your password. The link
              expires in 1 hour for your security.
            </p>
          </div>

          {/* Security Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-barq-yellow/10 text-barq-yellow flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Secure Token</p>
                <p className="text-muted-foreground text-sm">
                  One-time use link with 1-hour expiration
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-barq-yellow/10 text-barq-yellow flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Password Protection</p>
                <p className="text-muted-foreground text-sm">
                  All sessions are invalidated after reset
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

      {/* Right Side - Form */}
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
              Reset Your Password
            </h2>
            <p className="text-muted-foreground">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <ForgotPasswordForm />

            {/* Footer */}
            <div className="space-y-4 pt-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="text-barq-yellow h-4 w-4 flex-shrink-0" />
                  <p className="text-muted-foreground text-xs">
                    For security, the reset link is valid for 1 hour only.
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
