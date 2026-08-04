/**
 * Workflows wordmark — yellow square logo + lowercase wordmark.
 * Used inside the Workflows module (Miro-styled design language).
 */
export function Wordmark({
  size = "md",
  textColor = "ink",
}: {
  size?: "sm" | "md" | "lg";
  textColor?: "ink" | "white";
}) {
  const dim = size === "sm" ? 22 : size === "lg" ? 36 : 28;
  const text =
    size === "sm"
      ? "text-[16px]"
      : size === "lg"
        ? "text-[26px]"
        : "text-[20px]";
  const color =
    textColor === "white" ? "text-white" : "text-[var(--color-ink)]";
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-[6px]"
        style={{
          width: dim,
          height: dim,
          backgroundColor: "var(--color-brand-yellow)",
          color: "var(--color-ink)",
        }}
      >
        <span
          style={{
            fontSize: dim * 0.55,
            fontWeight: 700,
            letterSpacing: "-0.05em",
          }}
        >
          W
        </span>
      </span>
      <span className={`font-medium tracking-tight ${text} ${color}`}>
        workflows
      </span>
    </span>
  );
}
