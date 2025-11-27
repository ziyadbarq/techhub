/**
 * Prisma User Repository Implementation
 */

import { injectable, inject } from "inversify";
import type { PrismaClient, User } from "@/generated/prisma/server";
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

  async listAll(): Promise<User[]> {
    return this.findAll();
  }

  async count(): Promise<number> {
    const timer = this.logger.startTimer();
    const count = await this.prisma.user.count();
    this.logger.timed("count", "Users counted", timer(), { count });
    return count;
  }

  async findByEmail(email: string): Promise<User | null> {
    const timer = this.logger.startTimer();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    this.logger.timed("findByEmail", "User fetched by email", timer(), {
      found: !!user,
    });
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const timer = this.logger.startTimer();
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    this.logger.timed("findById", "User fetched by ID", timer(), {
      found: !!user,
    });
    return user;
  }

  async createDirectly(data: {
    email: string;
    name: string;
    passwordHash: string;
    emailVerified?: boolean;
  }): Promise<User> {
    const timer = this.logger.startTimer();

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        emailVerified: data.emailVerified ? new Date() : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Better Auth stores password in a separate table
        // We'll need to create an account record as well
      },
    });

    // Create the account record for Better Auth password storage
    // IMPORTANT: Better Auth uses "oauth" type for ALL providers, including email/password
    // This is intentional design - the "type" field indicates the auth mechanism (OAuth flow),
    // while "provider" specifies the identity source ("credential" for email/password).
    // DO NOT change type to "email" or "credential" - it will break authentication!
    await this.prisma.account.create({
      data: {
        userId: user.id,
        type: "oauth", // ✅ Correct - ALL providers use "oauth" type
        provider: "credential", // ✅ Correct - "credential" for email/password auth
        providerAccountId: user.id, // Use user ID, not email
        password: data.passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    this.logger.timed("createDirectly", "User created directly", timer(), {
      userId: user.id,
      email: user.email,
    });

    return user;
  }

  async updateEmailVerification(
    userId: string,
    verified: boolean,
  ): Promise<User> {
    const timer = this.logger.startTimer();

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: verified ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    this.logger.timed(
      "updateEmailVerification",
      "Email verification status updated",
      timer(),
      {
        userId,
        verified,
      },
    );

    return user;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const timer = this.logger.startTimer();

    // Find the credential account for this user
    const account = await this.prisma.account.findFirst({
      where: {
        userId,
        provider: "credential",
      },
    });

    if (!account) {
      throw new Error(
        `No credential account found for user ${userId}. User may be using OAuth login only.`,
      );
    }

    // Update the password hash
    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        password: passwordHash,
        updatedAt: new Date(),
      },
    });

    // Invalidate all existing sessions to force re-login with new password
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    this.logger.timed(
      "updatePassword",
      "Password updated successfully",
      timer(),
      {
        userId,
        sessionsClearedCount: await this.prisma.session.count({
          where: { userId },
        }),
      },
    );
  }
}
