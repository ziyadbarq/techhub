import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils/date-format";
import type { DatabaseBackupDto } from "@/interface-adapters/dtos/database-backup.dto";
import { BackupStatusBadge } from "./BackupStatusBadge";
import { BackupActionsMenu } from "./BackupActionsMenu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Props {
  backups: DatabaseBackupDto[];
  onDownload: (backup: DatabaseBackupDto) => void;
  onRestore: (backup: DatabaseBackupDto) => void;
  onDelete: (backup: DatabaseBackupDto) => void;
  disableMutations?: boolean;
}

function formatBytes(bytes: number): string {
  if (!bytes || Number.isNaN(bytes)) return "-";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    sizes.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / 1024 ** i;
  return `${value.toFixed(1)} ${sizes[i]}`;
}

function formatDuration(seconds?: number | null): string {
  if (!seconds) return "-";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

function formatStage(stage?: string | null): string {
  if (!stage) return "—";
  return stage
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function DatabaseBackupsTable({
  backups,
  onDelete,
  onDownload,
  onRestore,
  disableMutations = false,
}: Props) {
  const truncate = (value?: string | null, len = 12) => {
    if (!value) return "—";
    if (value.length <= len) return value;
    return `${value.slice(0, len)}…`;
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Filename</TableHead>
            <TableHead className="w-[200px]">Progress</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[220px]">Notes / Errors</TableHead>
            <TableHead className="w-[240px]">Integrity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {backups.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-muted-foreground text-center text-sm"
              >
                No backups found. Create your first backup to get started.
              </TableCell>
            </TableRow>
          ) : (
            backups.map((backup) => (
              <TableRow key={backup.id}>
                <TableCell className="font-mono text-sm">
                  {backup.filename}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Progress
                      value={Math.min(100, Math.max(0, backup.percentage ?? 0))}
                    />
                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                      <span>{formatStage(backup.stage)}</span>
                      <span>{Math.round(backup.percentage ?? 0)}%</span>
                    </div>
                    {backup.currentStep && (
                      <div
                        className="text-muted-foreground text-xs"
                        title={backup.currentStep}
                      >
                        {backup.currentStep}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatBytes(backup.fileSize)}</TableCell>
                <TableCell>{formatDuration(backup.durationSeconds)}</TableCell>
                <TableCell className="text-sm">
                  <div>{formatDateTime(backup.createdAt)}</div>
                </TableCell>
                <TableCell className="text-sm">
                  <div
                    className={cn(
                      "line-clamp-2 break-all",
                      backup.errorMessage
                        ? "text-red-600"
                        : "text-muted-foreground",
                    )}
                    title={backup.errorMessage || backup.notes || undefined}
                  >
                    {backup.errorMessage || backup.notes || "—"}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        SHA-256
                      </span>
                      <span
                        className="font-mono text-xs"
                        title={backup.checksum || undefined}
                      >
                        {truncate(backup.checksum)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        DB: {backup.dbSchemaVersion ?? "unknown"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Code: {backup.codeSchemaVersion ?? "unknown"}
                      </Badge>
                      {backup.schemaDrift ? (
                        <Badge variant="destructive" className="text-xs">
                          Drift detected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          In sync
                        </Badge>
                      )}
                    </div>
                    {backup.verificationStatus && (
                      <div className="text-muted-foreground text-xs">
                        Verify: {backup.verificationStatus}
                        {backup.verificationError
                          ? ` (${backup.verificationError})`
                          : ""}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <BackupStatusBadge status={backup.status} />
                </TableCell>
                <TableCell className="text-right">
                  <BackupActionsMenu
                    backup={backup}
                    onDownload={onDownload}
                    onRestore={onRestore}
                    onDelete={onDelete}
                    disableMutations={disableMutations}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
