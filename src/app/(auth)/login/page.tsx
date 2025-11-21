"use client";

/**
 * Login Page
 * Email/password and OAuth login with Microsoft via Better Auth
 */

import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Lock, Key } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Separator } from "@/components/ui/separator";
import { Suspense } from "react";

export default function LoginPage() {
  const handleMicrosoftLogin = async () => {
    await authClient.signIn.social({
      provider: "microsoft",
      callbackURL: "/dashboard",
    });
  };

  return (
    <div className="from-background to-muted flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Shield className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access your account and manage your tasks
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email/Password Login Form */}
          <Suspense
            fallback={
              <div className="text-muted-foreground text-center text-sm">
                Loading login form...
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
              <span className="bg-card text-muted-foreground px-2">
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
              <rect x="1" y="1" width="9" height="9" fill="currentColor" />
              <rect x="1" y="11" width="9" height="9" fill="currentColor" />
              <rect x="11" y="1" width="9" height="9" fill="currentColor" />
              <rect x="11" y="11" width="9" height="9" fill="currentColor" />
            </svg>
            Continue with Microsoft
          </Button>

          {/* Security Features */}
          <div className="mt-8 space-y-4 border-t pt-6">
            <p className="text-muted-foreground text-center text-sm font-medium">
              Secured with
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-4 text-center">
                <Lock className="text-muted-foreground h-6 w-6" />
                <p className="text-xs font-medium">OAuth 2.0</p>
              </div>

              <div className="flex flex-col items-center space-y-2 rounded-lg border p-4 text-center">
                <Key className="text-muted-foreground h-6 w-6" />
                <p className="text-xs font-medium">AES-256-GCM</p>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <p className="text-muted-foreground text-center text-xs">
            By signing in, you agree to our terms of service and privacy policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
