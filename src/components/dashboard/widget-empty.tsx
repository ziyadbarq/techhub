/**
 * Widget Empty State
 * Displays a helpful empty state when a widget has no data
 */

"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface WidgetEmptyProps {
  /** Icon to display */
  icon?: LucideIcon;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Optional action link */
  action?: {
    label: string;
    href: string;
  };
}

export function WidgetEmpty({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: WidgetEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="text-muted-foreground mb-3 h-12 w-12" />
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-[200px] text-xs">
          {description}
        </p>
      )}
      {action && (
        <Button asChild variant="link" size="sm" className="mt-2">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
