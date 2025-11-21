"use client";

/**
 * Quick Actions Widget
 * Shortcut buttons for common tasks
 */

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Package,
  TrendingUp,
  Wrench,
  ShieldCheck,
  Zap,
} from "lucide-react";

const quickActions = [
  {
    label: "Add Asset",
    href: "/assets?action=create",
    icon: Plus,
    description: "Add new asset",
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    label: "Assign Asset",
    href: "/asset-assignments?action=create",
    icon: Package,
    description: "Assign to employee",
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    label: "Stock Movement",
    href: "/stock-movements?action=create",
    icon: TrendingUp,
    description: "Record movement",
    color: "bg-purple-500 hover:bg-purple-600",
  },
  {
    label: "Schedule Maintenance",
    href: "/maintenance/schedules?action=create",
    icon: Wrench,
    description: "Create schedule",
    color: "bg-orange-500 hover:bg-orange-600",
  },
  {
    label: "Add Warranty",
    href: "/warranties?action=create",
    icon: ShieldCheck,
    description: "Register warranty",
    color: "bg-indigo-500 hover:bg-indigo-600",
  },
];

export function QuickActionsWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="text-barq-yellow h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>Shortcuts to common tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.href}
                variant="outline"
                className="hover:bg-accent h-auto justify-start gap-3 p-3 text-left transition-colors"
                asChild
              >
                <Link href={action.href}>
                  <div className={`rounded-md p-2 text-white ${action.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {action.description}
                    </p>
                  </div>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
