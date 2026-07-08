/**
 * Transaction Context - Unit Tests
 *
 * Verifies ALS propagation: the transaction-aware proxy resolves to the
 * ambient transaction client inside runInTransaction and to the singleton
 * outside it, nested calls join the outer transaction, and client-lifecycle
 * members always resolve against the root client.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockTxClient, mockRootClient } = vi.hoisted(() => {
  const txClient = {
    task: { findMany: vi.fn().mockResolvedValue(["from-tx"]) },
    $queryRaw: vi.fn().mockResolvedValue(["tx-raw"]),
  };
  const rootClient = {
    task: { findMany: vi.fn().mockResolvedValue(["from-root"]) },
    $queryRaw: vi.fn().mockResolvedValue(["root-raw"]),
    $connect: vi.fn(),
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(txClient),
    ),
  };
  return { mockTxClient: txClient, mockRootClient: rootClient };
});

vi.mock("@/infrastructure/database/prisma/client", () => ({
  prisma: mockRootClient,
}));

import {
  runInTransaction,
  transactionAwarePrisma,
  isInTransaction,
  getTransactionAwareClient,
} from "../transaction-context";

describe("transaction-context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves to the root client outside a transaction", async () => {
    expect(isInTransaction()).toBe(false);
    const result = await transactionAwarePrisma.task.findMany();
    expect(result).toEqual(["from-root"]);
    expect(mockRootClient.task.findMany).toHaveBeenCalled();
    expect(mockTxClient.task.findMany).not.toHaveBeenCalled();
  });

  it("resolves to the transaction client inside runInTransaction", async () => {
    const result = await runInTransaction(async () => {
      expect(isInTransaction()).toBe(true);
      return transactionAwarePrisma.task.findMany();
    });
    expect(result).toEqual(["from-tx"]);
    expect(mockTxClient.task.findMany).toHaveBeenCalled();
    expect(mockRootClient.task.findMany).not.toHaveBeenCalled();
  });

  it("joins the ambient transaction on nested runInTransaction calls", async () => {
    await runInTransaction(async () => {
      await runInTransaction(async () => {
        expect(isInTransaction()).toBe(true);
      });
    });
    // Only the outer call opens a transaction
    expect(mockRootClient.$transaction).toHaveBeenCalledTimes(1);
  });

  it("restores the root client after the transaction completes", async () => {
    await runInTransaction(async () => {
      await transactionAwarePrisma.task.findMany();
    });
    expect(isInTransaction()).toBe(false);
    const result = await transactionAwarePrisma.task.findMany();
    expect(result).toEqual(["from-root"]);
  });

  it("routes members missing on the transaction client to the root client", async () => {
    await runInTransaction(async () => {
      // $connect exists only on the root client
      const proxied = transactionAwarePrisma as unknown as {
        $connect: () => void;
      };
      proxied.$connect();
    });
    expect(mockRootClient.$connect).toHaveBeenCalled();
  });

  it("propagates errors and does not leak the transaction context", async () => {
    await expect(
      runInTransaction(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(isInTransaction()).toBe(false);
  });

  it("getTransactionAwareClient returns the ambient client inside a transaction", async () => {
    expect(getTransactionAwareClient()).toBe(mockRootClient);
    await runInTransaction(async () => {
      expect(getTransactionAwareClient()).toBe(mockTxClient);
    });
  });
});
