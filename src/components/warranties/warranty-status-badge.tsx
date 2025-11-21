/**
 * Warranty Status Badge Component
 * Displays visual status indicator for warranty state
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Shield, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

interface WarrantyStatusBadgeProps {
  isActive: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number;
  className?: string;
  showIcon?: boolean;
}

export function WarrantyStatusBadge({
  isActive,
  isExpired,
  isExpiringSoon,
  daysRemaining,
  className,
  showIcon = true,
}: WarrantyStatusBadgeProps) {
  // Determine status
  let status: "active" | "expiring" | "expired" | "future";
  let label: string;
  let variant: "default" | "secondary" | "destructive" | "outline";
  let bgClass: string;
  let Icon = Shield;

  if (isExpired) {
    status = "expired";
    label = "Expired";
    variant = "destructive";
    bgClass = "bg-destructive";
    Icon = AlertTriangle;
  } else if (!isActive) {
    status = "future";
    label = "Future";
    variant = "secondary";
    bgClass = "bg-muted";
    Icon = Clock;
  } else if (isExpiringSoon) {
    status = "expiring";
    label = daysRemaining > 0 ? `${daysRemaining}d left` : "Expires today";
    variant = "outline";
    bgClass = "bg-warning/10 text-warning border-warning";
    Icon = AlertTriangle;
  } else {
    status = "active";
    label = daysRemaining > 0 ? `${daysRemaining}d left` : "Active";
    variant = "default";
    bgClass = "bg-success";
    Icon = CheckCircle2;
  }

  return (
    <Badge
      variant={variant}
      className={cn(
        "gap-1.5",
        status === "active" && bgClass,
        status === "expiring" && bgClass,
        className,
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  );
}
