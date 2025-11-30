/**
 * Person Activity Tab
 *
 * Displays audit log entries and activity history for this person.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Clock, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils/date-format";
import {
  getPersonAuditLogAction,
  type PersonAuditLogResponse,
} from "@/interface-adapters/controllers/person-details.controller";

interface PersonActivityTabProps {
  personId: string;
}

export function PersonActivityTab({ personId }: PersonActivityTabProps) {
  const [logs, setLogs] = useState<PersonAuditLogResponse>({
    performed: [],
    affecting: [],
  });
  const [loading, setLoading] = useState(true);
  const totalLogs = logs.performed.length + logs.affecting.length;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPersonAuditLogAction(personId);
      if (result.success) {
        setLogs(result.data);
      } else {
        toast.error(result.error ?? "Failed to load activity");
      }
    } catch {
      toast.error("Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Log
          </CardTitle>
          <CardDescription>
            Recent audit events performed by this person and changes to their
            record
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : totalLogs === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center gap-2">
              <Clock className="text-muted-foreground h-10 w-10" />
              <p className="text-muted-foreground text-sm">
                No recent activity recorded
              </p>
              <p className="text-muted-foreground text-xs">
                Audit logs will appear here as this person performs actions
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <ActivitySection
                title="Performed by this person"
                logs={logs.performed}
              />
              <ActivitySection
                title="Changes to this person"
                logs={logs.affecting}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ActivitySectionProps {
  title: string;
  logs: Array<{
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    fieldName: string | null;
    changedAt: string;
    note: string | null;
    sourceSystem: string | null;
  }>;
}

function ActivitySection({ title, logs }: ActivitySectionProps) {
  if (logs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">{title}</div>
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start justify-between gap-3 rounded-md border p-3"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{log.action}</Badge>
              <Badge variant="secondary">{log.targetType}</Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              Target: {log.targetId}
              {log.fieldName ? ` • Field: ${log.fieldName}` : ""}
            </p>
            {log.note && (
              <p className="text-muted-foreground line-clamp-2 text-xs">
                {log.note}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-muted-foreground text-xs">
              {formatDateTime(log.changedAt)}
            </span>
            {log.sourceSystem && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {log.sourceSystem}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
