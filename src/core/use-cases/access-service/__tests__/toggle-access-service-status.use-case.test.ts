import { describe, it, expect, vi, beforeEach } from "vitest";
import { ToggleAccessServiceStatusUseCase } from "../toggle-access-service-status.use-case";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type {
  IAccessServiceRepository,
  AccessServiceData,
} from "@/core/repositories/workflow/access-service.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";

function fakeService(
  overrides: Partial<AccessServiceData> = {},
): AccessServiceData {
  return {
    id: "svc-1",
    name: "VPN Access",
    slug: "vpn-access",
    isActive: true,
    requireManagerApproval: false,
    description: null,
    instructions: null,
    createdById: null,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignees: [
      {
        userId: "u-1",
        role: "OWNER",
        userName: "Alice",
        userEmail: "alice@example.com",
      },
    ],
    ...overrides,
  };
}

function makeRepo(
  found: AccessServiceData | null = fakeService(),
): IAccessServiceRepository {
  return {
    findById: vi.fn().mockResolvedValue(found),
    update: vi.fn().mockImplementation(async (id, patch, assignees) => ({
      ...fakeService(),
      ...patch,
      assignees: assignees.map((a: { userId: string; role: string }) => ({
        userId: a.userId,
        role: a.role,
        userName: "User",
        userEmail: "user@example.com",
      })),
    })),
    findBySlug: vi.fn(),
    findByName: vi.fn(),
    findAll: vi.fn(),
    findAssigneesWithDetails: vi.fn(),
    create: vi.fn(),
  } as unknown as IAccessServiceRepository;
}

function makeLogger(): ILoggerService {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  } as unknown as ILoggerService;
}

describe("ToggleAccessServiceStatusUseCase", () => {
  let logger: ILoggerService;

  beforeEach(() => {
    logger = makeLogger();
  });

  it("deactivates an active service", async () => {
    const repo = makeRepo(fakeService({ isActive: true }));
    const useCase = new ToggleAccessServiceStatusUseCase(repo, logger);

    const result = await useCase.execute({ id: "svc-1", isActive: false });

    expect(repo.update).toHaveBeenCalledWith(
      "svc-1",
      expect.objectContaining({ isActive: false }),
      expect.anything(),
    );
    expect(result.isActive).toBe(false);
  });

  it("reactivates an inactive service", async () => {
    const repo = makeRepo(fakeService({ isActive: false }));
    const useCase = new ToggleAccessServiceStatusUseCase(repo, logger);

    const result = await useCase.execute({ id: "svc-1", isActive: true });

    expect(repo.update).toHaveBeenCalledWith(
      "svc-1",
      expect.objectContaining({ isActive: true }),
      expect.anything(),
    );
    expect(result.isActive).toBe(true);
  });

  it("throws NotFoundError when service does not exist", async () => {
    const repo = makeRepo(null);
    const useCase = new ToggleAccessServiceStatusUseCase(repo, logger);

    await expect(
      useCase.execute({ id: "missing-id", isActive: false }),
    ).rejects.toThrow(NotFoundError);
  });

  it("does not call repo.update when service is not found", async () => {
    const repo = makeRepo(null);
    const useCase = new ToggleAccessServiceStatusUseCase(repo, logger);

    await expect(
      useCase.execute({ id: "missing-id", isActive: false }),
    ).rejects.toThrow();

    expect(repo.update).not.toHaveBeenCalled();
  });

  it("preserves existing assignees on toggle", async () => {
    const existing = fakeService({
      assignees: [
        {
          userId: "u-1",
          role: "OWNER",
          userName: "Alice",
          userEmail: "a@b.com",
        },
        {
          userId: "u-2",
          role: "CYBERSECURITY",
          userName: "Bob",
          userEmail: "b@b.com",
        },
      ],
    });
    const repo = makeRepo(existing);
    const useCase = new ToggleAccessServiceStatusUseCase(repo, logger);

    await useCase.execute({ id: "svc-1", isActive: false });

    expect(repo.update).toHaveBeenCalledWith(
      "svc-1",
      expect.anything(),
      expect.arrayContaining([
        expect.objectContaining({ userId: "u-1", role: "OWNER" }),
        expect.objectContaining({ userId: "u-2", role: "CYBERSECURITY" }),
      ]),
    );
  });

  it("passes updatedById to repo.update", async () => {
    const repo = makeRepo();
    const useCase = new ToggleAccessServiceStatusUseCase(repo, logger);

    await useCase.execute({
      id: "svc-1",
      isActive: false,
      updatedById: "admin-user",
    });

    expect(repo.update).toHaveBeenCalledWith(
      "svc-1",
      expect.objectContaining({ updatedById: "admin-user" }),
      expect.anything(),
    );
  });

  it("logs after successful toggle", async () => {
    const repo = makeRepo();
    const useCase = new ToggleAccessServiceStatusUseCase(repo, logger);

    await useCase.execute({ id: "svc-1", isActive: false });

    expect(logger.info).toHaveBeenCalledWith(
      "access-service.toggle-status",
      expect.objectContaining({ id: "svc-1", isActive: false }),
    );
  });
});
