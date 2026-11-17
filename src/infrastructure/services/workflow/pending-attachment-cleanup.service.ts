import { inject, injectable } from "inversify";

import type { PrismaClient } from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import { PENDING_ATTACHMENT_MAX_AGE_MS } from "@/core/domain/workflow/file-field";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import {
  PrivateStorageUnavailableError,
  type PrivateFileStorage,
} from "@/lib/storage/private-file-storage";
import { workflowFileStorage } from "@/lib/workflows/attachments/storage";

export interface PendingAttachmentCleanupResult {
  /** Pending uploads past the age limit that this run looked at. */
  scanned: number;
  /** File and row both removed. */
  deleted: number;
  /** File removal failed; the row is kept so the next run retries. */
  failed: number;
  /**
   * File removed but the row was no longer pending at delete time: linked to
   * a request, or deleted by a concurrent run. Row left as it was.
   */
  skipped: number;
  /** No private storage is configured here, so nothing was touched. */
  storageUnavailable: boolean;
}

/**
 * Deletes FILE-field uploads that were never submitted: `request_attachments`
 * rows with no request, older than PENDING_ATTACHMENT_MAX_AGE_MS.
 *
 * The stored file goes first, then the row, and the row is deleted only if
 * it still has no request. A failed file removal keeps the row, so the next
 * run retries it; file removal ignores files that are already gone, so a run
 * that stopped halfway is simply finished by the next. Safe to run
 * repeatedly and concurrently.
 */
export interface IPendingAttachmentCleanup {
  run(now?: Date): Promise<PendingAttachmentCleanupResult>;
}

/** Rows fetched per query. */
const BATCH_SIZE = 100;
/** Upper bound per run; anything left over is picked up by the next run. */
const MAX_PER_RUN = 1000;

@injectable()
export class PendingAttachmentCleanupService implements IPendingAttachmentCleanup {
  constructor(
    @inject(DI_TOKENS.PrismaClient) private readonly prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService) private readonly logger: ILoggerService,
  ) {}

  async run(now: Date = new Date()): Promise<PendingAttachmentCleanupResult> {
    const result: PendingAttachmentCleanupResult = {
      scanned: 0,
      deleted: 0,
      failed: 0,
      skipped: 0,
      storageUnavailable: false,
    };

    let storage: PrivateFileStorage;
    try {
      storage = workflowFileStorage();
    } catch (error) {
      if (!(error instanceof PrivateStorageUnavailableError)) throw error;
      // Without the store the files can't be removed, and deleting only the
      // rows would leave the files behind for good. Leave both.
      this.logger.warn(
        "workflow.pending-attachment-cleanup.storage-unavailable",
      );
      return { ...result, storageUnavailable: true };
    }

    const cutoff = new Date(now.getTime() - PENDING_ATTACHMENT_MAX_AGE_MS);
    // Rows whose file couldn't be removed this run; skipped so the loop moves on.
    const failedIds: string[] = [];

    while (result.scanned < MAX_PER_RUN) {
      const rows = await this.prisma.requestAttachment.findMany({
        where: {
          requestId: null,
          createdAt: { lt: cutoff },
          ...(failedIds.length > 0 ? { id: { notIn: failedIds } } : {}),
        },
        select: { id: true, storageRef: true },
        orderBy: { createdAt: "asc" },
        take: Math.min(BATCH_SIZE, MAX_PER_RUN - result.scanned),
      });
      if (rows.length === 0) break;
      result.scanned += rows.length;

      for (const row of rows) {
        try {
          await storage.remove(row.storageRef);
        } catch (error) {
          result.failed += 1;
          failedIds.push(row.id);
          this.logger.warn(
            "workflow.pending-attachment-cleanup.file-remove-failed",
            {
              attachmentId: row.id,
              error: error instanceof Error ? error.message : String(error),
            },
          );
          continue;
        }

        const { count } = await this.prisma.requestAttachment.deleteMany({
          where: { id: row.id, requestId: null },
        });
        if (count === 1) {
          result.deleted += 1;
        } else {
          // Another run got here first, or a submission linked the file after
          // the scan (which the link window rules out). Worth hearing about.
          result.skipped += 1;
          this.logger.warn(
            "workflow.pending-attachment-cleanup.row-changed-after-file-removed",
            { attachmentId: row.id },
          );
        }
      }

      if (rows.length < BATCH_SIZE) break;
    }

    return result;
  }
}
