"use client";

/**
 * Two-Factor Authentication Challenge Page
 * Users with 2FA enabled are redirected here after entering their password
 * They must enter a 6-digit TOTP code or a backup code to complete sign-in
 */

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, KeyRound, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { BRANDING, getCopyrightWithTagline } from "@/config/branding";

export default function TwoFactorChallengePage() {
  return (
    <Suspense fallback={<TwoFactorLoading />}>
      <TwoFactorChallengeContent />
    </Suspense>
  );
}

function TwoFactorChallengeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated (bypass 2FA page)
    authClient
      .getSession()
      .then((session) => {
        if (session?.data?.user) {
          router.replace("/dashboard");
        } else {
          setIsCheckingAuth(false);
        }
      })
      .catch(() => {
        setIsCheckingAuth(false);
      });
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || (useBackupCode ? code.length < 8 : code.length !== 6)) {
      toast.error(
        useBackupCode
          ? "Please enter a valid backup code"
          : "Please enter a 6-digit code",
      );
      return;
    }

    setIsVerifying(true);

    try {
      // Call Better Auth to verify the 2FA code
      // Note: Better Auth's verifyTotp endpoint handles both TOTP and backup codes
      const result = await authClient.twoFactor.verifyTotp({
        code,
        trustDevice,
      });

      if (result.error) {
        toast.error(result.error.message || "Invalid code. Please try again.");
        setCode("");
        return;
      }

      // Success - user is now fully authenticated
      const successMessage = trustDevice
        ? "Authentication successful! This device is now trusted for 30 days."
        : "Authentication successful!";
      toast.success(successMessage);
      router.push(searchParams?.get("callbackURL") || "/dashboard");
    } catch (_error) {
      toast.error("Failed to verify code. Please try again.");
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  // Show loading spinner while checking auth
  if (isCheckingAuth) {
    return <TwoFactorLoading />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="from-barq-yellow/10 via-background to-background hidden w-1/2 flex-col justify-between bg-gradient-to-br p-12 lg:flex">
        <div className="flex items-center gap-3">
          <Logo width={100} height={32} />
          <div>
            <h1 className="text-barq-yellow text-2xl font-bold tracking-tight">
              {BRANDING.app.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              {BRANDING.taglines.short}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-barq-yellow/10 text-barq-yellow flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">Enhanced Security</h3>
              <p className="text-muted-foreground text-sm">
                Two-factor authentication adds an extra layer of protection to
                your account.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-barq-yellow/10 text-barq-yellow flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">Time-Based Codes</h3>
              <p className="text-muted-foreground text-sm">
                Use your authenticator app to generate a unique 6-digit code.
              </p>
            </div>
          </div>
        </div>

        <div className="text-muted-foreground text-sm">
          {getCopyrightWithTagline(BRANDING.taglines.short)}
        </div>
      </div>

      {/* Right side - 2FA Form */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <div className="flex items-center justify-center">
              <div className="bg-barq-yellow/10 text-barq-yellow flex h-16 w-16 items-center justify-center rounded-full">
                <Shield className="h-8 w-8" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Two-Factor Authentication
            </h1>
            <p className="text-muted-foreground text-sm">
              {useBackupCode
                ? "Enter one of your backup codes to sign in"
                : "Enter the 6-digit code from your authenticator app"}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verification Code</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">
                    {useBackupCode ? "Backup Code" : "6-Digit Code"}
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder={useBackupCode ? "Enter backup code" : "000000"}
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (useBackupCode) {
                        setCode(value);
                      } else {
                        setCode(value.replace(/\D/g, "").slice(0, 6));
                      }
                    }}
                    disabled={isVerifying}
                    maxLength={useBackupCode ? 50 : 6}
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trustDevice"
                    checked={trustDevice}
                    onCheckedChange={(checked) =>
                      setTrustDevice(checked as boolean)
                    }
                  />
                  <label
                    htmlFor="trustDevice"
                    className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Trust this device for 30 days
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isVerifying ||
                    !code ||
                    (useBackupCode ? code.length < 8 : code.length !== 6)
                  }
                >
                  {isVerifying ? "Verifying..." : "Verify & Sign In"}
                </Button>

                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setUseBackupCode(!useBackupCode);
                      setCode("");
                    }}
                  >
                    {useBackupCode
                      ? "Use authenticator app instead"
                      : "Use backup code instead"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href="/login">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to login
                    </Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Alert>
            <KeyRound className="h-4 w-4" />
            <AlertDescription>
              Having trouble? Contact your IT administrator for assistance.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}

function TwoFactorLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="border-barq-yellow h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-muted-foreground text-sm">
          Checking authentication...
        </p>
      </div>
    </div>
  );
}
