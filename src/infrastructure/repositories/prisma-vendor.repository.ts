/**
 * Prisma Vendor Repository Implementation
 */

import { inject, injectable } from "inversify";
import type { PrismaClient, $Enums } from "@/generated/prisma/server";
import type { Vendor as PrismaVendor } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { Vendor } from "@/core/domain/entities/vendor.entity";
import type { IVendorRepository } from "@/core/repositories/vendor.repository.interface";
import type { VendorType } from "@/core/domain/value-objects/foundation-enums";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaVendorRepository implements IVendorRepository {
  private readonly logger = createRepositoryLogger("VendorRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(vendor: Vendor): Promise<Vendor> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.vendor.create({
        data: {
          code: vendor.code,
          name: vendor.name,
          legalName: vendor.legalName,
          description: vendor.description,
          vendorType: vendor.vendorType as $Enums.VendorType,
          website: vendor.website,
          email: vendor.email,
          phone: vendor.phone,
          address: vendor.address,
          city: vendor.city,
          state: vendor.state,
          country: vendor.country,
          postalCode: vendor.postalCode,
          taxId: vendor.taxId,
          paymentTerms: vendor.paymentTerms,
          isPreferred: vendor.isPreferred,
          isActive: vendor.isActive,
          tags: vendor.tags,
          note: vendor.note,
          metadata: toJsonValue(vendor.metadata),
        },
      });

      this.logger.timed("create", "Vendor created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create vendor", error);
      throw error;
    }
  }

  async findById(id: string): Promise<Vendor | null> {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
    });

    return vendor ? this.toDomain(vendor) : null;
  }

  async findByName(name: string): Promise<Vendor | null> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    return vendor ? this.toDomain(vendor) : null;
  }

  async findByCode(code: string): Promise<Vendor | null> {
    const vendor = await this.prisma.vendor.findUnique({
      where: { code: code.toUpperCase() },
    });

    return vendor ? this.toDomain(vendor) : null;
  }

  async findByCodes(codes: string[]): Promise<Vendor[]> {
    if (codes.length === 0) return [];

    const timer = this.logger.startTimer();

    try {
      // Filter out empty/null values and normalize to uppercase
      const validCodes = codes
        .filter((c) => c !== null && c !== undefined && c.trim() !== "")
        .map((c) => c.toUpperCase().trim());

      if (validCodes.length === 0) return [];

      const vendors = await this.prisma.vendor.findMany({
        where: { code: { in: validCodes } },
      });

      this.logger.timed("findByCodes", "Vendors fetched by codes", timer(), {
        requestedCount: validCodes.length,
        foundCount: vendors.length,
      });

      return vendors.map((v: PrismaVendor) => this.toDomain(v));
    } catch (error) {
      this.logger.error(
        "findByCodes",
        "Failed to fetch vendors by codes",
        error,
      );
      throw error;
    }
  }

  async findByEmail(email: string): Promise<Vendor | null> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    return vendor ? this.toDomain(vendor) : null;
  }

  async findPreferred(): Promise<Vendor[]> {
    const vendors = await this.prisma.vendor.findMany({
      where: { isPreferred: true },
      orderBy: { name: "asc" },
    });

    return vendors.map((v: PrismaVendor) => this.toDomain(v));
  }

  async findActive(isActive: boolean): Promise<Vendor[]> {
    const vendors = await this.prisma.vendor.findMany({
      where: { isActive },
      orderBy: { name: "asc" },
    });

    return vendors.map((v: PrismaVendor) => this.toDomain(v));
  }

  async findByCountry(country: string): Promise<Vendor[]> {
    const vendors = await this.prisma.vendor.findMany({
      where: { country: { equals: country, mode: "insensitive" } },
      orderBy: { name: "asc" },
    });

    return vendors.map((v: PrismaVendor) => this.toDomain(v));
  }

  async findByTag(tag: string): Promise<Vendor[]> {
    const vendors = await this.prisma.vendor.findMany({
      where: {
        tags: {
          has: tag,
        },
      },
      orderBy: { name: "asc" },
    });

    return vendors.map((v: PrismaVendor) => this.toDomain(v));
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<Vendor[]> {
    const vendors = await this.prisma.vendor.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy
        ? { [options.orderBy]: options.order ?? "asc" }
        : { createdAt: "desc" },
    });

    return vendors.map((v: PrismaVendor) => this.toDomain(v));
  }

  async search(
    query: string,
    options?: { skip?: number; take?: number },
  ): Promise<Vendor[]> {
    const vendors = await this.prisma.vendor.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
    });

    return vendors.map((v: PrismaVendor) => this.toDomain(v));
  }

  async count(): Promise<number> {
    return await this.prisma.vendor.count();
  }

  async update(vendor: Vendor): Promise<Vendor> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          name: vendor.name,
          code: vendor.code,
          legalName: vendor.legalName,
          description: vendor.description,
          vendorType: vendor.vendorType as $Enums.VendorType,
          website: vendor.website,
          email: vendor.email,
          phone: vendor.phone,
          address: vendor.address,
          city: vendor.city,
          state: vendor.state,
          country: vendor.country,
          postalCode: vendor.postalCode,
          taxId: vendor.taxId,
          paymentTerms: vendor.paymentTerms,
          isPreferred: vendor.isPreferred,
          isActive: vendor.isActive,
          tags: vendor.tags,
          note: vendor.note,
          metadata: toJsonValue(vendor.metadata),
          updatedAt: vendor.updatedAt,
        },
      });

      this.logger.timed("update", "Vendor updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update vendor", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.vendor.delete({
        where: { id },
      });

      this.logger.timed("delete", "Vendor deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete vendor", error);
      throw error;
    }
  }

  async hasContacts(id: string): Promise<boolean> {
    const count = await this.prisma.vendorContact.count({
      where: { vendorId: id },
    });

    return count > 0;
  }

  async hasConfigurationItems(_id: string): Promise<boolean> {
    // TODO: Implement check when ConfigurationItem model has vendorId field
    // ConfigurationItem schema doesn't currently have vendorId field
    return false;
  }

  async hasAssets(id: string): Promise<boolean> {
    const count = await this.prisma.asset.count({
      where: { vendorId: id },
    });

    return count > 0;
  }

  async hasContracts(id: string): Promise<boolean> {
    const count = await this.prisma.contract.count({
      where: { vendorId: id },
    });
    return count > 0;
  }

  async hasLicenseProducts(id: string): Promise<boolean> {
    const count = await this.prisma.licenseProduct.count({
      where: { vendorId: id },
    });
    return count > 0;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const vendor = await this.prisma.vendor.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        ...(excludeId && { NOT: { id: excludeId } }),
      },
      select: { id: true },
    });
    return !!vendor;
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const vendor = await this.prisma.vendor.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        ...(excludeId && { NOT: { id: excludeId } }),
      },
      select: { id: true },
    });
    return !!vendor;
  }

  private toDomain(prismaVendor: PrismaVendor): Vendor {
    return Vendor.reconstitute({
      id: prismaVendor.id,
      name: prismaVendor.name,
      code: prismaVendor.code,
      legalName: prismaVendor.legalName,
      description: prismaVendor.description,
      vendorType: prismaVendor.vendorType as VendorType,
      taxId: prismaVendor.taxId,
      website: prismaVendor.website,
      email: prismaVendor.email,
      phone: prismaVendor.phone,
      address: prismaVendor.address,
      city: prismaVendor.city,
      state: prismaVendor.state,
      country: prismaVendor.country,
      postalCode: prismaVendor.postalCode,
      paymentTerms: prismaVendor.paymentTerms,
      isPreferred: prismaVendor.isPreferred,
      isActive: prismaVendor.isActive,
      tags: prismaVendor.tags,
      note: prismaVendor.note,
      metadata: fromJsonValue<Record<string, unknown>>(prismaVendor.metadata),
      createdAt: prismaVendor.createdAt,
      updatedAt: prismaVendor.updatedAt,
    });
  }
}
