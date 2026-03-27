"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  XCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Auto-focus password field on mount
  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });

      if (response.error) {
        setError(
          response.error.message ||
            "Failed to reset password. The link may have expired.",
        );
        return;
      }

      setIsSuccess(true);

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <Alert className="border-green-500 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            Your password has been reset successfully. Redirecting to login...
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <Link
            href="/login"
            className="text-barq-yellow hover:text-barq-yellow/80 inline-flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to login now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isLoading}
                  showStrength
                  {...field}
                  ref={passwordRef}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 w-full"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Resetting password...
            </>
          ) : (
            "Reset password"
          )}
        </Button>

        <div className="text-center">
          <Link
            href="/login"
            className="text-barq-yellow hover:text-barq-yellow/80 inline-flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </form>
    </Form>
  );
}

/**
 * Component shown when the reset token is invalid or expired
 */
export function InvalidTokenMessage() {
  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          This password reset link is invalid or has expired. Please request a
          new one.
        </AlertDescription>
      </Alert>

      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-barq-yellow hover:text-barq-yellow/80 inline-flex items-center gap-2 text-sm font-medium"
        >
          Request new reset link
        </Link>
      </div>

      <div className="text-center">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
