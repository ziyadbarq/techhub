"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { EMAIL_VERIFICATION_SUCCESS_PATH } from "@/lib/auth/constants";
import { checkSetupStatusAction } from "@/interface-adapters/controllers/setup.controller";
import { registerSchema, type RegisterInput } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
  });

  // Auto-focus name field on mount
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const onSubmit = async (data: RegisterInput) => {
    try {
      setError(null);
      setIsLoading(true);

      const setupStatus = await checkSetupStatusAction();
      if (!setupStatus.success) {
        setError(
          setupStatus.error ||
            "Could not verify setup status. Please try again.",
        );
        return;
      }

      if (setupStatus.data.needsSetup) {
        router.replace("/setup");
        return;
      }

      const response = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name || "",
        callbackURL: EMAIL_VERIFICATION_SUCCESS_PATH,
      });

      if (response.error) {
        setError(
          response.error.message ||
            "Failed to create account. Please try again.",
        );
        return;
      }

      // Immediately sign the user in so they land in the dashboard after registration
      const signInResponse = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: "/dashboard",
      });

      if (signInResponse.error) {
        setError(
          signInResponse.error.message ||
            "Account created, but we could not sign you in. Please try logging in.",
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Name <span className="text-muted-foreground">(optional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Name"
                  autoComplete="name"
                  disabled={isLoading}
                  {...field}
                  ref={nameRef}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="username"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isLoading}
                  showStrength
                  {...field}
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
              <FormLabel>Confirm Password</FormLabel>
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

        <div className="flex items-center justify-center">
          <Link
            href="/login"
            className="text-barq-yellow hover:text-barq-yellow/80 text-sm font-medium underline-offset-4 hover:underline"
          >
            Already have an account? Sign in
          </Link>
        </div>

        <Button
          type="submit"
          className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 w-full"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>

        <p className="text-muted-foreground text-center text-xs">
          By creating an account, you agree to our terms of service and privacy
          policy
        </p>
      </form>
    </Form>
  );
}
