/**
 * Approval Workflow Component - Simplified Version
 */

"use client";

import { Badge } from "@/components/ui/badge";

interface ApprovalWorkflowProps {
  disposalId: string;
  onSuccess: () => void;
}

export function ApprovalWorkflow(_props: ApprovalWorkflowProps) {
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">Approval Workflow</h3>
      <div className="space-y-3">
        <div className="text-muted-foreground rounded-lg border p-4 text-center text-sm">
          <p>Approval workflow management will be displayed here</p>
          <Badge variant="outline" className="mt-2">
            Coming Soon
          </Badge>
        </div>
      </div>
    </div>
  );
}
