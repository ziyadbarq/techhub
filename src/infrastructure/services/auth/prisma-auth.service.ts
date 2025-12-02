import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/client";
import { prisma as basePrisma } from "@/infrastructure/database/prisma/client";
import type { ILoggerService } from "@/core/services/logger.service.interface";

/**
 * Provides the Prisma client instance for Better Auth with encryption extensions applied.
 */
@injectable()
export class PrismaAuthService {
  public readonly prisma: PrismaClient;

  constructor(
    @inject(DI_TOKENS.ILoggerService)
    logger: ILoggerService,
  ) {
    logger.debug?.("Initializing PrismaAuthService");
    this.prisma = basePrisma as unknown as PrismaClient;
  }
}
