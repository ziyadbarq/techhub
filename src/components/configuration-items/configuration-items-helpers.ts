/**
 * Shared helpers for Configuration Items UI components
 */

export const CRITICALITY_STATUS_MAP: Record<string, string> = {
  CRITICAL: "error",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "success",
};

export const ENVIRONMENT_STATUS_MAP: Record<string, string> = {
  PROD: "error",
  UAT: "warning",
  DEV: "info",
  TEST: "success",
  DR: "warning",
  OTHER: "unknown",
};

export const STALE_THRESHOLD_DAYS = 90;

export function isCIStale(
  updatedAt: string | null | undefined,
  thresholdDays: number = STALE_THRESHOLD_DAYS,
): boolean {
  if (!updatedAt) return false;

  const updated = new Date(updatedAt);
  if (Number.isNaN(updated.getTime())) return false;

  const now = Date.now();
  const diffDays = (now - updated.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= thresholdDays;
}
