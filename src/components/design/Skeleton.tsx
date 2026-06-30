type SkeletonProps = {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  width?: string;
  height?: string;
};

const ROUNDED_MAP: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

export function Skeleton({
  className = "",
  rounded = "md",
  width,
  height,
}: SkeletonProps) {
  return (
    <span
      role="presentation"
      aria-hidden
      className={`flowbit-skeleton block ${ROUNDED_MAP[rounded]} ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          height="0.875rem"
          width={i === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({
  className = "",
  showHeader = true,
  rows = 3,
}: {
  className?: string;
  showHeader?: boolean;
  rows?: number;
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-5 ${className}`}
    >
      {showHeader ? (
        <div className="space-y-2">
          <Skeleton height="1.25rem" width="40%" />
          <Skeleton height="0.75rem" width="65%" />
        </div>
      ) : null}
      <div className={showHeader ? "mt-4" : ""}>
        <SkeletonText lines={rows} />
      </div>
    </div>
  );
}
