/**
 * Prisma PromptComposition Repository Implementation
 */

import { injectable, inject } from "inversify";
import type { PrismaClient, PromptPurpose } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IPromptCompositionRepository } from "@/core/repositories/prompt-composition.repository.interface";
import {
  PromptCompositionEntity,
  type CompositionBlock,
} from "@/core/domain/entities/prompt-composition.entity";
import {
  PromptBlockEntity,
  type PromptBlockMetadata,
} from "@/core/domain/entities/prompt-block.entity";
import {
  toJsonValue,
  fromJsonValue,
  type PrismaCompositionWithBlocks,
  type PrismaCompositionBlockWithBlock,
  type PrismaPromptBlock,
} from "./prisma-helpers";

@injectable()
export class PrismaPromptCompositionRepository
  implements IPromptCompositionRepository
{
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(
    composition: PromptCompositionEntity,
  ): Promise<PromptCompositionEntity> {
    const created: PrismaCompositionWithBlocks =
      await this.prisma.promptComposition.create({
        data: {
          name: composition.name,
          purpose: composition.purpose,
          description: composition.description,
          variables: toJsonValue(composition.variables), // Type-safe JSON conversion
          version: composition.version,
          isActive: composition.isActive,
        },
        include: {
          blocks: {
            include: { block: true },
            orderBy: { order: "asc" },
          },
        },
      });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<PromptCompositionEntity | null> {
    const composition = await this.prisma.promptComposition.findUnique({
      where: { id },
      include: {
        blocks: {
          include: { block: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return composition ? this.toDomain(composition) : null;
  }

  async findByName(name: string): Promise<PromptCompositionEntity | null> {
    const composition = await this.prisma.promptComposition.findUnique({
      where: { name },
      include: {
        blocks: {
          include: { block: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return composition ? this.toDomain(composition) : null;
  }

  async findActiveByPurpose(
    purpose: PromptPurpose,
  ): Promise<PromptCompositionEntity | null> {
    const composition = await this.prisma.promptComposition.findFirst({
      where: { purpose, isActive: true },
      include: {
        blocks: {
          include: { block: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return composition ? this.toDomain(composition) : null;
  }

  async findByPurpose(
    purpose: PromptPurpose,
  ): Promise<PromptCompositionEntity[]> {
    const compositions = await this.prisma.promptComposition.findMany({
      where: { purpose },
      include: {
        blocks: {
          include: { block: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { version: "desc" },
    });

    // Type-safe mapping with explicit type annotation
    return compositions.map((c: PrismaCompositionWithBlocks) =>
      this.toDomain(c),
    );
  }

  async findAllActive(): Promise<PromptCompositionEntity[]> {
    const compositions = await this.prisma.promptComposition.findMany({
      where: { isActive: true },
      include: {
        blocks: {
          include: { block: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    // Type-safe mapping with explicit type annotation
    return compositions.map((c: PrismaCompositionWithBlocks) =>
      this.toDomain(c),
    );
  }

  async findAll(): Promise<PromptCompositionEntity[]> {
    const compositions = await this.prisma.promptComposition.findMany({
      include: {
        blocks: {
          include: { block: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    // Type-safe mapping with explicit type annotation
    return compositions.map((c: PrismaCompositionWithBlocks) =>
      this.toDomain(c),
    );
  }

  async update(
    id: string,
    updates: Partial<PromptCompositionEntity>,
  ): Promise<PromptCompositionEntity> {
    const updated: PrismaCompositionWithBlocks =
      await this.prisma.promptComposition.update({
        where: { id },
        data: {
          description: updates.description,
          variables: toJsonValue(updates.variables), // Type-safe JSON conversion
          version: updates.version,
          isActive: updates.isActive,
        },
        include: {
          blocks: {
            include: { block: true },
            orderBy: { order: "asc" },
          },
        },
      });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.promptComposition.delete({
      where: { id },
    });
  }

  async getBlocksForComposition(
    compositionId: string,
  ): Promise<PromptBlockEntity[]> {
    const compositionBlocks = await this.prisma.promptCompositionBlock.findMany(
      {
        where: { compositionId },
        include: { block: true },
        orderBy: { order: "asc" },
      },
    );

    // Type-safe mapping with explicit type annotation
    return compositionBlocks.map((cb: PrismaCompositionBlockWithBlock) =>
      this.blockToDomain(cb.block),
    );
  }

  async addBlockToComposition(
    compositionId: string,
    blockId: string,
    order: number,
    overrides?: Record<string, string>,
  ): Promise<void> {
    await this.prisma.promptCompositionBlock.create({
      data: {
        compositionId,
        blockId,
        order,
        overrides: toJsonValue(overrides), // Type-safe JSON conversion
      },
    });
  }

  async removeBlockFromComposition(
    compositionId: string,
    blockId: string,
  ): Promise<void> {
    await this.prisma.promptCompositionBlock.deleteMany({
      where: {
        compositionId,
        blockId,
      },
    });
  }

  async reorderBlocks(
    compositionId: string,
    blockOrder: Array<{ blockId: string; order: number }>,
  ): Promise<void> {
    await this.prisma.$transaction(
      blockOrder.map(({ blockId, order }) =>
        this.prisma.promptCompositionBlock.updateMany({
          where: { compositionId, blockId },
          data: { order },
        }),
      ),
    );
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.promptComposition.count({
      where: { name },
    });

    return count > 0;
  }

  async count(): Promise<number> {
    return this.prisma.promptComposition.count();
  }

  /**
   * Map Prisma model to domain entity
   */
  private toDomain(
    prismaComposition: PrismaCompositionWithBlocks,
  ): PromptCompositionEntity {
    const blocks: CompositionBlock[] = (prismaComposition.blocks || []).map(
      (cb: PrismaCompositionWithBlocks["blocks"][number]) => {
        const overrides = fromJsonValue<Record<string, string>>(cb.overrides);
        return {
          blockId: cb.blockId,
          blockName: cb.block.name,
          order: cb.order,
          // Convert null to undefined for optional field
          ...(overrides !== null && { overrides }),
        };
      },
    );

    return new PromptCompositionEntity(
      prismaComposition.id,
      prismaComposition.name,
      prismaComposition.purpose,
      prismaComposition.description,
      fromJsonValue<Record<string, string>>(prismaComposition.variables),
      prismaComposition.version,
      prismaComposition.isActive,
      prismaComposition.createdAt,
      prismaComposition.updatedAt,
      blocks,
    );
  }

  /**
   * Map Prisma PromptBlock to domain entity
   */
  private blockToDomain(prismaBlock: PrismaPromptBlock): PromptBlockEntity {
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
