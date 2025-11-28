"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface VerifyEmailButtonProps {
  email: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function VerifyEmailButton({
  email,
  variant = "outline",
  size = "sm",
  className,
}: VerifyEmailButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [hasSent, setHasSent] = useState(false);

  // Countdown timer for cooldown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendVerification = async () => {
    try {
      setIsLoading(true);

      const response = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/verify-email?verified=true",
      });

      if (response.error) {
        toast.error(
          response.error.message || "Failed to send verification email",
        );
        return;
      }

      toast.success("Verification email sent! Please check your inbox.");
      setHasSent(true);
      setCooldown(60); // 60 second cooldown
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isLoading || cooldown > 0;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleSendVerification}
      disabled={isDisabled}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : cooldown > 0 ? (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
          Resend in {cooldown}s
        </>
      ) : hasSent ? (
        <>
          <Mail className="mr-2 h-4 w-4" />
          Resend verification
        </>
      ) : (
        <>
          <Mail className="mr-2 h-4 w-4" />
          Verify email
        </>
      )}
    </Button>
  );
}
