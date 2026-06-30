/**
 * Shared transaction-client type for workflow-engine repositories.
 *
 * The engine wraps every public operation in a single Prisma transaction
 * to guarantee atomicity of state transitions, audit appends, field history,
 * SLA events, and assignee snapshots. Repositories accept this `Tx` so
 * caller controls the transaction boundary.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/server";

export type Tx = Prisma.TransactionClient | PrismaClient;
