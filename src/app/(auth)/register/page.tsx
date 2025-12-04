"use client";

/**
 * Registration Page
 * User registration with email and password
 * Split-screen design matching login page
 */

import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Shield, Users, Lock, ShieldCheck, Moon, Sun } from "lucide-react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { BRANDING, getCopyrightWithTagline } from "@/config/branding";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    // Redirect to dashboard if already logged in
    authClient
      .getSession()
      .then((session) => {
        if (session?.data?.user) {
          router.replace("/dashboard");
        } else {
          // User not logged in, show the register page
          setIsCheckingAuth(false);
        }
      })
      .catch(() => {
        // Error checking session, show register page
        setIsCheckingAuth(false);
      });
  }, [router]);

  // Show loading spinner while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Shield className="text-barq-yellow mx-auto h-12 w-12 animate-pulse" />
          <p className="text-muted-foreground text-sm">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Authentication method controls via environment variables
  const isEmailRegistrationEnabled =
    process.env.NEXT_PUBLIC_ENABLE_EMAIL_REGISTRATION !== "false";
  const isMSAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_MS_AUTH !== "false";

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
              {BRANDING.auth.register.heading}
            </h1>
            <p className="text-muted-foreground max-w-lg text-lg">
              {BRANDING.auth.register.subheading}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-barq-yellow/10 text-barq-yellow flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Role-Based Access</p>
                <p className="text-muted-foreground text-sm">
                  Granular permissions with temporal role assignments
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-barq-yellow/10 text-barq-yellow flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Audit Trail</p>
                <p className="text-muted-foreground text-sm">
                  100% coverage with immutable change logs
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-barq-yellow/10 text-barq-yellow flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Encrypted & Secure</p>
                <p className="text-muted-foreground text-sm">
                  AES-256-GCM encryption for all sensitive data
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

      {/* Right Side - Registration Form */}
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
              {BRANDING.auth.register.cta}
            </h2>
            <p className="text-muted-foreground">
              {BRANDING.auth.register.ctaSubheading}
            </p>
          </div>

          {/* Registration Form */}
          <div className="space-y-6">
            {/* Email/Password Registration Form */}
            {isEmailRegistrationEnabled ? (
              <RegisterForm />
            ) : (
              <div className="bg-muted/50 rounded-lg border p-6 text-center">
                <Shield className="text-barq-yellow mx-auto mb-3 h-10 w-10" />
                <p className="text-muted-foreground text-sm">
                  Email registration is currently disabled
                </p>
              </div>
            )}

            {/* Separator - Only show when both email and OAuth are enabled */}
            {isEmailRegistrationEnabled && isMSAuthEnabled && (
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
            )}

            {/* Microsoft OAuth Button */}
            <Button
              onClick={handleMicrosoftLogin}
              className="w-full"
              size="lg"
              variant="outline"
              disabled={!isMSAuthEnabled}
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

            {/* Disabled Microsoft Button Tooltip */}
            {!isMSAuthEnabled && (
              <p className="text-muted-foreground text-center text-xs">
                Microsoft authentication is currently disabled
              </p>
            )}

            {/* Footer */}
            <div className="space-y-4 pt-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="text-barq-yellow h-4 w-4 flex-shrink-0" />
                  <p className="text-muted-foreground text-xs">
                    {BRANDING.compliance.internalApproval}
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
