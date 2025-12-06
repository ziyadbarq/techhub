/**
 * UserAvatar Component
 * Reusable avatar component with Next.js Image optimization
 *
 * Features:
 * - Multiple size variants (xs, sm, md, lg, xl)
 * - Next.js Image integration for automatic optimization
 * - Deterministic fallback colors for initials
 * - SSO image support (Microsoft Graph)
 * - Smart URL rewriting for local avatar variants
 * - Optional tooltip with user information
 */

"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Size mapping configuration
 * Maps size prop to pixel dimensions and CSS classes
 */
const SIZE_MAP = {
  xs: { px: 24, className: "h-6 w-6", textSize: "text-xs" },
  sm: { px: 32, className: "h-8 w-8", textSize: "text-xs" },
  md: { px: 48, className: "h-12 w-12", textSize: "text-sm" },
  lg: { px: 64, className: "h-16 w-16", textSize: "text-base" },
  xl: { px: 128, className: "h-32 w-32", textSize: "text-2xl" },
} as const;

/**
 * Deterministic color palette for avatar fallbacks
 * Same color assignment logic as EmployeeAvatar for consistency
 * Theme-aware with light/dark mode variants
 */
const AVATAR_COLORS = [
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
 * Get initials from user name or email
 * Extracts up to 2 characters for display
 */
function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email?.[0]?.toUpperCase() || "U";
}

/**
 * Get deterministic color based on text hash
 * Same name/email always gets the same color
 */
function getAvatarColor(text: string) {
  const hash = text
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/**
 * Smart URL generation for avatar images
 * Rewrites local avatar URLs to use appropriate size variant
 * Uses 2x resolution for Retina displays
 * Passes through external URLs unchanged
 */
function getOptimizedAvatarUrl(
  imageUrl: string | null | undefined,
  targetSize: number,
): string | undefined {
  if (!imageUrl) return undefined;

  // External images (SSO) - pass through unchanged
  if (imageUrl.startsWith("http")) return imageUrl;

  // New format: /uploads/avatars/{userId}/128.webp → /uploads/avatars/{userId}/32.webp
  // Use 2x resolution for Retina displays (64px → use 128px variant)
  if (imageUrl.includes("/avatars/")) {
    const retinaSize = targetSize * 2;
    // Cap at 256px (our maximum generated size)
    const actualSize = Math.min(retinaSize, 256);
    return imageUrl.replace(/\/\d+\.webp$/, `/${actualSize}.webp`);
  }

  // Legacy format: /uploads/{year}/{month}/{cuid}.{ext} → use as-is
  // Next.js will optimize on-demand
  return imageUrl;
}

export interface UserAvatarProps {
  /**
   * User object with name, email, and image
   * Alternative to providing individual props
   */
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };

  /**
   * User's display name (used for initials and tooltip)
   */
  name?: string;

  /**
   * User's email (fallback for initials)
   */
  email?: string;

  /**
   * Avatar image URL
   * Can be local (/uploads/avatars/...) or external (https://...)
   */
  image?: string;

  /**
   * Avatar size variant
   * @default "md"
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show tooltip with user information on hover
   * @default false
   */
  showTooltip?: boolean;

  /**
   * Priority loading hint for Next.js Image
   * Use for above-the-fold images (e.g., hero section)
   * @default false
   */
  priority?: boolean;
}

/**
 * UserAvatar Component
 *
 * A reusable avatar component with automatic image optimization,
 * deterministic fallback colors, and SSO support.
 *
 * @example
 * ```tsx
 * // With user object
 * <UserAvatar user={user} size="md" />
 *
 * // With individual props
 * <UserAvatar
 *   name="John Doe"
 *   email="john@example.com"
 *   image="/uploads/avatars/user123/128.webp"
 *   size="lg"
 *   showTooltip
 * />
 *
 * // SSO user (external image)
 * <UserAvatar
 *   name="Jane Smith"
 *   image="https://graph.microsoft.com/v1.0/users/jane@company.com/photo/$value"
 *   size="sm"
 * />
 * ```
 */
export function UserAvatar({
  user,
  name,
  email,
  image,
  size = "md",
  className,
  showTooltip = false,
  priority = false,
}: UserAvatarProps) {
  // Resolve props: user object takes precedence over individual props
  const displayName = user?.name || name;
  const displayEmail = user?.email || email;
  const displayImage = user?.image || image;

  // Get size configuration
  const sizeConfig = SIZE_MAP[size];

  // Generate initials and color for fallback
  const initials = getInitials(displayName, displayEmail);
  const colorKey = displayName || displayEmail || "";
  const color = getAvatarColor(colorKey);

  // Generate optimized avatar URL
  const avatarUrl = getOptimizedAvatarUrl(displayImage, sizeConfig.px);

  // Render avatar content
  const avatarContent = (
    <Avatar className={cn(sizeConfig.className, className)}>
      {avatarUrl ? (
        // Use native img for local WebP files, Next.js Image for external URLs
        avatarUrl.startsWith("http") ? (
          <AvatarImage asChild>
            <Image
              src={avatarUrl}
              alt={displayName || displayEmail || "User avatar"}
              width={sizeConfig.px}
              height={sizeConfig.px}
              priority={priority}
              className="aspect-square h-full w-full object-cover"
            />
          </AvatarImage>
        ) : (
          <AvatarImage
            src={avatarUrl}
            alt={displayName || displayEmail || "User avatar"}
          />
        )
      ) : null}
      <AvatarFallback
        className={cn(
          color.bg,
          color.text,
          sizeConfig.textSize,
          "font-semibold select-none",
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  // Wrap with tooltip if requested
  if (showTooltip && (displayName || displayEmail)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{avatarContent}</TooltipTrigger>
          <TooltipContent>
            {displayName && <p className="font-medium">{displayName}</p>}
            {displayEmail && (
              <p className="text-muted-foreground text-xs">{displayEmail}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return avatarContent;
}
