import type { HTMLAttributes, ReactNode } from "react";

type Tone =
  | "white"
  | "yellow"
  | "rose"
  | "coral"
  | "teal"
  | "orange"
  | "lavender"
  | "lemon"
  | "blush"
  | "sky"
  | "mint"
  | "sand"
  | "lilac"
  | "dark";
type Size = "base" | "feature";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  size?: Size;
  children: ReactNode;
  bordered?: boolean;
}

const TONE_STYLES: Record<Tone, string> = {
  white: "bg-[var(--color-canvas)] text-[var(--color-ink)]",
  yellow: "bg-[var(--color-brand-yellow)] text-[var(--color-ink)]",
  rose: "bg-[var(--color-rose-light)] text-[var(--color-ink)]",
  coral: "bg-[var(--color-coral-light)] text-[var(--color-ink)]",
  teal: "bg-[var(--color-teal-light)] text-[var(--color-ink)]",
  orange: "bg-[var(--color-brand-orange-light)] text-[var(--color-ink)]",
  lavender: "bg-[var(--color-surface-featured)] text-[var(--color-ink)]",
  lemon: "bg-[var(--color-lemon-light)] text-[var(--color-ink)]",
  blush: "bg-[var(--color-blush-light)] text-[var(--color-ink)]",
  sky: "bg-[var(--color-sky-light)] text-[var(--color-ink)]",
  mint: "bg-[var(--color-mint-light)] text-[var(--color-ink)]",
  sand: "bg-[var(--color-sand-light)] text-[var(--color-ink)]",
  lilac: "bg-[var(--color-lilac-light)] text-[var(--color-ink)]",
  dark: "bg-[var(--color-ink)] text-on-ink",
};

export function Card({
  tone = "white",
  size = "base",
  bordered = true,
  className,
  children,
  ...rest
}: CardProps) {
  const radius = size === "feature" ? "rounded-[28px]" : "rounded-[16px]";
  const padding = size === "feature" ? "p-8" : "p-6";
  const border =
    bordered && tone === "white"
      ? "border border-[var(--color-hairline-soft)]"
      : "";

  return (
    <div
      className={[
        TONE_STYLES[tone],
        radius,
        padding,
        border,
        "transition-shadow",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
