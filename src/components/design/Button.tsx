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

// Same variant names the workflows pages already use, rendered with
// TechHub's shadcn button styles so the module matches the rest of the app.
const VARIANT_STYLES: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
  yellow: "bg-barq-yellow text-barq-black shadow-xs hover:bg-barq-yellow/90",
  blue: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
  secondary:
    "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
  "on-dark":
    "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
  success: "bg-emerald-600 text-white shadow-xs hover:bg-emerald-600/90",
  danger:
    "bg-destructive text-white shadow-xs hover:bg-destructive/90 dark:bg-destructive/60",
};

const SIZE_STYLES: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-3 text-sm",
  md: "h-9 px-4 text-sm",
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
  return [
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all",
    "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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
