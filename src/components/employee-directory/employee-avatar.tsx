/**
 * Employee Avatar Component
 * Displays initials-based avatar with deterministic color based on name
 */

"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Color palette for avatars
 * Theme-aware colors with light/dark mode variants
 */
const avatarColors = [
  {
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-700 dark:text-red-300",
  },
  {
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
  },
  {
    bg: "bg-green-100 dark:bg-green-900/40",
    text: "text-green-700 dark:text-green-300",
  },
  {
    bg: "bg-yellow-100 dark:bg-yellow-900/40",
    text: "text-yellow-700 dark:text-yellow-300",
  },
  {
    bg: "bg-purple-100 dark:bg-purple-900/40",
    text: "text-purple-700 dark:text-purple-300",
  },
  {
    bg: "bg-pink-100 dark:bg-pink-900/40",
    text: "text-pink-700 dark:text-pink-300",
  },
  {
    bg: "bg-indigo-100 dark:bg-indigo-900/40",
    text: "text-indigo-700 dark:text-indigo-300",
  },
  {
    bg: "bg-teal-100 dark:bg-teal-900/40",
    text: "text-teal-700 dark:text-teal-300",
  },
  {
    bg: "bg-orange-100 dark:bg-orange-900/40",
    text: "text-orange-700 dark:text-orange-300",
  },
  {
    bg: "bg-cyan-100 dark:bg-cyan-900/40",
    text: "text-cyan-700 dark:text-cyan-300",
  },
] as const;

/**
 * Get deterministic color based on name hash
 * Same name always gets the same color
 */
function getAvatarColor(name: string) {
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
}

/**
 * Generate initials from first and last name
 */
function getInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0).toUpperCase();
  const last = lastName.trim().charAt(0).toUpperCase();
  return `${first}${last}`;
}

type AvatarSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<AvatarSize, { avatar: string; text: string }> = {
  sm: { avatar: "h-8 w-8", text: "text-xs" },
  md: { avatar: "h-10 w-10", text: "text-sm" },
  lg: { avatar: "h-14 w-14", text: "text-base" },
  xl: { avatar: "h-20 w-20", text: "text-xl" },
};

interface EmployeeAvatarProps {
  firstName: string;
  lastName: string;
  size?: AvatarSize;
  className?: string;
}

export function EmployeeAvatar({
  firstName,
  lastName,
  size = "md",
  className,
}: EmployeeAvatarProps) {
  const initials = getInitials(firstName, lastName);
  const fullName = `${firstName} ${lastName}`;
  const color = getAvatarColor(fullName);
  const sizeClass = sizeClasses[size];

  return (
    <Avatar className={cn(sizeClass.avatar, className)}>
      <AvatarFallback
        className={cn(
          color.bg,
          color.text,
          sizeClass.text,
          "font-semibold select-none",
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
