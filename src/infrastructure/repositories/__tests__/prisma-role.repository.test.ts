/**
 * PrismaRoleRepository - Integration Tests
 *
 * Integration tests for PrismaRoleRepository using real Prisma client.
 * These tests require a database connection.
 *
 * NOTE: These tests use mock Prisma client for now. For full integration tests,
 * you would use Testcontainers to spin up a real PostgreSQL instance.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PrismaRoleRepository } from "../prisma-role.repository";
import { Role } from "@/core/domain/entities/role.entity";
import type { PrismaClient } from "@/generated/prisma/server";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

/**
 * Mock Prisma Client for testing
 *
 * In a full integration test suite, you would:
 * 1. Use @testcontainers/postgresql to create a real database
 * 2. Run migrations
 * 3. Use real PrismaClient
 *
 * Example:
 * ```
 * import { PostgreSqlContainer } from '@testcontainers/postgresql';
 *
 * let container: StartedPostgreSqlContainer;
 * let prisma: PrismaClient;
 *
 * beforeAll(async () => {
 *   container = await new PostgreSqlContainer().start();
 *   process.env.DATABASE_URL = container.getConnectionUrl();
 *   prisma = new PrismaClient();
 *   // Run migrations
 * });
 * ```
 */

interface RoleData {
  id: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
  [key: string]: unknown;
}

class MockPrismaClient {
  private roles = new Map<string, RoleData>();

  role = {
    findUnique: vi.fn(
      async ({ where }: { where: { id?: string; name?: string } }) => {
        if (where.id) {
          return this.roles.get(where.id) || null;
        }
        if (where.name) {
          return (
            Array.from(this.roles.values()).find(
              (r) => r.name === where.name,
            ) || null
          );
        }
        return null;
      },
    ),

    findMany: vi.fn(
      async ({
        where,
        orderBy,
      }: {
        where?: { isActive?: boolean; id?: { in?: string[] } };
        orderBy?: unknown;
      }) => {
        let roles = Array.from(this.roles.values());

        if (where?.isActive !== undefined) {
          roles = roles.filter((r) => r.isActive === where.isActive);
        }

        if (where?.id?.in) {
          const ids = where.id.in;
          roles = roles.filter((r) => ids.includes(r.id));
        }

        // Simple sorting (in real test, use actual Prisma)
        if (orderBy) {
          roles.sort((a, b) => {
            if (a.isSystem !== b.isSystem) {
              return b.isSystem ? 1 : -1;
            }
            return a.name.localeCompare(b.name);
          });
        }

        return roles;
      },
    ),

    create: vi.fn(async ({ data }: { data: RoleData }) => {
      this.roles.set(data.id, { ...data });
      return this.roles.get(data.id);
    }),

    update: vi.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<RoleData>;
      }) => {
        const existing = this.roles.get(where.id);
        if (!existing) {
          throw new Error("Record not found");
        }
        const updated = { ...existing, ...data };
        this.roles.set(where.id, updated);
        return updated;
      },
    ),

    delete: vi.fn(async ({ where }: { where: { id: string } }) => {
      if (!this.roles.has(where.id)) {
        throw new Error("Record not found");
      }
      this.roles.delete(where.id);
      return {};
    }),

    count: vi.fn(async ({ where }: { where?: { name?: string } }) => {
      if (where?.name) {
        return Array.from(this.roles.values()).filter(
          (r) => r.name === where.name,
        ).length;
      }
      return this.roles.size;
    }),
  };

  rolePermission = {
    findMany: vi.fn(async () => []),
    createMany: vi.fn(async () => ({ count: 0 })),
    deleteMany: vi.fn(async () => ({ count: 0 })),
  };

  // Test helper
  clear(): void {
    this.roles.clear();
  }
}

let mockIdGenerator: IIdGenerator;

