import { describe, it, expect, vi, beforeEach } from "vitest";
import { AccessServiceRoleAssigneeResolver } from "../access-service-role.resolver";
import { ConfigurationError } from "@/core/domain/workflow";
import type { IAccessServiceSnapshotRepository } from "@/core/repositories/workflow/access-service.repository.interface";
import type { ExecCtx } from "@/core/repositories/workflow";

function makeSnapshotRepo(
  overrides: Partial<IAccessServiceSnapshotRepository> = {},
): IAccessServiceSnapshotRepository {
  return {
    createSnapshot: vi.fn(),
    findByRequestAndField: vi.fn(),
    findActiveAssigneeIdsByRole: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as IAccessServiceSnapshotRepository;
}

function makeExec(
  fieldValues: Record<string, unknown> = {},
): ExecCtx & { requesterId: string } {
  return {
    requestId: "req-001",
    requesterId: "user-requester",
    stepInstanceId: "step-inst-001",
    fieldValues,
    ctx: { userId: "user-requester", system: undefined },
    tx: {} as ExecCtx["tx"],
  };
}

describe("AccessServiceRoleAssigneeResolver", () => {
  let snapshotRepo: IAccessServiceSnapshotRepository;
  let resolver: AccessServiceRoleAssigneeResolver;

  beforeEach(() => {
    snapshotRepo = makeSnapshotRepo();
    resolver = new AccessServiceRoleAssigneeResolver(snapshotRepo);
  });

  it("returns [] when spec.kind is not ACCESS_SERVICE_ROLE", async () => {
    const result = await resolver.resolve({ kind: "REQUESTER" }, makeExec());
    expect(result).toEqual([]);
    expect(snapshotRepo.findActiveAssigneeIdsByRole).not.toHaveBeenCalled();
  });

  it("returns owner user IDs from the snapshot", async () => {
    vi.mocked(snapshotRepo.findActiveAssigneeIdsByRole).mockResolvedValue([
      "owner-1",
      "owner-2",
    ]);

    const result = await resolver.resolve(
      {
        kind: "ACCESS_SERVICE_ROLE",
        serviceSnapshotKey: "service_field",
        role: "OWNER",
      },
      makeExec(),
    );

    expect(result).toEqual(["owner-1", "owner-2"]);
    expect(snapshotRepo.findActiveAssigneeIdsByRole).toHaveBeenCalledWith(
      "req-001",
      "service_field",
      "OWNER",
      expect.anything(),
    );
  });

  it("returns cybersecurity user IDs from the snapshot", async () => {
    vi.mocked(snapshotRepo.findActiveAssigneeIdsByRole).mockResolvedValue([
      "sec-1",
    ]);

    const result = await resolver.resolve(
      {
        kind: "ACCESS_SERVICE_ROLE",
        serviceSnapshotKey: "service_field",
        role: "CYBERSECURITY",
      },
      makeExec(),
    );

    expect(result).toEqual(["sec-1"]);
  });

  it("returns implementer user IDs from the snapshot", async () => {
    vi.mocked(snapshotRepo.findActiveAssigneeIdsByRole).mockResolvedValue([
      "impl-1",
      "impl-2",
      "impl-3",
    ]);

    const result = await resolver.resolve(
      {
        kind: "ACCESS_SERVICE_ROLE",
        serviceSnapshotKey: "service_field",
        role: "IMPLEMENTER",
      },
      makeExec(),
    );

    expect(result).toEqual(["impl-1", "impl-2", "impl-3"]);
  });

  it("throws ConfigurationError when snapshot has 0 users for the role", async () => {
    vi.mocked(snapshotRepo.findActiveAssigneeIdsByRole).mockResolvedValue([]);

    await expect(
      resolver.resolve(
        {
          kind: "ACCESS_SERVICE_ROLE",
          serviceSnapshotKey: "service_field",
          role: "OWNER",
        },
        makeExec(),
      ),
    ).rejects.toThrow(ConfigurationError);
  });

  it("ConfigurationError message names the role and field key", async () => {
    vi.mocked(snapshotRepo.findActiveAssigneeIdsByRole).mockResolvedValue([]);

    await expect(
      resolver.resolve(
        {
          kind: "ACCESS_SERVICE_ROLE",
          serviceSnapshotKey: "it_service",
          role: "CYBERSECURITY",
        },
        makeExec(),
      ),
    ).rejects.toThrow(/CYBERSECURITY.*it_service/);
  });

  it("resolves against the correct request ID from exec context", async () => {
    vi.mocked(snapshotRepo.findActiveAssigneeIdsByRole).mockResolvedValue([
      "u-1",
    ]);

    const exec = makeExec();
    exec.requestId = "req-special-99";

    await resolver.resolve(
      {
        kind: "ACCESS_SERVICE_ROLE",
        serviceSnapshotKey: "svc",
        role: "IMPLEMENTER",
      },
      exec,
    );

    expect(snapshotRepo.findActiveAssigneeIdsByRole).toHaveBeenCalledWith(
      "req-special-99",
      "svc",
      "IMPLEMENTER",
      expect.anything(),
    );
  });

  it("service deactivated after submission — snapshot still resolves", async () => {
    // Snapshot rows survive service deactivation — no live catalog query
    vi.mocked(snapshotRepo.findActiveAssigneeIdsByRole).mockResolvedValue([
      "owner-still-there",
    ]);

    const result = await resolver.resolve(
      {
        kind: "ACCESS_SERVICE_ROLE",
        serviceSnapshotKey: "svc",
        role: "OWNER",
      },
      makeExec(),
    );

    expect(result).toEqual(["owner-still-there"]);
  });
});
