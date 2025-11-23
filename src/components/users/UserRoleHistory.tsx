/**
 * User Role History Component
 *
 * Displays the audit trail of role assignments and removals for a user.
 * Shows who made changes, when, and what was changed.
 */

"use client";

import * as React from "react";
import { Clock, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { listAuditLogsAction } from "@/interface-adapters/controllers/audit-log.controller";
import type { AuditLogDTO } from "@/interface-adapters/presenters/audit-log.presenter";

interface UserRoleHistoryProps {
  userId: string;
  userEmail: string;
  trigger?: React.ReactNode;
}

export function UserRoleHistory({
  userId,
  userEmail,
  trigger,
}: UserRoleHistoryProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [history, setHistory] = React.useState<AuditLogDTO[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listAuditLogsAction({
        userId,
        entityType: "user_role",
        pageSize: 100, // Load more history entries
      });

      if (result.success) {
        setHistory(result.data.data);
      } else {
        setError(result.error || "Failed to load role history");
      }
    } catch (err) {
      setError("Failed to load role history");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && history.length === 0) {
      loadHistory();
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "assign":
      case "create":
        return <UserPlus className="h-4 w-4 text-green-600" />;
      case "remove":
      case "delete":
        return <UserMinus className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "assign":
      case "create":
        return (
          <Badge variant="default" className="bg-green-600">
            Assigned
          </Badge>
        );
      case "remove":
      case "delete":
        return (
          <Badge variant="default" className="bg-red-600">
            Removed
          </Badge>
        );
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const parseEntityData = (entry: AuditLogDTO) => {
    try {
      const data = JSON.parse(entry.entityData);
      return {
        roleName: data.roleName || data.roleDisplayName || "Unknown Role",
        expiresAt: data.expiresAt,
      };
    } catch {
      return {
        roleName: "Unknown Role",
        expiresAt: null,
      };
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Clock className="mr-2 h-4 w-4" />
            View History
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Role Assignment History</DialogTitle>
          <DialogDescription>
            Audit trail of role changes for {userEmail}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Clock className="text-muted-foreground mx-auto h-12 w-12" />
                <p className="text-muted-foreground mt-4 text-sm">
                  No role history found
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => {
                const { roleName, expiresAt } = parseEntityData(entry);
                return (
                  <div key={entry.id}>
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="mt-1">{getActionIcon(entry.action)}</div>

                      {/* Content */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          {getActionBadge(entry.action)}
                          <span className="font-medium">{roleName}</span>
                        </div>

                        {expiresAt && (
                          <p className="text-muted-foreground text-sm">
                            Expires: {format(new Date(expiresAt), "PPP")}
                          </p>
                        )}

                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                          <span>
                            {format(
                              new Date(entry.timestamp),
                              "MMM d, yyyy h:mm a",
                            )}
                          </span>
                          {entry.performedByEmail && (
                            <>
                              <span>•</span>
                              <span>by {entry.performedByEmail}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Separator */}
                    {index < history.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
