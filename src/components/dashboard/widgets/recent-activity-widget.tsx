"use client";

/**
 * Recent Activity Widget
 * Shows recent system activities
 */

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, Plus, Pencil, Trash2, Dot } from "lucide-react";
import { toast } from "sonner";
import { formatDistance } from "date-fns";
import {
  getMyRecentActivityAction,
  type RecentActivityDTO,
} from "@/interface-adapters/controllers/my-dashboard.controller";

/** Coarse icon/colour by action verb — audit actions vary per module. */
function activityVisual(action: string) {
  const a = action.toLowerCase();
  if (a.includes("create") || a.includes("add")) {
    return {
      icon: Plus,
      color:
        "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200",
    };
  }
  if (a.includes("delete") || a.includes("remove") || a.includes("void")) {
    return {
      icon: Trash2,
      color: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200",
    };
  }
  if (a.includes("update") || a.includes("edit")) {
    return {
      icon: Pencil,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200",
    };
  }
  return {
    icon: Dot,
    color: "bg-muted text-muted-foreground",
  };
}

/** "asset.status_changed" / "CREATE" → "Asset status changed" / "Create". */
function humanize(text: string): string {
  const cleaned = text.replace(/[._]/g, " ").trim().toLowerCase();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function RecentActivityWidget() {
  const [activities, setActivities] = useState<RecentActivityDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        const result = await getMyRecentActivityAction();
        if (result.success) {
          setActivities(result.data);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Failed to load recent activities");
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Loading activities...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-muted h-14 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest system activities and updates</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => {
              const visual = activityVisual(activity.action);
              const Icon = visual.icon;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 border-b pb-3 last:border-0"
                >
                  <div className={`rounded-full p-2 ${visual.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {humanize(activity.action)}
                      <span className="text-muted-foreground ml-2 font-normal">
                        {humanize(activity.entityType)}
                      </span>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDistance(
                        new Date(activity.createdAt),
                        new Date(),
                        { addSuffix: true },
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
            No recent activity
          </div>
        )}
      </CardContent>
    </Card>
  );
}
