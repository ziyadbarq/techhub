import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  | "primary"
  | "yellow"
  | "blue"
  | "secondary"
  | "on-dark"
  | "ghost"
  | "success"
  | "danger";

type Size = "sm" | "md";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary:
    "bg-[var(--color-ink)] text-on-ink hover:bg-[var(--color-charcoal)] active:bg-[var(--color-charcoal)] disabled:bg-[var(--color-hairline)] disabled:text-[var(--color-stone)]",
  yellow:
    "bg-[var(--color-brand-yellow)] text-[var(--color-ink)] hover:bg-[var(--color-brand-yellow-deep)] disabled:bg-[var(--color-hairline)] disabled:text-[var(--color-stone)]",
  blue: "bg-[var(--color-brand-blue)] text-[var(--color-on-primary)] hover:bg-[var(--color-blue-pressed)] disabled:bg-[var(--color-hairline)] disabled:text-[var(--color-stone)]",
  secondary:
    "bg-transparent text-[var(--color-ink)] border border-[var(--color-hairline-strong)] hover:bg-[var(--color-surface-soft)] disabled:text-[var(--color-stone)] disabled:border-[var(--color-hairline)]",
  "on-dark":
    "bg-white text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] disabled:opacity-60",
  ghost:
    "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] disabled:text-[var(--color-stone)]",
  success:
    "bg-[var(--color-success-accent)] text-white hover:opacity-90 disabled:bg-[var(--color-hairline)] disabled:text-[var(--color-stone)]",
  danger:
    "bg-[var(--color-coral-dark)] text-white hover:opacity-90 disabled:bg-[var(--color-hairline)] disabled:text-[var(--color-stone)]",
};

const SIZE_STYLES: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-[14px]",
};

function classes({
  variant,
  size,
  fullWidth,
  className,
}: Required<Pick<BaseProps, "variant" | "size">> & {
  fullWidth?: boolean;
  className?: string;
}) {
  const isGhost = variant === "ghost";
  const radius = isGhost ? "rounded-md" : "rounded-[var(--radius-full)]";
  return [
    "inline-flex items-center justify-center gap-2 font-medium transition-colors",
    "disabled:cursor-not-allowed select-none whitespace-nowrap",
    radius,
    SIZE_STYLES[size],
    VARIANT_STYLES[variant],
    fullWidth ? "w-full" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={classes({ variant, size, fullWidth, className })}
      {...rest}
    >
      {children}
    </button>
  );
}

interface LinkButtonProps extends BaseProps {
  href: string;
  prefetch?: boolean;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  href,
  prefetch,
  children,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={classes({ variant, size, fullWidth, className })}
    >
      {children}
    </Link>
  );
}
