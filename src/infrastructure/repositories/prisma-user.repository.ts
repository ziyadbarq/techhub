/**
 * Prisma User Repository Implementation
 */

import { injectable, inject } from "inversify";
import type { PrismaClient, User } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IUserRepository } from "@/core/repositories/user-repository.interface";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaUserRepository implements IUserRepository {
  private readonly logger = createRepositoryLogger("UserRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient) private readonly prisma: PrismaClient,
  ) {}

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "email" | "name" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<User[]> {
    const timer = this.logger.startTimer();

    const users = await this.prisma.user.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy
        ? { [options.orderBy]: options.order ?? "asc" }
        : { email: "asc" },
    });

    this.logger.timed("findAll", "Users fetched", timer(), {
      count: users.length,
    });

    return users;
  }
}
