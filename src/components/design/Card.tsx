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

/*
 * TechHub cards are neutral: bg-card, border, rounded-xl, subtle shadow.
 * Tones survive only as a thin accent on the left edge so pages that used
 * colour to group things still read as grouped, without pastel blocks.
 */
const TONE_ACCENT: Record<Tone, string> = {
  white: "",
  yellow: "border-l-4 border-l-barq-yellow",
  rose: "border-l-4 border-l-rose-400",
  coral: "border-l-4 border-l-red-400",
  teal: "border-l-4 border-l-teal-500",
  orange: "border-l-4 border-l-orange-400",
  lavender: "border-l-4 border-l-violet-400",
  lemon: "border-l-4 border-l-yellow-400",
  blush: "border-l-4 border-l-pink-400",
  sky: "border-l-4 border-l-sky-400",
  mint: "border-l-4 border-l-emerald-400",
  sand: "border-l-4 border-l-amber-500",
  lilac: "border-l-4 border-l-purple-400",
  dark: "",
};

export function Card({
  tone = "white",
  size = "base",
  bordered = true,
  className,
  children,
  ...rest
}: CardProps) {
  const surface =
    tone === "dark"
      ? "bg-muted text-foreground"
      : "bg-card text-card-foreground";
  const padding = size === "feature" ? "p-6" : "p-5";
  const border = bordered || tone !== "white" ? "border shadow-sm" : "";

  return (
    <div
      className={[
        surface,
        "rounded-xl",
        padding,
        border,
        TONE_ACCENT[tone],
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
