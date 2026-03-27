"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Password strength utilities
// ---------------------------------------------------------------------------

export type PasswordStrength = "empty" | "weak" | "fair" | "good" | "strong";

/**
 * Score password strength based on complexity criteria.
 * Hard requirements (enforced by Zod): 8+ chars, letter + number.
 * Strength meter encourages: length >= 12, mixed case, symbols.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "empty";

  let score = 0;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  // Base criteria
  if (password.length >= 8 && hasLetter && hasNumber) score++; // meets minimum
  if (password.length >= 12) score++;
  if (hasMixedCase) score++;
  if (hasSymbol) score++;
  if (password.length >= 16) score++; // bonus for long passwords

  if (score <= 1) return "weak";
  if (score <= 2) return "fair";
  if (score <= 3) return "good";
  return "strong";
}

/** Human-readable hint for improving password strength */
function getStrengthHint(password: string): string | null {
  if (!password || password.length < 8) return null;
  if (!/[a-zA-Z]/.test(password)) return "Add a letter";
  if (!/\d/.test(password)) return "Add a number";
  if (!/[A-Z]/.test(password)) return "Add an uppercase letter";
  if (!/[^a-zA-Z0-9]/.test(password)) return "Add a symbol (!@#$...)";
  if (password.length < 12) return "Use 12+ characters for a stronger password";
  return null;
}

const STRENGTH_CONFIG: Record<
  Exclude<PasswordStrength, "empty">,
  { label: string; color: string; textColor: string; width: string }
> = {
  weak: {
    label: "Weak",
    color: "bg-red-500",
    textColor: "text-red-500",
    width: "w-1/4",
  },
  fair: {
    label: "Fair",
    color: "bg-orange-500",
    textColor: "text-orange-500",
    width: "w-2/4",
  },
  good: {
    label: "Good",
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    width: "w-3/4",
  },
  strong: {
    label: "Strong",
    color: "bg-green-500",
    textColor: "text-green-500",
    width: "w-full",
  },
};

// ---------------------------------------------------------------------------
// PasswordStrengthMeter
// ---------------------------------------------------------------------------

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  if (strength === "empty") return null;

  const config = STRENGTH_CONFIG[strength];
  const hint = getStrengthHint(password);

  return (
    <div className="space-y-1">
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            config.color,
            config.width,
          )}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className={cn("text-xs font-medium", config.textColor)}>
          {config.label}
        </p>
        {hint && strength !== "strong" && (
          <p className="text-muted-foreground text-xs">{hint}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PasswordInput
// ---------------------------------------------------------------------------

interface PasswordInputProps extends Omit<
  React.ComponentProps<"input">,
  "type"
> {
  showStrength?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrength, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const [capsLock, setCapsLock] = useState(false);

    const handleKeyEvent = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        setCapsLock(e.getModifierState("CapsLock"));
      },
      [],
    );

    return (
      <div className="space-y-2">
        <div className="relative">
          <input
            type={visible ? "text" : "password"}
            className={cn(
              "border-input file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 pr-10 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              className,
            )}
            ref={ref}
            onKeyDown={handleKeyEvent}
            onKeyUp={handleKeyEvent}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            tabIndex={-1}
            className="absolute top-0 right-0 h-9 w-9 hover:bg-transparent"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? (
              <EyeOff className="text-muted-foreground h-4 w-4" />
            ) : (
              <Eye className="text-muted-foreground h-4 w-4" />
            )}
          </Button>
        </div>

        {capsLock && (
          <div className="flex items-center gap-1.5 text-xs text-orange-500">
            <AlertTriangle className="h-3 w-3" />
            Caps Lock is on
          </div>
        )}

        {showStrength && typeof props.value === "string" && (
          <PasswordStrengthMeter password={props.value} />
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
