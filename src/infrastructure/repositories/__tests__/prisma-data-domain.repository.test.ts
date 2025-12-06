/**
 * PrismaDataDomainRepository - Integration Tests
 *
 * Integration tests for PrismaDataDomainRepository using mock Prisma client.
 *
 * NOTE: These tests use mock Prisma client. For full integration tests,
 * you would use Testcontainers to spin up a real PostgreSQL instance.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PrismaDataDomainRepository } from "../prisma-data-domain.repository";
import { DataDomain } from "@/core/domain/entities/data-domain.entity";
import type { PrismaClient } from "@/generated/prisma/server";
import type { ILoggerService } from "@/core/services";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

interface DataDomainData {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class MockPrismaClient {
  private dataDomains = new Map<string, DataDomainData>();

  dataDomain = {
    findUnique: vi.fn(
      async ({ where }: { where: { id?: string; code?: string } }) => {
        if (where.id) {
          return this.dataDomains.get(where.id) || null;
        }
        if (where.code) {
          return (
            Array.from(this.dataDomains.values()).find(
              (dd) => dd.code === where.code,
            ) || null
          );
        }
        return null;
      },
    ),

    findMany: vi.fn(async ({ where }: { where?: { isActive?: boolean } }) => {
      let dataDomains = Array.from(this.dataDomains.values());

      if (where?.isActive !== undefined) {
        dataDomains = dataDomains.filter(
          (dd) => dd.isActive === where.isActive,
        );
      }

      // Sort by name
      dataDomains.sort((a, b) => a.name.localeCompare(b.name));

      return dataDomains;
    }),

    create: vi.fn(async ({ data }: { data: DataDomainData }) => {
      this.dataDomains.set(data.id, { ...data });
      return this.dataDomains.get(data.id);
    }),

    update: vi.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<DataDomainData>;
      }) => {
        const existing = this.dataDomains.get(where.id);
        if (!existing) {
          throw new Error("Record not found");
        }
        const updated = { ...existing, ...data, updatedAt: new Date() };
        this.dataDomains.set(where.id, updated);
        return updated;
      },
    ),

    delete: vi.fn(async ({ where }: { where: { id: string } }) => {
      if (!this.dataDomains.has(where.id)) {
        throw new Error("Record not found");
      }
      this.dataDomains.delete(where.id);
      return {};
    }),

    count: vi.fn(async ({ where }: { where?: { code?: string } }) => {
      if (where?.code) {
        return Array.from(this.dataDomains.values()).filter(
          (dd) => dd.code === where.code,
        ).length;
      }
      return this.dataDomains.size;
    }),
  };

  // Test helper
  clear(): void {
    this.dataDomains.clear();
  }
}

let mockIdGenerator: IIdGenerator;

describe("PrismaDataDomainRepository - Integration Tests", () => {
  let repository: PrismaDataDomainRepository;
  let mockPrisma: MockPrismaClient;
  const mockLogger: ILoggerService = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: () => mockLogger,
    startTimer: vi.fn(() => ({ operation: "", startTime: 0 })),
    endTimer: vi.fn(),
    audit: vi.fn(),
    withTiming: vi.fn((fn) => fn()),
  };

  beforeEach(() => {
    let idCounter = 0;
    mockIdGenerator = {
      generateId: vi.fn(() => `test-cuid-${idCounter++}`),
    };
    mockPrisma = new MockPrismaClient();
    repository = new PrismaDataDomainRepository(
      mockPrisma as unknown as PrismaClient,
      mockLogger,
    );
    mockPrisma.clear();
  });

  describe("findById", () => {
    it("should find a data domain by ID", async () => {
      // Arrange
      const dataDomain = DataDomain.create(
        {
          name: "Customer PII",
          code: "CUST-PII",
          description: "Customer Personal Identifiable Information",
        },
        mockIdGenerator,
      );

      await repository.create(dataDomain);

      // Act
      const found = await repository.findById(dataDomain.id);

      // Assert
      expect(found).not.toBeNull();
      expect(found!.id).toBe(dataDomain.id);
      expect(found!.name).toBe("Customer PII");
      expect(found!.code).toBe("CUST-PII");
    });

    it("should return null for non-existent data domain", async () => {
      // Act
      const found = await repository.findById("non-existent");

      // Assert
      expect(found).toBeNull();
    });
  });

  describe("findByCode", () => {
    it("should find a data domain by code", async () => {
      // Arrange
      const dataDomain = DataDomain.create(
        {
          name: "Financial Data",
          code: "FIN-DATA",
        },
        mockIdGenerator,
      );

      await repository.create(dataDomain);

      // Act
      const found = await repository.findByCode("FIN-DATA");

      // Assert
      expect(found).not.toBeNull();
      expect(found!.code).toBe("FIN-DATA");
      expect(found!.name).toBe("Financial Data");
    });

    it("should return null for non-existent code", async () => {
      // Act
      const found = await repository.findByCode("NON-EXISTENT");

      // Assert
      expect(found).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should find all active data domains by default", async () => {
      // Arrange
      const domain1 = DataDomain.create(
        {
          name: "Domain A",
          code: "DOMAIN-A",
        },
        mockIdGenerator,
      );
      const domain2 = DataDomain.create(
        {
          name: "Domain B",
          code: "DOMAIN-B",
        },
        mockIdGenerator,
      );
      const domain3 = DataDomain.create(
        {
          name: "Domain C (Inactive)",
          code: "DOMAIN-C",
          isActive: false,
        },
        mockIdGenerator,
      );

      await repository.create(domain1);
      await repository.create(domain2);
      await repository.create(domain3);

      // Act
      const dataDomains = await repository.findAll();

      // Assert
      expect(dataDomains).toHaveLength(2);
      expect(dataDomains.every((dd) => dd.isActive)).toBe(true);
    });

    it("should include inactive data domains when specified", async () => {
      // Arrange
      const domain1 = DataDomain.create(
        {
          name: "Active Domain",
          code: "ACTIVE",
        },
        mockIdGenerator,
      );
      const domain2 = DataDomain.create(
        {
          name: "Inactive Domain",
          code: "INACTIVE",
          isActive: false,
        },
        mockIdGenerator,
      );

      await repository.create(domain1);
      await repository.create(domain2);

      // Act
      const dataDomains = await repository.findAll({ includeInactive: true });

      // Assert
      expect(dataDomains).toHaveLength(2);
    });

    it("should sort by name ascending", async () => {
      // Arrange
      const domain1 = DataDomain.create(
        {
          name: "Zebra Domain",
          code: "ZEBRA",
        },
        mockIdGenerator,
      );
      const domain2 = DataDomain.create(
        {
          name: "Apple Domain",
          code: "APPLE",
        },
        mockIdGenerator,
      );
      const domain3 = DataDomain.create(
        {
          name: "Mango Domain",
          code: "MANGO",
        },
        mockIdGenerator,
      );

      await repository.create(domain1);
      await repository.create(domain2);
      await repository.create(domain3);

      // Act
      const dataDomains = await repository.findAll();

      // Assert
      expect(dataDomains[0].name).toBe("Apple Domain");
      expect(dataDomains[1].name).toBe("Mango Domain");
      expect(dataDomains[2].name).toBe("Zebra Domain");
    });
  });

  describe("create", () => {
    it("should create a new data domain", async () => {
      // Arrange
      const dataDomain = DataDomain.create(
        {
          name: "Payment Card Data",
          code: "PCI-DATA",
          description: "PCI DSS compliance data",
        },
        mockIdGenerator,
      );

      // Act
      const created = await repository.create(dataDomain);

      // Assert
      expect(created.id).toBe(dataDomain.id);
      expect(created.name).toBe("Payment Card Data");
      expect(created.code).toBe("PCI-DATA");
      expect(created.description).toBe("PCI DSS compliance data");
    });

    it("should create data domain without description", async () => {
      // Arrange
      const dataDomain = DataDomain.create(
        {
          name: "Minimal Domain",
          code: "MIN",
        },
        mockIdGenerator,
      );

      // Act
      const created = await repository.create(dataDomain);

      // Assert
      expect(created.description).toBeNull();
    });

    it("should create inactive data domain", async () => {
      // Arrange
      const dataDomain = DataDomain.create(
        {
          name: "Inactive",
          code: "INACTIVE",
          isActive: false,
        },
        mockIdGenerator,
      );

      // Act
      const created = await repository.create(dataDomain);

      // Assert
      expect(created.isActive).toBe(false);
    });
  });

  describe("update", () => {
    it("should update data domain properties", async () => {
      // Arrange
      const dataDomain = DataDomain.create(
        {
          name: "Original Name",
          code: "ORIG",
        },
        mockIdGenerator,
      );

      await repository.create(dataDomain);

      // Modify the entity
      (dataDomain as { name: string }).name = "Updated Name";
      (dataDomain as { description: string | null }).description =
        "Updated description";

      // Act
      const updated = await repository.update(dataDomain);

      // Assert
      expect(updated.name).toBe("Updated Name");
      expect(updated.description).toBe("Updated description");
      expect(updated.code).toBe("ORIG"); // Code should not change
    });

    it("should update isActive status", async () => {
      // Arrange
      const dataDomain = DataDomain.create(
        {
          name: "Test",
          code: "TEST",
        },
        mockIdGenerator,
      );

      await repository.create(dataDomain);

      dataDomain.deactivate();

      // Act
      const updated = await repository.update(dataDomain);

      // Assert
      expect(updated.isActive).toBe(false);
    });

    it("should throw error for non-existent data domain", async () => {
      // Arrange
      const dataDomain = DataDomain.create(
        {
          name: "Non-existent",
          code: "NONE",
        },
        mockIdGenerator,
      );

      // Act & Assert
      await expect(repository.update(dataDomain)).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete a data domain", async () => {
      // Arrange
      const dataDomain = DataDomain.create(
        {
          name: "To Delete",
          code: "DELETE",
        },
        mockIdGenerator,
      );

      await repository.create(dataDomain);

      // Act
      await repository.delete(dataDomain.id);

      // Assert
      const found = await repository.findById(dataDomain.id);
      expect(found).toBeNull();
    });

    it("should throw error for non-existent data domain", async () => {
      // Act & Assert
      await expect(repository.delete("non-existent")).rejects.toThrow();
    });
  });

  describe("existsByCode", () => {
    it("should return true if data domain with code exists", async () => {
      // Arrange
      const dataDomain = DataDomain.create(
        {
          name: "Test",
          code: "TEST-CODE",
        },
        mockIdGenerator,
      );

      await repository.create(dataDomain);

      // Act
      const exists = await repository.existsByCode("TEST-CODE");

      // Assert
      expect(exists).toBe(true);
    });

    it("should return false if data domain with code does not exist", async () => {
      // Act
      const exists = await repository.existsByCode("NON-EXISTENT");

      // Assert
      expect(exists).toBe(false);
    });
  });
});
