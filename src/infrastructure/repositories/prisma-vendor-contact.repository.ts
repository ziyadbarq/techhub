/**
 * Prisma Vendor Contact Repository Implementation
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import type { VendorContact as PrismaVendorContact } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { VendorContact } from "@/core/domain/entities/vendor-contact.entity";
import type { IVendorContactRepository } from "@/core/repositories/vendor-contact.repository.interface";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaVendorContactRepository implements IVendorContactRepository {
  private readonly logger = createRepositoryLogger("VendorContactRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(vendorContact: VendorContact): Promise<VendorContact> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.vendorContact.create({
        data: {
          vendorId: vendorContact.vendorId,
          firstName: vendorContact.firstName,
          lastName: vendorContact.lastName,
          title: vendorContact.title,
          email: vendorContact.email,
          phone: vendorContact.phone,
          mobile: vendorContact.mobile,
          role: vendorContact.role,
          isPrimary: vendorContact.isPrimary,
          isActive: vendorContact.isActive,
          note: vendorContact.note,
          metadata: toJsonValue(vendorContact.metadata),
        },
      });

      this.logger.timed("create", "Vendor contact created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create vendor contact", error);
      throw error;
    }
  }

  async findById(id: string): Promise<VendorContact | null> {
    const vendorContact = await this.prisma.vendorContact.findUnique({
      where: { id },
    });

    return vendorContact ? this.toDomain(vendorContact) : null;
  }

  async findByVendorId(
    vendorId: string,
    options?: { activeOnly?: boolean },
  ): Promise<VendorContact[]> {
    const vendorContacts = await this.prisma.vendorContact.findMany({
      where: {
        vendorId,
        ...(options?.activeOnly && { isActive: true }),
      },
      orderBy: [{ isPrimary: "desc" }, { lastName: "asc" }],
    });

    return vendorContacts.map((vc: PrismaVendorContact) => this.toDomain(vc));
  }

  async findByEmail(email: string): Promise<VendorContact[]> {
    const vendorContacts = await this.prisma.vendorContact.findMany({
      where: { email: { equals: email, mode: "insensitive" } },
      orderBy: { lastName: "asc" },
    });
    return vendorContacts.map((vc: PrismaVendorContact) => this.toDomain(vc));
  }

  async findByRole(vendorId: string, role: string): Promise<VendorContact[]> {
    const vendorContacts = await this.prisma.vendorContact.findMany({
      where: {
        vendorId,
        role: { equals: role, mode: "insensitive" },
      },
      orderBy: { lastName: "asc" },
    });
    return vendorContacts.map((vc: PrismaVendorContact) => this.toDomain(vc));
  }

  async findPrimaryContacts(): Promise<VendorContact[]> {
    const vendorContacts = await this.prisma.vendorContact.findMany({
      where: { isPrimary: true },
      orderBy: { lastName: "asc" },
    });

    return vendorContacts.map((vc: PrismaVendorContact) => this.toDomain(vc));
  }

  async findActive(isActive: boolean): Promise<VendorContact[]> {
    const vendorContacts = await this.prisma.vendorContact.findMany({
      where: { isActive },
      orderBy: { lastName: "asc" },
    });

    return vendorContacts.map((vc: PrismaVendorContact) => this.toDomain(vc));
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "fullName" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<VendorContact[]> {
    const vendorContacts = await this.prisma.vendorContact.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy:
        options?.orderBy === "fullName"
          ? [
              { lastName: options.order ?? "asc" },
              { firstName: options.order ?? "asc" },
            ]
          : options?.orderBy
            ? { [options.orderBy]: options.order ?? "asc" }
            : { createdAt: "desc" },
    });

    return vendorContacts.map((vc: PrismaVendorContact) => this.toDomain(vc));
  }

  async search(vendorId: string, query: string): Promise<VendorContact[]> {
    const vendorContacts = await this.prisma.vendorContact.findMany({
      where: {
        vendorId,
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { title: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { lastName: "asc" },
    });

    return vendorContacts.map((vc: PrismaVendorContact) => this.toDomain(vc));
  }

  async count(): Promise<number> {
    return await this.prisma.vendorContact.count();
  }

  async countByVendorId(vendorId: string): Promise<number> {
    return await this.prisma.vendorContact.count({
      where: { vendorId },
    });
  }

  async update(vendorContact: VendorContact): Promise<VendorContact> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.vendorContact.update({
        where: { id: vendorContact.id },
        data: {
          firstName: vendorContact.firstName,
          lastName: vendorContact.lastName,
          title: vendorContact.title,
          email: vendorContact.email,
          phone: vendorContact.phone,
          mobile: vendorContact.mobile,
          role: vendorContact.role,
          isPrimary: vendorContact.isPrimary,
          isActive: vendorContact.isActive,
          note: vendorContact.note,
          metadata: toJsonValue(vendorContact.metadata),
          updatedAt: vendorContact.updatedAt,
        },
      });

      this.logger.timed("update", "Vendor contact updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update vendor contact", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.vendorContact.delete({
        where: { id },
      });

      this.logger.timed("delete", "Vendor contact deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete vendor contact", error);
      throw error;
    }
  }

  async deleteByVendorId(vendorId: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.vendorContact.deleteMany({
        where: { vendorId },
      });

      this.logger.timed(
        "deleteByVendorId",
        "Vendor contacts deleted by vendor",
        timer(),
        { vendorId },
      );
    } catch (error) {
      this.logger.error(
        "deleteByVendorId",
        "Failed to delete vendor contacts",
        error,
      );
      throw error;
    }
  }

  private toDomain(prismaVendorContact: PrismaVendorContact): VendorContact {
    return VendorContact.reconstitute({
      id: prismaVendorContact.id,
      vendorId: prismaVendorContact.vendorId,
      firstName: prismaVendorContact.firstName,
      lastName: prismaVendorContact.lastName,
      middleName: null, // middleName not in Prisma schema
      title: prismaVendorContact.title,
      email: prismaVendorContact.email,
      phone: prismaVendorContact.phone,
      mobile: prismaVendorContact.mobile,
      role: prismaVendorContact.role,
      isPrimary: prismaVendorContact.isPrimary,
      isActive: prismaVendorContact.isActive,
      note: prismaVendorContact.note,
      metadata: fromJsonValue<Record<string, unknown>>(
        prismaVendorContact.metadata,
      ),
      createdAt: prismaVendorContact.createdAt,
      updatedAt: prismaVendorContact.updatedAt,
    });
  }
}
