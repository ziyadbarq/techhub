import type { ReactNode } from "react";

type Tone =
  | "yellow"
  | "purple"
  | "coral"
  | "rose"
  | "teal"
  | "success"
  | "neutral"
  | "danger";

const TONE_STYLES: Record<Tone, string> = {
  yellow: "bg-[var(--color-surface-yellow)] text-[var(--color-yellow-dark)]",
  purple: "bg-[var(--color-surface-featured)] text-[var(--color-brand-blue)]",
  coral: "bg-[var(--color-coral-light)] text-[var(--color-coral-dark)]",
  rose: "bg-[var(--color-rose-light)] text-[var(--color-coral-dark)]",
  teal: "bg-[var(--color-teal-light)] text-[var(--color-moss-dark)]",
  success: "bg-[var(--color-success-accent)] text-white",
  neutral: "bg-[var(--color-surface-soft)] text-[var(--color-slate)]",
  danger: "bg-[var(--color-brand-red)] text-[var(--color-coral-dark)]",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1",
        "text-[13px] font-semibold leading-none tracking-tight",
        TONE_STYLES[tone],
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
