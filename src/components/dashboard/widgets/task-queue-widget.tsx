"use client";

/**
 * Task Queue Widget
 * Shows pending tasks and work items
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Wrench, Package, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { formatDistance } from "date-fns";

interface TaskItem {
  id: string;
  type: "maintenance" | "assignment" | "warranty";
  title: string;
  assetTag: string;
  dueDate: Date;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

const priorityColors = {
  HIGH: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  MEDIUM:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

const typeIcons = {
  maintenance: <Wrench className="h-4 w-4" />,
  assignment: <Package className="h-4 w-4" />,
  warranty: <Clock className="h-4 w-4" />,
};

export function TaskQueueWidget() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        // TODO: Replace with actual server action
        // For now, using placeholder data
        await new Promise((resolve) => setTimeout(resolve, 500));
        setTasks([
          {
            id: "1",
            type: "maintenance",
            title: "Scheduled maintenance - Server Rack A",
            assetTag: "SRV-001",
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            priority: "HIGH",
          },
          {
            id: "2",
            type: "warranty",
            title: "Warranty renewal review",
            assetTag: "LPT-042",
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            priority: "MEDIUM",
          },
          {
            id: "3",
            type: "assignment",
            title: "Asset assignment pending",
            assetTag: "MON-156",
            dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            priority: "HIGH",
          },
        ]);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        toast.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Queue</CardTitle>
          <CardDescription>Loading tasks...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted h-16 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Queue</CardTitle>
        <CardDescription>
          Pending tasks and work items ({tasks.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="hover:bg-accent flex items-start gap-3 rounded-lg border p-3 transition-colors"
              >
                <div className="text-muted-foreground mt-0.5">
                  {typeIcons[task.type]}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm leading-tight font-medium">
                      {task.title}
                    </p>
                    <Badge
                      variant="secondary"
                      className={priorityColors[task.priority]}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Asset: {task.assetTag} • Due{" "}
                    {formatDistance(task.dueDate, new Date(), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/maintenance/schedules">
                  View All Tasks
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
            No pending tasks
          </div>
        )}
      </CardContent>
    </Card>
  );
}
