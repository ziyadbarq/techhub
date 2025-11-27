/**
 * Asset Kit Factory
 *
 * Type-safe factory for generating AssetKit test data
 */

import type { Prisma, PrismaClient } from "@/generated/prisma/server";

export interface AssetKitFactoryOptions {
  name: string;
  code: string;
  description: string;
  kitType:
    | "NEW_HIRE"
    | "CONTRACTOR"
    | "EXECUTIVE"
    | "PROJECT"
    | "TEMPORARY"
    | "OTHER";
  isActive?: boolean;
  metadata?: Prisma.InputJsonValue;
}

export class AssetKitFactory {
  private options: AssetKitFactoryOptions;

  constructor(options: AssetKitFactoryOptions) {
    this.options = options;
  }

  build(): Prisma.AssetKitCreateInput {
    const data = {
      name: this.options.name,
      code: this.options.code,
      description: this.options.description,
      kitType: this.options.kitType,
      isActive: this.options.isActive ?? true,
      metadata: this.options.metadata,
    } satisfies Prisma.AssetKitCreateInput;

    return data;
  }

  async create(prisma: PrismaClient) {
    return prisma.assetKit.create({
      data: this.build(),
    });
  }

  /**
   * Create kit with predefined items
   */
  static async createWithItems(
    prisma: PrismaClient,
    kitOptions: AssetKitFactoryOptions,
    items: Array<{
      assetCategoryId?: string;
      assetModelId?: string;
      quantity: number;
      isRequired?: boolean;
      note?: string;
    }>,
  ) {
    const kit = await new AssetKitFactory(kitOptions).create(prisma);

    for (const item of items) {
      await prisma.assetKitItem.create({
        data: {
          assetKitId: kit.id,
          assetCategoryId: item.assetCategoryId,
          assetModelId: item.assetModelId,
          quantity: item.quantity,
          isRequired: item.isRequired ?? true,
          note: item.note,
        },
      });
    }

    return kit;
  }
}
