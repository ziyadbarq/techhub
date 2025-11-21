/**
 * Prisma PromptBlock Repository Implementation
 */

import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import {
  type PromptBlockCategory,
  type PromptBlock as PrismaPromptBlock,
} from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IPromptBlockRepository } from "@/core/repositories/prompt-block.repository.interface";
import {
  PromptBlockEntity,
  type PromptBlockMetadata,
} from "@/core/domain/entities/prompt-block.entity";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaPromptBlockRepository implements IPromptBlockRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(block: PromptBlockEntity): Promise<PromptBlockEntity> {
    const created = await this.prisma.promptBlock.create({
      data: {
        name: block.name,
        category: block.category,
        content: block.content,
        description: block.description,
        metadata: toJsonValue(block.metadata), // Type-safe JSON conversion
        version: block.version,
        isActive: block.isActive,
        parentBlockId: block.parentBlockId,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<PromptBlockEntity | null> {
    const block = await this.prisma.promptBlock.findUnique({
      where: { id },
    });

    return block ? this.toDomain(block) : null;
  }

  async findByName(name: string): Promise<PromptBlockEntity | null> {
    const block = await this.prisma.promptBlock.findUnique({
      where: { name },
    });

    return block ? this.toDomain(block) : null;
  }

  async findByCategory(
    category: PromptBlockCategory,
  ): Promise<PromptBlockEntity[]> {
    const blocks = await this.prisma.promptBlock.findMany({
      where: { category, isActive: true },
      orderBy: { name: "asc" },
    });

    return blocks.map((b: PrismaPromptBlock) => this.toDomain(b));
  }

  async findAllActive(): Promise<PromptBlockEntity[]> {
    const blocks = await this.prisma.promptBlock.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return blocks.map((b: PrismaPromptBlock) => this.toDomain(b));
  }

  async findAll(): Promise<PromptBlockEntity[]> {
    const blocks = await this.prisma.promptBlock.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return blocks.map((b: PrismaPromptBlock) => this.toDomain(b));
  }

  async update(
    id: string,
    updates: Partial<PromptBlockEntity>,
  ): Promise<PromptBlockEntity> {
    const updated = await this.prisma.promptBlock.update({
      where: { id },
      data: {
        content: updates.content,
        description: updates.description,
        metadata: updates.metadata ? toJsonValue(updates.metadata) : undefined, // Type-safe JSON conversion
        version: updates.version,
        isActive: updates.isActive,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.promptBlock.delete({
      where: { id },
    });
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.promptBlock.count({
      where: { name },
    });

    return count > 0;
  }

  async count(): Promise<number> {
    return this.prisma.promptBlock.count();
  }

  /**
   * Map Prisma model to domain entity
   */
  private toDomain(prismaBlock: PrismaPromptBlock): PromptBlockEntity {
    return new PromptBlockEntity(
      prismaBlock.id,
      prismaBlock.name,
      prismaBlock.category,
      prismaBlock.content,
      prismaBlock.description,
      fromJsonValue<PromptBlockMetadata>(prismaBlock.metadata), // Type-safe JSON conversion
      prismaBlock.version,
      prismaBlock.isActive,
      prismaBlock.createdAt,
      prismaBlock.updatedAt,
      prismaBlock.parentBlockId,
    );
  }
}
