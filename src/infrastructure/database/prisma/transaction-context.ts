/**
 * Transaction Context
 *
 * AsyncLocalStorage-based transaction propagation. `runInTransaction` opens a
 * Prisma interactive transaction and stores the transaction client in ALS for
 * the duration of the callback. The `transactionAwarePrisma` proxy (bound as
 * DI_TOKENS.PrismaClient) resolves to the ambient transaction client when one
 * is active and to the singleton client otherwise, so every repository
 * automatically participates in the caller's transaction without any
 * repository-level changes.
 *
 * Nested `runInTransaction` calls join the ambient transaction instead of
 * opening a new one, so use cases can compose freely.
 */

import { AsyncLocalStorage } from "async_hooks";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { prisma } from "./client";

const transactionStorage = new AsyncLocalStorage<Prisma.TransactionClient>();

export interface RunInTransactionOptions {
  /** Max time to wait for a connection from the pool (ms). Default 5000. */
  maxWait?: number;
  /** Max time the transaction may run before rollback (ms). Default 15000. */
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

/**
 * Returns the ambient transaction client when inside `runInTransaction`,
 * otherwise the singleton Prisma client.
 */
export function getTransactionAwareClient():
  | Prisma.TransactionClient
  | PrismaClient {
  return transactionStorage.getStore() ?? prisma;
}

/** True when the current async context is inside a transaction. */
export function isInTransaction(): boolean {
  return transactionStorage.getStore() !== undefined;
}

/**
 * Runs `work` inside a database transaction. All repository calls made
 * (directly or transitively) within `work` share the same transaction via
 * the ALS-backed client proxy. If a transaction is already active in this
 * async context, `work` joins it rather than opening a nested one.
 */
export async function runInTransaction<T>(
  work: () => Promise<T>,
  options?: RunInTransactionOptions,
): Promise<T> {
  if (transactionStorage.getStore()) {
    return work();
  }

  return prisma.$transaction((tx) => transactionStorage.run(tx, work), {
    maxWait: options?.maxWait ?? 5000,
    timeout: options?.timeout ?? 15000,
    ...(options?.isolationLevel
      ? { isolationLevel: options.isolationLevel }
      : {}),
  });
}

/**
 * Drop-in replacement for the singleton PrismaClient that transparently
 * routes every call to the ambient transaction client when one is active.
 * Client-lifecycle members that do not exist on a transaction client
 * ($connect, $disconnect, $on, $transaction, ...) always resolve against the
 * root client.
 */
export const transactionAwarePrisma: PrismaClient = new Proxy(prisma, {
  get(_target, prop, _receiver) {
    const ambient = transactionStorage.getStore();
    const source = ambient && prop in ambient ? ambient : prisma;
    const value = Reflect.get(source, prop, source);
    return typeof value === "function" ? value.bind(source) : value;
  },
}) as PrismaClient;
