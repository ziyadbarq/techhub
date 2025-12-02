/**
 * Prisma Person Repository Implementation
 */

import { inject, injectable } from "inversify";
import { Prisma } from "@/generated/prisma/server";
import type { PrismaClient } from "@/generated/prisma/server";
import type { Person as PrismaPerson } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { Person } from "@/core/domain/entities/person.entity";
import type {
  IPersonRepository,
  PersonWithDirectoryRelations,
  PersonWithoutUserView,
} from "@/core/repositories/person.repository.interface";
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
          isExcluded: person.isExcluded,
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

  // Legacy stub: primary role relationships were removed from the schema.
  async findByPrimaryRoleId(_roleId: string): Promise<Person[]> {
    return [];
  }

  async findActive(options?: {
    skip?: number;
    take?: number;
  }): Promise<Person[]> {
    const persons = await this.prisma.person.findMany({
      where: { isActive: true, isExcluded: false },
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

  async findExcluded(options?: {
    skip?: number;
    take?: number;
  }): Promise<Person[]> {
    const persons = await this.prisma.person.findMany({
      where: { isExcluded: true },
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

  async findNotLinkedToUsersWithDetails(): Promise<PersonWithoutUserView[]> {
    const persons = await this.prisma.person.findMany({
      where: { userId: null, isActive: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        orgUnit: {
          select: { id: true, name: true },
        },
      },
    });

    return persons.map((person) => ({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      middleName: person.middleName,
      email: person.email,
      employeeId: person.employeeId,
      title: person.title,
      department: person.department,
      isActive: person.isActive,
      orgUnit: person.orgUnit
        ? {
            id: person.orgUnit.id,
            name: person.orgUnit.name,
          }
        : null,
    }));
  }

  async findNotLinkedToUsersByEmail(
    email: string,
  ): Promise<PersonWithoutUserView[]> {
    const persons = await this.prisma.person.findMany({
      where: {
        userId: null,
        isActive: true,
        email: { equals: email, mode: "insensitive" },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        orgUnit: { select: { id: true, name: true } },
      },
    });

    return persons.map((person) => ({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      middleName: person.middleName,
      email: person.email,
      employeeId: person.employeeId,
      title: person.title,
      department: person.department,
      isActive: person.isActive,
      orgUnit: person.orgUnit
        ? { id: person.orgUnit.id, name: person.orgUnit.name }
        : null,
    }));
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
          isExcluded: person.isExcluded,
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

  async updateSoftDelete(id: string): Promise<void> {
    await this.prisma.person.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
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

  async findByEmails(emails: string[]): Promise<Person[]> {
    if (emails.length === 0) return [];

    const timer = this.logger.startTimer();

    try {
      // Filter out empty/null values and normalize to lowercase
      const validEmails = emails
        .filter((e) => e !== null && e !== undefined && e.trim() !== "")
        .map((e) => e.toLowerCase().trim());

      if (validEmails.length === 0) return [];

      const persons = await this.prisma.person.findMany({
        where: { email: { in: validEmails, mode: "insensitive" } },
      });

      this.logger.timed("findByEmails", "Persons fetched by emails", timer(), {
        requestedCount: validEmails.length,
        foundCount: persons.length,
      });

      return persons.map((p: PrismaPerson) => this.toDomain(p));
    } catch (error) {
      this.logger.error(
        "findByEmails",
        "Failed to fetch persons by emails",
        error,
      );
      throw error;
    }
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
      primaryRoleId: null, // Deprecated: removed from schema
      managerId: prismaPerson.managerId,
      title: prismaPerson.title,
      office: prismaPerson.office,
      locationId: prismaPerson.locationId,
      department: prismaPerson.department,
      hireDate: prismaPerson.hireDate,
      terminationDate: prismaPerson.terminationDate,
      isActive: prismaPerson.isActive,
      isExcluded: prismaPerson.isExcluded,
      metadata: prismaPerson.metadata as Record<string, unknown> | null,
      createdAt: prismaPerson.createdAt,
      updatedAt: prismaPerson.updatedAt,
    });
  }

  // ==========================================
  // Employee Directory Methods
  // ==========================================

  async findAllForDirectory(options?: {
    search?: string;
    orgUnitIds?: string[];
    locationIds?: string[];
    isActive?: boolean;
    isExcluded?: boolean;
    hasManager?: boolean;
    managerId?: string;
  }): Promise<PersonWithDirectoryRelations[]> {
    const timer = this.logger.startTimer();

    try {
      // Build where clause
      const where: Prisma.PersonWhereInput = {};

      // Active status filter (defaults to true in caller)
      if (options?.isActive !== undefined) {
        where.isActive = options.isActive;
      }

      // Excluded status filter
      if (options?.isExcluded !== undefined) {
        where.isExcluded = options.isExcluded;
      }

      // Search across multiple fields
      if (options?.search) {
        const query = options.search.trim();
        where.OR = [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { title: { contains: query, mode: "insensitive" } },
          { department: { contains: query, mode: "insensitive" } },
          { employeeId: { contains: query, mode: "insensitive" } },
        ];
      }

      // Filter by org units
      if (options?.orgUnitIds && options.orgUnitIds.length > 0) {
        where.orgUnitId = { in: options.orgUnitIds };
      }

      // Filter by locations
      if (options?.locationIds && options.locationIds.length > 0) {
        where.locationId = { in: options.locationIds };
      }

      // Filter by manager
      if (options?.hasManager !== undefined) {
        where.managerId = options.hasManager ? { not: null } : null;
      }

      if (options?.managerId) {
        where.managerId = options.managerId;
      }

      // Fetch persons with relations
      const persons = await this.prisma.person.findMany({
        where,
        include: {
          orgUnit: {
            select: { id: true, name: true, code: true },
          },
          location: {
            select: { id: true, name: true, city: true },
          },
          manager: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { directReports: true },
          },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });

      this.logger.timed(
        "findAllForDirectory",
        `Found ${persons.length} employees`,
        timer(),
      );

      return persons.map((p) => ({
        person: this.toDomain(p),
        orgUnit: p.orgUnit,
        location: p.location,
        manager: p.manager,
        directReportsCount: p._count.directReports,
      }));
    } catch (error) {
      this.logger.error(
        "findAllForDirectory",
        "Failed to fetch employees for directory",
        error,
      );
      throw error;
    }
  }

  async findDirectReports(managerId: string): Promise<Person[]> {
    const persons = await this.prisma.person.findMany({
      where: {
        managerId,
        isActive: true,
        isExcluded: false,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return persons.map((p: PrismaPerson) => this.toDomain(p));
  }

  async countByOrgUnits(): Promise<Map<string, number>> {
    const counts = await this.prisma.person.groupBy({
      by: ["orgUnitId"],
      where: { isActive: true, isExcluded: false },
      _count: { id: true },
    });

    const map = new Map<string, number>();
    counts.forEach((c) => {
      map.set(c.orgUnitId, c._count.id);
    });

    return map;
  }

  async countByLocations(): Promise<Map<string, number>> {
    const counts = await this.prisma.person.groupBy({
      by: ["locationId"],
      where: { isActive: true, isExcluded: false, locationId: { not: null } },
      _count: { id: true },
    });

    const map = new Map<string, number>();
    counts.forEach((c) => {
      if (c.locationId) {
        map.set(c.locationId, c._count.id);
      }
    });

    return map;
  }

  /**
   * Find reporting chain using recursive CTE
   * Returns chain from top (CEO) down to the specified person
   */
  async findReportingChain(
    personId: string,
  ): Promise<PersonWithDirectoryRelations[]> {
    const timer = this.logger.startTimer();

    try {
      // Use recursive CTE to traverse up the manager hierarchy
      // Note: IDs are CUIDs (text strings), not native UUIDs, so no ::uuid cast
      const chainIds = await this.prisma.$queryRaw<Array<{ id: string }>>`
        WITH RECURSIVE reporting_chain AS (
          -- Base case: start with the target person
          SELECT id, "managerId", 0 AS depth
          FROM persons
          WHERE id = ${personId} AND "isActive" = true

          UNION ALL

          -- Recursive case: get the manager of each person
          SELECT p.id, p."managerId", rc.depth + 1
          FROM persons p
          INNER JOIN reporting_chain rc ON p.id = rc."managerId"
          WHERE p."isActive" = true
        )
        SELECT id FROM reporting_chain
        ORDER BY depth DESC
      `;

      if (chainIds.length === 0) {
        return [];
      }

      // Fetch full person data with relations for the chain
      const persons = await this.prisma.person.findMany({
        where: {
          id: { in: chainIds.map((c) => c.id) },
        },
        include: {
          orgUnit: {
            select: { id: true, name: true, code: true },
          },
          location: {
            select: { id: true, name: true, city: true },
          },
          manager: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { directReports: true },
          },
        },
      });

      // Create a map for ordering
      const personMap = new Map(persons.map((p) => [p.id, p]));

      // Return in correct order (from top to target)
      const orderedResults = chainIds
        .map((c) => personMap.get(c.id))
        .filter((p): p is NonNullable<typeof p> => p !== undefined)
        .map((p) => ({
          person: this.toDomain(p),
          orgUnit: p.orgUnit,
          location: p.location,
          manager: p.manager,
          directReportsCount: p._count.directReports,
        }));

      this.logger.timed(
        "findReportingChain",
        `Found ${orderedResults.length} persons in chain`,
        timer(),
        { personId },
      );

      return orderedResults;
    } catch (error) {
      this.logger.error(
        "findReportingChain",
        "Failed to fetch reporting chain",
        error,
      );
      throw error;
    }
  }

  /**
   * Find direct reports for a manager with directory relations
   * Used for lazy loading in org chart
   */
  async findDirectReportsForDirectory(
    managerId: string,
  ): Promise<PersonWithDirectoryRelations[]> {
    const timer = this.logger.startTimer();

    try {
      const persons = await this.prisma.person.findMany({
        where: {
          managerId,
          isActive: true,
          isExcluded: false,
        },
        include: {
          orgUnit: {
            select: { id: true, name: true, code: true },
          },
          location: {
            select: { id: true, name: true, city: true },
          },
          manager: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { directReports: true },
          },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });

      this.logger.timed(
        "findDirectReportsForDirectory",
        `Found ${persons.length} direct reports`,
        timer(),
        { managerId },
      );

      return persons.map((p) => ({
        person: this.toDomain(p),
        orgUnit: p.orgUnit,
        location: p.location,
        manager: p.manager,
        directReportsCount: p._count.directReports,
      }));
    } catch (error) {
      this.logger.error(
        "findDirectReportsForDirectory",
        "Failed to fetch direct reports",
        error,
      );
      throw error;
    }
  }

  /**
   * Find root employees (those without a manager or whose manager is inactive)
   * Used for org chart initial load
   */
  async findRootEmployeesForDirectory(): Promise<
    PersonWithDirectoryRelations[]
  > {
    const timer = this.logger.startTimer();

    try {
      // Find employees who either have no manager or whose manager is not active
      const persons = await this.prisma.person.findMany({
        where: {
          isActive: true,
          isExcluded: false,
          OR: [
            { managerId: null },
            {
              manager: {
                isActive: false,
              },
            },
          ],
        },
        include: {
          orgUnit: {
            select: { id: true, name: true, code: true },
          },
          location: {
            select: { id: true, name: true, city: true },
          },
          manager: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { directReports: true },
          },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });

      this.logger.timed(
        "findRootEmployeesForDirectory",
        `Found ${persons.length} root employees`,
        timer(),
      );

      return persons.map((p) => ({
        person: this.toDomain(p),
        orgUnit: p.orgUnit,
        location: p.location,
        manager: p.manager,
        directReportsCount: p._count.directReports,
      }));
    } catch (error) {
      this.logger.error(
        "findRootEmployeesForDirectory",
        "Failed to fetch root employees",
        error,
      );
      throw error;
    }
  }
}
