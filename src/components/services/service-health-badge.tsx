/**
 * Service Health Status Badge Component
 *
 * Displays visual status indicator for service health monitoring
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Wrench,
} from "lucide-react";
import type { ServiceHealthStatus } from "@/generated/prisma";

interface ServiceHealthBadgeProps {
  status: ServiceHealthStatus;
  className?: string;
  showIcon?: boolean;
}

export function ServiceHealthBadge({
  status,
  className,
  showIcon = true,
}: ServiceHealthBadgeProps) {
  let label: string;
  let variant: "default" | "secondary" | "destructive" | "outline";
  let bgClass: string;
  let Icon;

  switch (status) {
    case "HEALTHY":
      label = "Healthy";
      variant = "default";
      bgClass = "bg-success text-success-foreground";
      Icon = CheckCircle2;
      break;
    case "DEGRADED":
      label = "Degraded";
      variant = "outline";
      bgClass = "bg-warning/10 text-warning border-warning";
      Icon = AlertTriangle;
      break;
    case "UNHEALTHY":
      label = "Unhealthy";
      variant = "destructive";
      bgClass = "bg-destructive";
      Icon = XCircle;
      break;
    case "DOWN":
      label = "Down";
      variant = "destructive";
      bgClass = "bg-destructive";
      Icon = XCircle;
      break;
    case "MAINTENANCE":
      label = "Maintenance";
      variant = "secondary";
      bgClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      Icon = Wrench;
      break;
    case "UNKNOWN":
    default:
      label = "Unknown";
      variant = "secondary";
      bgClass = "bg-muted";
      Icon = HelpCircle;
      break;
  }

  return (
    <Badge variant={variant} className={cn("gap-1.5", bgClass, className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  );
}

/**
 * Service Health Status Icon Component
 *
 * Displays just the icon without badge wrapper for inline use
 */
export function ServiceHealthIcon({
  status,
  className,
}: {
  status: ServiceHealthStatus;
  className?: string;
}) {
  let colorClass: string;
  let Icon;

  switch (status) {
    case "HEALTHY":
      colorClass = "text-success";
      Icon = CheckCircle2;
      break;
    case "DEGRADED":
      colorClass = "text-warning";
      Icon = AlertTriangle;
      break;
    case "UNHEALTHY":
    case "DOWN":
      colorClass = "text-destructive";
      Icon = XCircle;
      break;
    case "MAINTENANCE":
      colorClass = "text-blue-600 dark:text-blue-400";
      Icon = Wrench;
      break;
    case "UNKNOWN":
    default:
      colorClass = "text-muted-foreground";
      Icon = HelpCircle;
      break;
  }

  return <Icon className={cn("h-4 w-4", colorClass, className)} />;
}

/**
 * Service Health Pulse Indicator
 *
 * Animated pulse dot for live health monitoring
 */
export function ServiceHealthPulse({
  status,
  className,
}: {
  status: ServiceHealthStatus;
  className?: string;
}) {
  let colorClass: string;

  switch (status) {
    case "HEALTHY":
      colorClass = "bg-success";
      break;
    case "DEGRADED":
      colorClass = "bg-warning";
      break;
    case "UNHEALTHY":
    case "DOWN":
      colorClass = "bg-destructive";
      break;
    case "MAINTENANCE":
      colorClass = "bg-blue-500";
      break;
    case "UNKNOWN":
    default:
      colorClass = "bg-muted-foreground";
      break;
  }

  return (
    <span className={cn("relative flex h-2 w-2", className)}>
      {status === "HEALTHY" && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            colorClass,
          )}
        />
      )}
      <span
        className={cn("relative inline-flex h-2 w-2 rounded-full", colorClass)}
      />
    </span>
  );
}
