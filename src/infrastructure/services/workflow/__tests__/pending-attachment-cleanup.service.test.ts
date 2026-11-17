import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockWorkflowFileStorage, mockGetContainer } = vi.hoisted(() => ({
  mockWorkflowFileStorage: vi.fn(),
  mockGetContainer: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/di/container", () => ({ getContainer: mockGetContainer }));
vi.mock("@/lib/workflows/attachments/storage", () => ({
  workflowFileStorage: mockWorkflowFileStorage,
}));

import { DI_TOKENS } from "@/di/types";
import {
  PENDING_ATTACHMENT_LINK_WINDOW_MS,
  PENDING_ATTACHMENT_MAX_AGE_MS,
} from "@/core/domain/workflow/file-field";
import { PrivateStorageUnavailableError } from "@/lib/storage/private-file-storage";
import { PendingAttachmentCleanupService } from "../pending-attachment-cleanup.service";
import { handleWorkflowPendingAttachmentCleanup } from "@/infrastructure/services/queue/handlers/workflow-pending-attachment-cleanup.handler";

const NOW = new Date("2026-11-17T12:00:00.000Z");
const CUTOFF = new Date(NOW.getTime() - PENDING_ATTACHMENT_MAX_AGE_MS);

const prisma = {
  requestAttachment: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
};
const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
const storage = { upload: vi.fn(), read: vi.fn(), remove: vi.fn() };

function rows(count: number, start = 0) {
  return Array.from({ length: count }, (_, i) => ({
    id: `att-${start + i}`,
    storageRef: `wf-dev/file-${start + i}.pdf`,
  }));
}

function service() {
  return new PendingAttachmentCleanupService(prisma as never, logger as never);
}

describe("PendingAttachmentCleanupService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkflowFileStorage.mockReturnValue(storage);
    storage.remove.mockResolvedValue(undefined);
    prisma.requestAttachment.deleteMany.mockResolvedValue({ count: 1 });
  });

  it("removes the stored file, then the row, for pending uploads older than 24h", async () => {
    prisma.requestAttachment.findMany.mockResolvedValueOnce(rows(2));

    const result = await service().run(NOW);

    expect(prisma.requestAttachment.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.requestAttachment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { requestId: null, createdAt: { lt: CUTOFF } },
        select: { id: true, storageRef: true },
      }),
    );
    expect(storage.remove).toHaveBeenNthCalledWith(1, "wf-dev/file-0.pdf");
    expect(storage.remove).toHaveBeenNthCalledWith(2, "wf-dev/file-1.pdf");
    // Row delete is conditional on the row still being pending.
    expect(prisma.requestAttachment.deleteMany).toHaveBeenNthCalledWith(1, {
      where: { id: "att-0", requestId: null },
    });
    // File before row, for each attachment.
    expect(storage.remove.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.requestAttachment.deleteMany.mock.invocationCallOrder[0],
    );
    expect(storage.remove.mock.invocationCallOrder[1]).toBeLessThan(
      prisma.requestAttachment.deleteMany.mock.invocationCallOrder[1],
    );
    expect(result).toEqual({
      scanned: 2,
      deleted: 2,
      failed: 0,
      skipped: 0,
      storageUnavailable: false,
    });
  });

  it("keeps the row when its file can't be removed, and carries on", async () => {
    prisma.requestAttachment.findMany.mockResolvedValueOnce(rows(2));
    storage.remove
      .mockRejectedValueOnce(new Error("GCS unavailable"))
      .mockResolvedValueOnce(undefined);

    const result = await service().run(NOW);

    expect(prisma.requestAttachment.deleteMany).toHaveBeenCalledTimes(1);
    expect(prisma.requestAttachment.deleteMany).toHaveBeenCalledWith({
      where: { id: "att-1", requestId: null },
    });
    expect(result).toMatchObject({ scanned: 2, deleted: 1, failed: 1 });
    expect(logger.warn).toHaveBeenCalledWith(
      "workflow.pending-attachment-cleanup.file-remove-failed",
      { attachmentId: "att-0", error: "GCS unavailable" },
    );
  });

  it("works through full batches and skips rows that failed earlier in the run", async () => {
    const first = rows(100);
    prisma.requestAttachment.findMany
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(rows(3, 100));
    storage.remove.mockImplementation(async (ref: string) => {
      if (ref === "wf-dev/file-5.pdf") throw new Error("denied");
    });

    const result = await service().run(NOW);

    expect(prisma.requestAttachment.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.requestAttachment.findMany.mock.calls[1][0].where).toEqual({
      requestId: null,
      createdAt: { lt: CUTOFF },
      id: { notIn: ["att-5"] },
    });
    expect(result).toMatchObject({ scanned: 103, deleted: 102, failed: 1 });
  });

  it("counts a row that stopped being pending after its file was removed as skipped", async () => {
    prisma.requestAttachment.findMany.mockResolvedValueOnce(rows(1));
    prisma.requestAttachment.deleteMany.mockResolvedValueOnce({ count: 0 });

    const result = await service().run(NOW);

    expect(result).toMatchObject({ scanned: 1, deleted: 0, skipped: 1 });
    expect(logger.warn).toHaveBeenCalledWith(
      "workflow.pending-attachment-cleanup.row-changed-after-file-removed",
      { attachmentId: "att-0" },
    );
  });

  it("is a no-op when nothing is pending past the age limit", async () => {
    prisma.requestAttachment.findMany.mockResolvedValue([]);

    const result = await service().run(NOW);

    expect(storage.remove).not.toHaveBeenCalled();
    expect(prisma.requestAttachment.deleteMany).not.toHaveBeenCalled();
    expect(result).toEqual({
      scanned: 0,
      deleted: 0,
      failed: 0,
      skipped: 0,
      storageUnavailable: false,
    });
  });

  it("leaves rows and files alone when private storage isn't configured", async () => {
    mockWorkflowFileStorage.mockImplementation(() => {
      throw new PrivateStorageUnavailableError();
    });

    const result = await service().run(NOW);

    expect(prisma.requestAttachment.findMany).not.toHaveBeenCalled();
    expect(prisma.requestAttachment.deleteMany).not.toHaveBeenCalled();
    expect(result.storageUnavailable).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith(
      "workflow.pending-attachment-cleanup.storage-unavailable",
    );
  });

  it("stops linking pending uploads before cleanup can delete them", () => {
    expect(PENDING_ATTACHMENT_MAX_AGE_MS).toBe(24 * 60 * 60 * 1000);
    expect(PENDING_ATTACHMENT_LINK_WINDOW_MS).toBeLessThan(
      PENDING_ATTACHMENT_MAX_AGE_MS,
    );
  });
});

describe("handleWorkflowPendingAttachmentCleanup", () => {
  it("runs the cleanup and logs the counts through the DI logger", async () => {
    vi.clearAllMocks();
    const result = {
      scanned: 4,
      deleted: 3,
      failed: 1,
      skipped: 0,
      storageUnavailable: false,
    };
    const cleanup = { run: vi.fn().mockResolvedValue(result) };
    const services = new Map<symbol, unknown>([
      [DI_TOKENS.ILoggerService, logger],
      [DI_TOKENS.IWorkflowPendingAttachmentCleanup, cleanup],
    ]);
    mockGetContainer.mockReturnValue({
      get: (token: symbol) => services.get(token),
    });

    const job = { id: "job-1", data: { origin: "cron", createdAt: 0 } };
    await expect(
      handleWorkflowPendingAttachmentCleanup(job as never),
    ).resolves.toEqual(result);

    expect(cleanup.run).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      "workflow.pending-attachment-cleanup.completed",
      { jobId: "job-1", ...result },
    );
  });
});
