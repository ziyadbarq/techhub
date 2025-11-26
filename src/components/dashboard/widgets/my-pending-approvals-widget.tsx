/**
 * My Pending Approvals Widget
 * Displays disposal approvals awaiting the current user's decision
 */

"use client";

import { useEffect, useState } from "react";
import { WidgetContainer } from "@/components/dashboard/widget-container";
import { WidgetSkeleton } from "@/components/dashboard/widget-skeleton";
import { WidgetEmpty } from "@/components/dashboard/widget-empty";
import { WidgetError } from "@/components/dashboard/widget-error";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import {
  getMyPendingApprovalsAction,
  type MyPendingApprovalDTO,
} from "@/interface-adapters/controllers/my-dashboard.controller";
import { formatDistanceToNow } from "date-fns";

export function MyPendingApprovalsWidget() {
  const [approvals, setApprovals] = useState<MyPendingApprovalDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMyPendingApprovalsAction();
      if (result.success) {
        setApprovals(result.data);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to load approvals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  if (isLoading) {
    return (
      <WidgetContainer
        title="Pending Approvals"
        icon={<ClipboardCheck className="h-4 w-4" />}
        featureFlag="ASSET_DISPOSALS"
        permission={PERMISSIONS.ASSET_DISPOSALS_APPROVE}
      >
        <WidgetSkeleton rows={3} />
      </WidgetContainer>
    );
  }

  if (error) {
    return (
      <WidgetContainer
        title="Pending Approvals"
        icon={<ClipboardCheck className="h-4 w-4" />}
        featureFlag="ASSET_DISPOSALS"
        permission={PERMISSIONS.ASSET_DISPOSALS_APPROVE}
      >
        <WidgetError message={error} onRetry={fetchApprovals} />
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Pending Approvals"
      icon={<ClipboardCheck className="h-4 w-4" />}
      featureFlag="ASSET_DISPOSALS"
      permission={PERMISSIONS.ASSET_DISPOSALS_APPROVE}
      headerAction={
        approvals.length > 0 && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/assets/disposals">
              <ExternalLink className="mr-1 h-3 w-3" />
              View All
            </Link>
          </Button>
        )
      }
    >
      {approvals.length === 0 ? (
        <WidgetEmpty
          icon={ClipboardCheck}
          title="No pending approvals"
          description="You have no disposal requests awaiting your approval."
        />
      ) : (
        <div className="space-y-3">
          {approvals.slice(0, 5).map((approval) => (
            <Link
              key={approval.id}
              href={`/assets/disposals/${approval.disposalId}`}
              className="hover:bg-muted/50 -mx-2 flex items-center justify-between rounded border-b px-2 py-1 pb-2 transition-colors last:border-0 last:pb-0"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{approval.type}</span>
                  <Badge variant="outline" className="text-xs">
                    {approval.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  Requested{" "}
                  {formatDistanceToNow(new Date(approval.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </Link>
          ))}
          {approvals.length > 5 && (
            <p className="text-muted-foreground pt-2 text-center text-xs">
              +{approvals.length - 5} more pending approvals
            </p>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}
