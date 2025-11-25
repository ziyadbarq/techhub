/**
 * Prisma Person Repository Implementation
 */

import { inject, injectable } from "inversify";
import { Prisma } from "@/generated/prisma";
import type { PrismaClient } from "@/generated/prisma";
import type { Person as PrismaPerson } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { Person } from "@/core/domain/entities/person.entity";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaPersonRepository implements IPersonRepository {
  private readonly logger = createRepositoryLogger("PersonRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(person: Person): Promise<Person> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.person.create({
        data: {
          azureAdId: person.azureAdId,
          firstName: person.firstName,
          lastName: person.lastName,
          middleName: person.middleName,
          email: person.email,
          employeeId: person.employeeId,
          orgUnitId: person.orgUnitId,
          primaryRoleId: person.primaryRoleId,
          managerId: person.managerId,
          title: person.title,
          office: person.office,
          phone: person.phone,
          mobile: person.mobile,
          locationId: person.locationId,
          department: person.department,
          hireDate: person.hireDate,
          terminationDate: person.terminationDate,
          isActive: person.isActive,
          userId: person.userId,
          metadata:
            (person.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        },
      });

      this.logger.timed("create", "Person created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create person", error);
      throw error;
    }
  }

  async findById(id: string): Promise<Person | null> {
    const person = await this.prisma.person.findUnique({
      where: { id },
    });

    return person ? this.toDomain(person) : null;
  }

  async findByAzureAdId(azureAdId: string): Promise<Person | null> {
    const person = await this.prisma.person.findUnique({
      where: { azureAdId },
    });

    return person ? this.toDomain(person) : null;
  }

  async findAllWithAzureAdId(): Promise<Person[]> {
    const persons = await this.prisma.person.findMany({
      where: { azureAdId: { not: null } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return persons.map((p: PrismaPerson) => this.toDomain(p));
  }

  async findAllWithoutAzureAdId(): Promise<Person[]> {
    const persons = await this.prisma.person.findMany({
      where: { azureAdId: null },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return persons.map((p: PrismaPerson) => this.toDomain(p));
  }

  async findByEmail(email: string): Promise<Person | null> {
    const person = await this.prisma.person.findUnique({
      where: { email },
    });

    return person ? this.toDomain(person) : null;
  }

  async findByEmployeeId(employeeId: string): Promise<Person | null> {
    const person = await this.prisma.person.findUnique({
      where: { employeeId },
    });

    return person ? this.toDomain(person) : null;
  }

  async findByUserId(userId: string): Promise<Person | null> {
    const person = await this.prisma.person.findUnique({
      where: { userId },
    });

    return person ? this.toDomain(person) : null;
  }

  async findByOrgUnitId(
    orgUnitId: string,
    options?: { activeOnly?: boolean },
  ): Promise<Person[]> {
    const persons = await this.prisma.person.findMany({
      where: {
        orgUnitId,
        ...(options?.activeOnly && { isActive: true }),
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return persons.map((p: PrismaPerson) => this.toDomain(p));
  }

  async findByPrimaryRoleId(roleId: string): Promise<Person[]> {
    const persons = await this.prisma.person.findMany({
      where: { primaryRoleId: roleId },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return persons.map((p: PrismaPerson) => this.toDomain(p));
  }

  async findActive(options?: {
    skip?: number;
    take?: number;
  }): Promise<Person[]> {
    const persons = await this.prisma.person.findMany({
      where: { isActive: true },
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return persons.map((p: PrismaPerson) => this.toDomain(p));
  }

  async findInactive(options?: {
    skip?: number;
    take?: number;
  }): Promise<Person[]> {
    const persons = await this.prisma.person.findMany({
      where: { isActive: false },
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return persons.map((p: PrismaPerson) => this.toDomain(p));
  }

  async findLinkedToUsers(): Promise<Person[]> {
    const persons = await this.prisma.person.findMany({
      where: { userId: { not: null } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return persons.map((p: PrismaPerson) => this.toDomain(p));
  }

  async findNotLinkedToUsers(): Promise<Person[]> {
    const persons = await this.prisma.person.findMany({
      where: { userId: null },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return persons.map((p: PrismaPerson) => this.toDomain(p));
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "fullName" | "email" | "employeeId" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<Person[]> {
    const persons = await this.prisma.person.findMany({
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

    return persons.map((p: PrismaPerson) => this.toDomain(p));
  }

  async search(
    query: string,
    options?: { skip?: number; take?: number; activeOnly?: boolean },
  ): Promise<Person[]> {
    const persons = await this.prisma.person.findMany({
      where: {
        ...(options?.activeOnly && { isActive: true }),
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { middleName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { employeeId: { contains: query, mode: "insensitive" } },
          { title: { contains: query, mode: "insensitive" } },
        ],
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return persons.map((p: PrismaPerson) => this.toDomain(p));
  }

  async count(): Promise<number> {
    return await this.prisma.person.count();
  }

  async countByOrgUnitId(orgUnitId: string): Promise<number> {
    return await this.prisma.person.count({
      where: { orgUnitId },
    });
  }

  async countActiveByOrgUnitId(orgUnitId: string): Promise<number> {
    return await this.prisma.person.count({
      where: { orgUnitId, isActive: true },
    });
  }

  async update(person: Person): Promise<Person> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.person.update({
        where: { id: person.id },
        data: {
          azureAdId: person.azureAdId,
          firstName: person.firstName,
          lastName: person.lastName,
          middleName: person.middleName,
          email: person.email,
          employeeId: person.employeeId,
          orgUnitId: person.orgUnitId,
          primaryRoleId: person.primaryRoleId,
          managerId: person.managerId,
          title: person.title,
          office: person.office,
          phone: person.phone,
          mobile: person.mobile,
          locationId: person.locationId,
          department: person.department,
          hireDate: person.hireDate,
          terminationDate: person.terminationDate,
          isActive: person.isActive,
          userId: person.userId,
          metadata:
            (person.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          updatedAt: person.updatedAt,
        },
      });

      this.logger.timed("update", "Person updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update person", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.person.delete({
        where: { id },
      });

      this.logger.timed("delete", "Person deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete person", error);
      throw error;
    }
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const person = await this.prisma.person.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!person) return false;
    if (excludeId && person.id === excludeId) return false;

    return true;
  }

  async existsByEmployeeId(
    employeeId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const person = await this.prisma.person.findUnique({
      where: { employeeId },
      select: { id: true },
    });

    if (!person) return false;
    if (excludeId && person.id === excludeId) return false;

    return true;
  }

  async existsByUserId(userId: string, excludeId?: string): Promise<boolean> {
    const person = await this.prisma.person.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!person) return false;
    if (excludeId && person.id === excludeId) return false;

    return true;
  }

  private toDomain(prismaPerson: PrismaPerson): Person {
    return Person.reconstitute({
      id: prismaPerson.id,
      azureAdId: prismaPerson.azureAdId,
      userId: prismaPerson.userId,
      firstName: prismaPerson.firstName,
      lastName: prismaPerson.lastName,
      middleName: prismaPerson.middleName,
      email: prismaPerson.email,
      phone: prismaPerson.phone,
      mobile: prismaPerson.mobile,
      employeeId: prismaPerson.employeeId,
      orgUnitId: prismaPerson.orgUnitId,
      primaryRoleId: prismaPerson.primaryRoleId,
      managerId: prismaPerson.managerId,
      title: prismaPerson.title,
      office: prismaPerson.office,
      locationId: prismaPerson.locationId,
      department: prismaPerson.department,
      hireDate: prismaPerson.hireDate,
      terminationDate: prismaPerson.terminationDate,
      isActive: prismaPerson.isActive,
      metadata: prismaPerson.metadata as Record<string, unknown> | null,
      createdAt: prismaPerson.createdAt,
      updatedAt: prismaPerson.updatedAt,
    });
  }
}
