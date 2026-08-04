import { randomBytes } from "crypto";

import { inject, injectable } from "inversify";

import type { PrismaClient } from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import {
  ForbiddenError,
  InvalidStateError,
  NotFoundError,
  type ActionKind,
} from "@/core/domain/workflow";
import type { IWorkflowEngine } from "@/core/repositories/workflow";

const DEFAULT_TTL_HOURS = 72;

export interface MintTokenInput {
  userId: string;
  stepInstanceId: string;
  action: ActionKind;
  ttlHours?: number;
}

export interface MintTokenResult {
  token: string;
  expiresAt: Date;
}

/**
 * Email action token service interface.
 *
 * Mints and consumes single-use, expiring tokens that allow an assignee to
 * take a workflow action directly from an email link.
 */
export interface IEmailActionTokenService {
  mint(input: MintTokenInput): Promise<MintTokenResult>;
  consume(token: string, comment?: string): Promise<void>;
}

@injectable()
export class EmailActionTokensService implements IEmailActionTokenService {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly db: PrismaClient,
    @inject(DI_TOKENS.IWorkflowEngine)
    private readonly engine: IWorkflowEngine,
  ) {}

  /** Mint a single-use, expiring token for one assignee + one action on a step. */
  async mint(input: MintTokenInput): Promise<MintTokenResult> {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(
      Date.now() + (input.ttlHours ?? DEFAULT_TTL_HOURS) * 3600_000,
    );

    await this.db.emailActionToken.create({
      data: {
        token,
        userId: input.userId,
        stepInstanceId: input.stepInstanceId,
        action: input.action,
        expiresAt,
      },
    });

    return { token, expiresAt };
  }

  /**
   * Consume a token: validate, mark CONSUMED atomically, then delegate the
   * underlying action to the engine. Single-use; second call throws.
   */
  async consume(token: string, comment?: string): Promise<void> {
    const row = await this.db.emailActionToken.findUnique({ where: { token } });
    if (!row) throw new NotFoundError("EmailActionToken", token);
    if (row.status !== "ACTIVE") {
      throw new InvalidStateError(`Token is ${row.status}`);
    }
    if (row.expiresAt < new Date()) {
      await this.db.emailActionToken.update({
        where: { id: row.id },
        data: { status: "EXPIRED" },
      });
      throw new InvalidStateError("Token has expired");
    }

    // Atomic claim: if updateMany affects 0 rows, another consumer beat us.
    const claimed = await this.db.emailActionToken.updateMany({
      where: { id: row.id, status: "ACTIVE" },
      data: { status: "CONSUMED", consumedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw new InvalidStateError("Token was consumed concurrently");
    }

    try {
      await this.engine.takeAction(
        {
          stepInstanceId: row.stepInstanceId,
          action: row.action as ActionKind,
          comment,
        },
        {
          userId: row.userId,
          system: "email_action_token",
        },
      );
    } catch (error) {
      // Roll the token back to ACTIVE so the user can retry, unless it's an
      // engine-level forbidden state — in that case keep it consumed.
      if (error instanceof ForbiddenError) {
        throw error;
      }
      await this.db.emailActionToken.update({
        where: { id: row.id },
        data: { status: "REVOKED" },
      });
      throw error;
    }
  }
}
