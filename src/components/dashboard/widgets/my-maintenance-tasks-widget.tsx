/**
 * My Maintenance Tasks Widget
 * Displays maintenance schedules assigned to the current user
 */

"use client";

import { useEffect, useState } from "react";
import { WidgetContainer } from "@/components/dashboard/widget-container";
import { WidgetSkeleton } from "@/components/dashboard/widget-skeleton";
import { WidgetEmpty } from "@/components/dashboard/widget-empty";
import { WidgetError } from "@/components/dashboard/widget-error";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, ExternalLink, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import {
  getMyMaintenanceTasksAction,
  type MyMaintenanceTaskDTO,
} from "@/interface-adapters/controllers/my-dashboard.controller";
import {
  formatDistanceToNow,
  isPast,
  isToday,
  addDays,
  isBefore,
} from "date-fns";

function getPriorityVariant(
  priority: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case "CRITICAL":
    case "HIGH":
      return "destructive";
    case "MEDIUM":
      return "default";
    default:
      return "secondary";
  }
}

function getDueDateStatus(
  dueDate: string | null,
): { label: string; variant: "destructive" | "default" | "secondary" } | null {
  if (!dueDate) return null;

  const date = new Date(dueDate);
  if (isPast(date)) {
    return { label: "Overdue", variant: "destructive" };
  }
  if (isToday(date)) {
    return { label: "Due today", variant: "destructive" };
  }
  if (isBefore(date, addDays(new Date(), 7))) {
    return { label: "Due soon", variant: "default" };
  }
  return null;
}

export function MyMaintenanceTasksWidget() {
  const [tasks, setTasks] = useState<MyMaintenanceTaskDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMyMaintenanceTasksAction();
      if (result.success) {
        // Sort by due date, with overdue items first
        const sorted = result.data.sort((a, b) => {
          if (!a.nextDueDate) return 1;
          if (!b.nextDueDate) return -1;
          return (
            new Date(a.nextDueDate).getTime() -
            new Date(b.nextDueDate).getTime()
          );
        });
        setTasks(sorted);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to load maintenance tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const overdueCount = tasks.filter(
    (t) => t.nextDueDate && isPast(new Date(t.nextDueDate)),
  ).length;

  if (isLoading) {
    return (
      <WidgetContainer
        title="Maintenance Tasks"
        icon={<Wrench className="h-4 w-4" />}
        featureFlag="MAINTENANCE"
        permission={PERMISSIONS.MAINTENANCE_SCHEDULES_VIEW}
      >
        <WidgetSkeleton rows={3} />
      </WidgetContainer>
    );
  }

  if (error) {
    return (
      <WidgetContainer
        title="Maintenance Tasks"
        icon={<Wrench className="h-4 w-4" />}
        featureFlag="MAINTENANCE"
        permission={PERMISSIONS.MAINTENANCE_SCHEDULES_VIEW}
      >
        <WidgetError message={error} onRetry={fetchTasks} />
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Maintenance Tasks"
      icon={<Wrench className="h-4 w-4" />}
      description={overdueCount > 0 ? `${overdueCount} overdue` : undefined}
      featureFlag="MAINTENANCE"
      permission={PERMISSIONS.MAINTENANCE_SCHEDULES_VIEW}
      headerAction={
        tasks.length > 0 && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/maintenance/schedules">
              <ExternalLink className="mr-1 h-3 w-3" />
              View All
            </Link>
          </Button>
        )
      }
    >
      {tasks.length === 0 ? (
        <WidgetEmpty
          icon={Wrench}
          title="No maintenance tasks"
          description="You have no maintenance schedules assigned to you."
        />
      ) : (
        <div className="space-y-3">
          {tasks.slice(0, 5).map((task) => {
            const dueDateStatus = getDueDateStatus(task.nextDueDate);
            return (
              <Link
                key={task.id}
                href={`/assets/maintenance/${task.id}`}
                className="hover:bg-muted/50 -mx-2 flex items-center justify-between rounded border-b px-2 py-1 pb-2 transition-colors last:border-0 last:pb-0"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{task.title}</span>
                    <Badge
                      variant={getPriorityVariant(task.priority)}
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    {task.assetTag && <span>Asset: {task.assetTag}</span>}
                    <span>•</span>
                    <span>{task.scheduleType}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {dueDateStatus ? (
                    <Badge variant={dueDateStatus.variant} className="text-xs">
                      {dueDateStatus.variant === "destructive" && (
                        <AlertTriangle className="mr-1 h-3 w-3" />
                      )}
                      {dueDateStatus.label}
                    </Badge>
                  ) : task.nextDueDate ? (
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(task.nextDueDate), {
                        addSuffix: true,
                      })}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
          {tasks.length > 5 && (
            <p className="text-muted-foreground pt-2 text-center text-xs">
              +{tasks.length - 5} more tasks
            </p>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}