describe("PrismaRoleRepository - Integration Tests", () => {
  let repository: PrismaRoleRepository;
  let mockPrisma: MockPrismaClient;

  beforeEach(() => {
    let idCounter = 0;
    mockIdGenerator = {
      generateId: vi.fn(() => `test-cuid-${idCounter++}`),
    };
    mockPrisma = new MockPrismaClient();
    repository = new PrismaRoleRepository(
      mockPrisma as unknown as PrismaClient,
    );
    mockPrisma.clear();
  });

  describe("findById", () => {
    it("should find a role by ID", async () => {
      // Arrange
      const role = Role.create(
        {
          name: "editor",
          displayName: "Editor",
        },
        mockIdGenerator,
      );

      await repository.create(role);

      // Act
      const found = await repository.findById(role.id);

      // Assert
      expect(found).not.toBeNull();
      expect(found!.id).toBe(role.id);
      expect(found!.name).toBe("editor");
    });

    it("should return null for non-existent role", async () => {
      // Act
      const found = await repository.findById("non-existent");

      // Assert
      expect(found).toBeNull();
    });
  });

  describe("findByName", () => {
    it("should find a role by name", async () => {
      // Arrange
      const role = Role.create(
        {
          name: "editor",
          displayName: "Editor",
        },
        mockIdGenerator,
      );

      await repository.create(role);

      // Act
      const found = await repository.findByName("editor");

      // Assert
      expect(found).not.toBeNull();
      expect(found!.name).toBe("editor");
    });

    it("should return null for non-existent role name", async () => {
      // Act
      const found = await repository.findByName("non-existent");

      // Assert
      expect(found).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should find all active roles by default", async () => {
      // Arrange
      const role1 = Role.create(
        {
          name: "editor",
          displayName: "Editor",
        },
        mockIdGenerator,
      );
      const role2 = Role.create(
        {
          name: "viewer",
          displayName: "Viewer",
        },
        mockIdGenerator,
      );
      const role3 = Role.create(
        {
          name: "inactive",
          displayName: "Inactive",
        },
        mockIdGenerator,
      ).deactivate();

      await repository.create(role1);
      await repository.create(role2);
      await repository.create(role3);

      // Act
      const roles = await repository.findAll();

      // Assert
      expect(roles).toHaveLength(2);
      expect(roles.every((r) => r.isActive)).toBe(true);
    });

    it("should include inactive roles when specified", async () => {
      // Arrange
      const role1 = Role.create(
        {
          name: "editor",
          displayName: "Editor",
        },
        mockIdGenerator,
      );
      const role2 = Role.create(
        {
          name: "inactive",
          displayName: "Inactive",
        },
        mockIdGenerator,
      ).deactivate();

      await repository.create(role1);
      await repository.create(role2);

      // Act
      const roles = await repository.findAll({ includeInactive: true });

      // Assert
      expect(roles).toHaveLength(2);
    });

    it("should sort by isSystem desc, then name asc", async () => {
      // Arrange
      const role1 = Role.create(
        {
          name: "zebra",
          displayName: "Zebra",
          isSystem: false,
        },
        mockIdGenerator,
      );
      const role2 = Role.create(
        {
          name: "admin",
          displayName: "Admin",
          isSystem: true,
        },
        mockIdGenerator,
      );
      const role3 = Role.create(
        {
          name: "apple",
          displayName: "Apple",
          isSystem: false,
        },
        mockIdGenerator,
      );

      await repository.create(role1);
      await repository.create(role2);
      await repository.create(role3);

      // Act
      const roles = await repository.findAll();

      // Assert
      expect(roles[0].isSystem).toBe(true); // System roles first
      expect(roles[1].name).toBe("apple"); // Then alphabetically
      expect(roles[2].name).toBe("zebra");
    });
  });

  describe("create", () => {
    it("should create a new role", async () => {
      // Arrange
      const role = Role.create(
        {
          name: "editor",
          displayName: "Editor",
          description: "Can edit content",
          createdBy: "admin-1",
        },
        mockIdGenerator,
      );

      // Act
      const created = await repository.create(role);

      // Assert
      expect(created.id).toBe(role.id);
      expect(created.name).toBe("editor");
      expect(created.displayName).toBe("Editor");
      expect(created.description).toBe("Can edit content");
      expect(created.createdBy).toBe("admin-1");
    });

    it("should create system role", async () => {
      // Arrange
      const role = Role.create(
        {
          name: "admin",
          displayName: "Admin",
          isSystem: true,
        },
        mockIdGenerator,
      );

      // Act
      const created = await repository.create(role);

      // Assert
      expect(created.isSystem).toBe(true);
    });
  });

  describe("update", () => {
    it("should update role properties", async () => {
      // Arrange
      const role = Role.create(
        {
          name: "editor",
          displayName: "Editor",
        },
        mockIdGenerator,
      );

      await repository.create(role);

      const updated = role.update({
        displayName: "Content Editor",
        description: "Edits content",
      });

      // Act
      const result = await repository.update(updated);

      // Assert
      expect(result.displayName).toBe("Content Editor");
      expect(result.description).toBe("Edits content");
      expect(result.name).toBe("editor"); // Name should not change
    });

    it("should throw error for non-existent role", async () => {
      // Arrange
      const role = Role.create(
        {
          name: "editor",
          displayName: "Editor",
        },
        mockIdGenerator,
      );

      // Act & Assert
      await expect(repository.update(role)).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete a role", async () => {
      // Arrange
      const role = Role.create(
        {
          name: "editor",
          displayName: "Editor",
        },
        mockIdGenerator,
      );

      await repository.create(role);

      // Act
      await repository.delete(role.id);

      // Assert
      const found = await repository.findById(role.id);
      expect(found).toBeNull();
    });

    it("should throw error for non-existent role", async () => {
      // Act & Assert
      await expect(repository.delete("non-existent")).rejects.toThrow();
    });
  });

  describe("existsByName", () => {
    it("should return true if role exists", async () => {
      // Arrange
      const role = Role.create(
        {
          name: "editor",
          displayName: "Editor",
        },
        mockIdGenerator,
      );

      await repository.create(role);

      // Act
      const exists = await repository.existsByName("editor");

      // Assert
      expect(exists).toBe(true);
    });

    it("should return false if role does not exist", async () => {
      // Act
      const exists = await repository.existsByName("non-existent");

      // Assert
      expect(exists).toBe(false);
    });
  });

  describe("getRolePermissions", () => {
    it("should return permissions for a role", async () => {
      // Arrange
      const role = Role.create(
        {
          name: "editor",
          displayName: "Editor",
        },
        mockIdGenerator,
      );

      await repository.create(role);

      // Act
      const permissions = await repository.getRolePermissions(role.id);

      // Assert
      expect(Array.isArray(permissions)).toBe(true);
    });
  });

  describe("assignPermissions", () => {
    it("should assign permissions to a role", async () => {
      // Arrange
      const role = Role.create(
        {
          name: "editor",
          displayName: "Editor",
        },
        mockIdGenerator,
      );

      await repository.create(role);

      // Act
      await repository.assignPermissions(role.id, ["perm-1", "perm-2"]);

      // Assert - Should not throw
      expect(mockPrisma.rolePermission.createMany).toHaveBeenCalled();
    });
  });
});
