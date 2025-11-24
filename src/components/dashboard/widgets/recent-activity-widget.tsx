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
import {
  Activity,
  Package,
  TrendingUp,
  Wrench,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistance } from "date-fns";

interface ActivityItem {
  id: string;
  type: "assignment" | "movement" | "maintenance" | "warranty";
  assetTag: string;
  description: string;
  timestamp: Date;
  user: string;
}

const activityIcons = {
  assignment: {
    icon: Package,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200",
  },
  movement: {
    icon: TrendingUp,
    color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200",
  },
  maintenance: {
    icon: Wrench,
    color:
      "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-200",
  },
  warranty: {
    icon: ShieldCheck,
    color:
      "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200",
  },
};

export function RecentActivityWidget() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        // TODO: Replace with actual server action
        // For now, using placeholder data
        await new Promise((resolve) => setTimeout(resolve, 500));
        setActivities([
          {
            id: "1",
            type: "assignment",
            assetTag: "LPT-042",
            description: "Assigned to Ahmed Al Saud",
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            user: "Admin User",
          },
          {
            id: "2",
            type: "movement",
            assetTag: "SRV-001",
            description: "Moved from Warehouse to Server Room",
            timestamp: new Date(Date.now() - 45 * 60 * 1000),
            user: "Stock Manager",
          },
          {
            id: "3",
            type: "maintenance",
            assetTag: "PRN-023",
            description: "Maintenance completed",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            user: "Technician",
          },
          {
            id: "4",
            type: "warranty",
            assetTag: "MON-156",
            description: "Warranty registered",
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
            user: "Procurement",
          },
          {
            id: "5",
            type: "assignment",
            assetTag: "KBD-089",
            description: "Returned from Fatimah AlHarbi",
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
            user: "IT Support",
          },
        ]);
      } catch (error) {
        console.error("Failed to fetch activities:", error);
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
              const IconConfig = activityIcons[activity.type];
              const Icon = IconConfig.icon;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 border-b pb-3 last:border-0"
                >
                  <div className={`rounded-full p-2 ${IconConfig.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {activity.assetTag}
                      <span className="text-muted-foreground ml-2 font-normal">
                        {activity.description}
                      </span>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {activity.user} •{" "}
                      {formatDistance(activity.timestamp, new Date(), {
                        addSuffix: true,
                      })}
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
