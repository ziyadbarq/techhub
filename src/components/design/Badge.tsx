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

// Soft status colours, as used by TechHub's status badges.
const TONE_STYLES: Record<Tone, string> = {
  yellow:
    "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  purple:
    "border-transparent bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  coral:
    "border-transparent bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  rose: "border-transparent bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  teal: "border-transparent bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200",
  success:
    "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  neutral: "bg-transparent text-foreground",
  danger:
    "border-transparent bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
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
        "inline-flex w-fit shrink-0 items-center gap-1 rounded-md border px-2 py-0.5",
        "text-xs font-medium whitespace-nowrap",
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
