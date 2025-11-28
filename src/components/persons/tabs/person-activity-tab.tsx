/**
 * Person Activity Tab
 *
 * Displays audit log entries and activity history for this person.
 */

"use client";

import { Activity, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PersonActivityTabProps {
  personId: string;
}

export function PersonActivityTab({
  personId: _personId,
}: PersonActivityTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Log
          </CardTitle>
          <CardDescription>
            Recent activities and changes made by this person
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2">
            <Clock className="text-muted-foreground h-12 w-12" />
            <p className="text-muted-foreground text-sm">
              Activity timeline coming soon
            </p>
            <p className="text-muted-foreground text-xs">
              This will show audit log entries, maintenance records, and other
              activities
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
