/**
 * Service SLA Compliance Badge Component
 *
 * Displays visual status indicator for SLA compliance
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MinusCircle,
} from "lucide-react";
import type { SlaComplianceStatus } from "@/generated/prisma";

interface ServiceSlaBadgeProps {
  status: SlaComplianceStatus;
  className?: string;
  showIcon?: boolean;
}

export function ServiceSlaBadge({
  status,
  className,
  showIcon = true,
}: ServiceSlaBadgeProps) {
  let label: string;
  let variant: "default" | "secondary" | "destructive" | "outline";
  let bgClass: string;
  let Icon;

  switch (status) {
    case "COMPLIANT":
      label = "Compliant";
      variant = "default";
      bgClass = "bg-success text-success-foreground";
      Icon = CheckCircle2;
      break;
    case "AT_RISK":
      label = "At Risk";
      variant = "outline";
      bgClass = "bg-warning/10 text-warning border-warning";
      Icon = AlertTriangle;
      break;
    case "BREACHED":
      label = "Breached";
      variant = "destructive";
      bgClass = "bg-destructive";
      Icon = XCircle;
      break;
    case "NOT_APPLICABLE":
    default:
      label = "N/A";
      variant = "secondary";
      bgClass = "bg-muted";
      Icon = MinusCircle;
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
 * SLA Compliance Icon Component
 *
 * Displays just the icon without badge wrapper for inline use
 */
export function ServiceSlaIcon({
  status,
  className,
}: {
  status: SlaComplianceStatus;
  className?: string;
}) {
  let colorClass: string;
  let Icon;

  switch (status) {
    case "COMPLIANT":
      colorClass = "text-success";
      Icon = CheckCircle2;
      break;
    case "AT_RISK":
      colorClass = "text-warning";
      Icon = AlertTriangle;
      break;
    case "BREACHED":
      colorClass = "text-destructive";
      Icon = XCircle;
      break;
    case "NOT_APPLICABLE":
    default:
      colorClass = "text-muted-foreground";
      Icon = MinusCircle;
      break;
  }

  return <Icon className={cn("h-4 w-4", colorClass, className)} />;
}
