import type { BackupStatus } from "@/core/domain/entities/database-backup.entity";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

interface Props {
  status: BackupStatus;
}

export function BackupStatusBadge({ status }: Props) {
  if (status === "RUNNING" || status === "PENDING") {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        In Progress
      </Badge>
    );
  }

  if (status === "FAILED") {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="flex items-center gap-1">
      <CheckCircle2 className="h-3 w-3" />
      Success
    </Badge>
  );
}
