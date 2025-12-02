/**
 * CreateRoleUseCase - Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreateRoleUseCase } from "../create-role.use-case";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { IAuditLogRepository } from "@/core/repositories/audit-log-repository.interface";
import type { ILoggerService } from "@/core/services";
import { Role } from "@/core/domain/entities/role.entity";
import { DuplicateRoleError } from "@/core/domain/errors/rbac-errors";

class MockRoleRepository implements Partial<IRoleRepository> {
  private roles = new Map<string, Role>();

  async create(role: Role): Promise<Role> {
    this.roles.set(role.id, role);
    return role;
  }

  async existsByName(name: string): Promise<boolean> {
    return Array.from(this.roles.values()).some((r) => r.name === name);
  }

  setRole(role: Role): void {
    this.roles.set(role.id, role);
  }

  clear(): void {
    this.roles.clear();
  }
}

class MockAuditLogRepository implements Partial<IAuditLogRepository> {
  create = vi.fn().mockResolvedValue({
    id: "audit-1",
    action: "role:create",
    createdAt: new Date(),
  });
}

class MockLoggerService implements Partial<ILoggerService> {
  debug = vi.fn();
  info = vi.fn();
  warn = vi.fn();
  error = vi.fn();
  async withTiming<T>(_operation: string, fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}

describe("CreateRoleUseCase", () => {
  let useCase: CreateRoleUseCase;
  let mockRoleRepository: MockRoleRepository;
  let mockAuditLogRepository: MockAuditLogRepository;
  let mockLogger: MockLoggerService;

  beforeEach(() => {
    mockRoleRepository = new MockRoleRepository();
    mockAuditLogRepository = new MockAuditLogRepository();
    mockLogger = new MockLoggerService();

    useCase = new CreateRoleUseCase(
      mockRoleRepository as unknown as IRoleRepository,
      mockAuditLogRepository as unknown as IAuditLogRepository,
      mockLogger as unknown as ILoggerService,
    );
  });

  describe("execute - successful creation", () => {
    it("should create a role with valid data", async () => {
      // Act
      const result = await useCase.execute({
        name: "editor",
        displayName: "Editor",
        description: "Can edit content",
        createdBy: "admin-1",
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe("editor");
      expect(result.displayName).toBe("Editor");
      expect(result.description).toBe("Can edit content");
      expect(result.createdBy).toBe("admin-1");
    });

    it("should create system role when isSystem is true", async () => {
      // Act
      const result = await useCase.execute({
        name: "admin",
        displayName: "Administrator",
        isSystem: true,
        createdBy: "system",
      });

      // Assert
      expect(result.isSystem).toBe(true);
    });

    it("should create non-system role by default", async () => {
      // Act
      const result = await useCase.execute({
        name: "custom-role",
        displayName: "Custom Role",
        createdBy: "admin-1",
      });

      // Assert
      expect(result.isSystem).toBe(false);
    });

    it("should create audit log entry", async () => {
      // Act
      await useCase.execute({
        name: "editor",
        displayName: "Editor",
        createdBy: "admin-1",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      });

      // Assert
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "admin-1",
          action: "role:create",
          entityType: "role",
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
        }),
      );
    });
  });

  describe("execute - duplicate prevention", () => {
    it("should throw DuplicateRoleError if role name exists", async () => {
      // Arrange
      const existingRole = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(existingRole);

      // Act & Assert
      await expect(
        useCase.execute({
          name: "editor",
          displayName: "Different Display Name",
          createdBy: "admin-1",
        }),
      ).rejects.toThrow(DuplicateRoleError);
    });

    it("should include role name in DuplicateRoleError", async () => {
      // Arrange
      const existingRole = Role.create({
        name: "editor",
        displayName: "Editor",
      });
      mockRoleRepository.setRole(existingRole);

      // Act & Assert
      try {
        await useCase.execute({
          name: "editor",
          displayName: "Editor 2",
          createdBy: "admin-1",
        });
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(DuplicateRoleError);
        expect((error as DuplicateRoleError).roleName).toBe("editor");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle creation without description", async () => {
      // Act
      const result = await useCase.execute({
        name: "viewer",
        displayName: "Viewer",
        createdBy: "admin-1",
      });

      // Assert
      expect(result.description).toBeUndefined();
    });

    it("should handle creation without createdBy", async () => {
      // Act
      const result = await useCase.execute({
        name: "public",
        displayName: "Public Role",
      });

      // Assert
      expect(result.createdBy).toBeUndefined();
    });

    it("should normalize role name to lowercase", async () => {
      // Act
      const result = await useCase.execute({
        name: "EDITOR",
        displayName: "Editor",
        createdBy: "admin-1",
      });

      // Assert
      expect(result.name).toBe("editor");
    });
  });
});
