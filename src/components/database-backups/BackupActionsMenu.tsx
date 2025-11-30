import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, MoreHorizontal, RefreshCcw, Trash2 } from "lucide-react";
import type { DatabaseBackupDto } from "@/interface-adapters/dtos/database-backup.dto";

interface Props {
  backup: DatabaseBackupDto;
  onDownload: (backup: DatabaseBackupDto) => void;
  onRestore: (backup: DatabaseBackupDto) => void;
  onDelete: (backup: DatabaseBackupDto) => void;
  disableMutations?: boolean;
}

export function BackupActionsMenu({
  backup,
  onDelete,
  onDownload,
  onRestore,
  disableMutations = false,
}: Props) {
  const isCompleted = backup.status === "COMPLETED";
  const isRunning = backup.status === "RUNNING";
  const isPending = backup.status === "PENDING";
  const hasActiveJob = isRunning || isPending || disableMutations;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Backup actions"
          disabled={hasActiveJob && !isCompleted}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => onDownload(backup)}
          disabled={!isCompleted || disableMutations}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onRestore(backup)}
          disabled={!isCompleted || disableMutations}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Restore Database
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(backup)}
          disabled={hasActiveJob}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
