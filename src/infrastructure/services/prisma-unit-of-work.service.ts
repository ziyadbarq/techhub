/**
 * Prisma Unit of Work
 *
 * IUnitOfWork implementation backed by Prisma interactive transactions with
 * AsyncLocalStorage propagation (see transaction-context.ts). Repositories
 * resolve the ambient transaction client automatically, so no transaction
 * handle needs to be passed around.
 */

import { injectable } from "inversify";
import type { IUnitOfWork } from "@/core/services/unit-of-work.service.interface";
import { runInTransaction } from "@/infrastructure/database/prisma/transaction-context";

@injectable()
export class PrismaUnitOfWork implements IUnitOfWork {
  execute<T>(work: () => Promise<T>): Promise<T> {
    return runInTransaction(work);
  }
}
