import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateAccessServiceUseCase } from "../create-access-service.use-case";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import type {
  IAccessServiceRepository,
  AccessServiceData,
  AccessServiceAssigneeInput,
} from "@/core/repositories/workflow/access-service.repository.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";

function makeRepo(
  overrides: Partial<IAccessServiceRepository> = {},
): IAccessServiceRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findBySlug: vi.fn().mockResolvedValue(null),
    findByName: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    findAssigneesWithDetails: vi.fn().mockResolvedValue([]),
    create: vi
      .fn()
      .mockImplementation(async (data, _assignees) => ({
        ...data,
        assignees: [],
      })),
    update: vi.fn(),
    ...overrides,
  } as unknown as IAccessServiceRepository;
}

let idSeq = 0;
function makeIdGenerator(): IIdGenerator {
  return { generateId: vi.fn(() => `test-id-${++idSeq}`) };
}

function makeLogger(): ILoggerService {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  } as unknown as ILoggerService;
}

describe("CreateAccessServiceUseCase", () => {
  let repo: IAccessServiceRepository;
  let idGenerator: IIdGenerator;
  let logger: ILoggerService;
  let useCase: CreateAccessServiceUseCase;

  beforeEach(() => {
    idSeq = 0;
    repo = makeRepo();
    idGenerator = makeIdGenerator();
    logger = makeLogger();
    useCase = new CreateAccessServiceUseCase(repo, idGenerator, logger);
  });

  it("creates an access service with minimal valid input", async () => {
    const result = await useCase.execute({
      name: "IT VPN Access",
      slug: "it-vpn-access",
    });

    expect(result.name).toBe("IT VPN Access");
    expect(result.slug).toBe("it-vpn-access");
    expect(result.isActive).toBe(true);
    expect(result.requireManagerApproval).toBe(false);
  });

  it("normalizes slug to lowercase", async () => {
    await useCase.execute({ name: "My Service", slug: "MY-SERVICE" });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "my-service" }),
      expect.anything(),
    );
  });

  it("trims slug whitespace", async () => {
    await useCase.execute({ name: "My Service", slug: "  my-service  " });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "my-service" }),
      expect.anything(),
    );
  });

  it("trims name whitespace", async () => {
    await useCase.execute({ name: "  My Service  ", slug: "my-service" });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "My Service" }),
      expect.anything(),
    );
  });

  it("uses IIdGenerator to create the ID", async () => {
    await useCase.execute({ name: "Service A", slug: "service-a" });

    expect(idGenerator.generateId).toHaveBeenCalled();
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: "test-id-1" }),
      expect.anything(),
    );
  });

  it("sets requireManagerApproval=true when requested", async () => {
    await useCase.execute({
      name: "VPN",
      slug: "vpn",
      requireManagerApproval: true,
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ requireManagerApproval: true }),
      expect.anything(),
    );
  });

  it("passes assignees to repo.create", async () => {
    const assignees: AccessServiceAssigneeInput[] = [
      { userId: "u-1", role: "OWNER" },
      { userId: "u-2", role: "CYBERSECURITY" },
    ];

    await useCase.execute({ name: "Service", slug: "service", assignees });

    expect(repo.create).toHaveBeenCalledWith(expect.anything(), assignees);
  });

  it("passes empty assignees array when none provided", async () => {
    await useCase.execute({ name: "Service", slug: "service" });

    expect(repo.create).toHaveBeenCalledWith(expect.anything(), []);
  });

  it("throws ConflictError when slug already exists", async () => {
    vi.mocked(repo.findBySlug).mockResolvedValue({
      id: "existing",
    } as AccessServiceData);

    await expect(
      useCase.execute({ name: "New Service", slug: "it-vpn-access" }),
    ).rejects.toThrow(ConflictError);
  });

  it("ConflictError message includes the slug", async () => {
    vi.mocked(repo.findBySlug).mockResolvedValue({
      id: "x",
    } as AccessServiceData);

    await expect(
      useCase.execute({ name: "New Service", slug: "duplicate-slug" }),
    ).rejects.toThrow(/duplicate-slug/);
  });

  it("throws ConflictError when name already exists", async () => {
    vi.mocked(repo.findByName).mockResolvedValue({
      id: "existing",
    } as AccessServiceData);

    await expect(
      useCase.execute({ name: "Duplicate Name", slug: "unique-slug" }),
    ).rejects.toThrow(ConflictError);
  });

  it("does NOT call repo.create when slug conflicts", async () => {
    vi.mocked(repo.findBySlug).mockResolvedValue({
      id: "x",
    } as AccessServiceData);

    await expect(
      useCase.execute({ name: "Service", slug: "dup" }),
    ).rejects.toThrow();

    expect(repo.create).not.toHaveBeenCalled();
  });

  it("logs after successful creation", async () => {
    await useCase.execute({ name: "New SVC", slug: "new-svc" });

    expect(logger.info).toHaveBeenCalledWith(
      "access-service.create",
      expect.objectContaining({ slug: "new-svc" }),
    );
  });
});
