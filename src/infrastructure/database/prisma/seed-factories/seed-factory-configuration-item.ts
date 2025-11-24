/**
 * Configuration Item Factory
 *
 * Type-safe factory for generating ConfigurationItem test data
 */

import type { Prisma, PrismaClient } from "@/generated/prisma";
import { optionalConnect, requireConnect } from "../seed-utils.js";

export interface ConfigurationItemFactoryOptions {
  name: string;
  ciClassId: string;
  lifecycleStateId?: string;
  criticality?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  environment?: "PROD" | "UAT" | "DEV" | "DR" | "TEST" | "OTHER";
  primaryOwnerPersonId?: string;
  primaryOwnerOrgUnitId?: string;
  locationId?: string;
  linkedAssetId?: string;
  ciKey?: string;
  description?: string;
  attributes?: Prisma.InputJsonValue;
}

export class ConfigurationItemFactory {
  private options: ConfigurationItemFactoryOptions;

  constructor(options: ConfigurationItemFactoryOptions) {
    this.options = options;
  }

  build(): Prisma.ConfigurationItemCreateInput {
    const data = {
      name: this.options.name,
      ...requireConnect(this.options.ciClassId, "ciClass"),
      ...optionalConnect(this.options.lifecycleStateId, "lifecycleState"),
      criticality: this.options.criticality,
      environment: this.options.environment,
      ...optionalConnect(
        this.options.primaryOwnerPersonId,
        "primaryOwnerPerson",
      ),
      ...optionalConnect(
        this.options.primaryOwnerOrgUnitId,
        "primaryOwnerOrgUnit",
      ),
      ...optionalConnect(this.options.locationId, "location"),
      ...optionalConnect(this.options.linkedAssetId, "linkedAsset"),
      ciKey: this.options.ciKey,
      description: this.options.description,
      attributes: this.options.attributes,
    } satisfies Prisma.ConfigurationItemCreateInput;

    return data;
  }

  async create(prisma: PrismaClient) {
    return prisma.configurationItem.create({
      data: this.build(),
    });
  }
}
