import { describe, it, expect, vi } from "vitest";
import { PrepareLineManagerUseCase } from "../prepare-line-manager.use-case";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";
import type { IMicrosoftGraphService } from "@/core/services/microsoft-graph.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { EnsureUserAccountsForPeopleUseCase } from "../ensure-user-accounts-for-people.use-case";

type FakePerson = {
  id: string;
  isActive: boolean;
  azureAdId: string | null;
  managerId: string | null;
  orgUnitId: string;
  update: (p: { managerId: string }) => void;
};

function person(overrides: Partial<FakePerson>): FakePerson {
  const p: FakePerson = {
    id: "me",
    isActive: true,
    azureAdId: "aad-me",
    managerId: null,
    orgUnitId: "unit",
    update: (changes) => Object.assign(p, changes),
    ...overrides,
  };
  return p;
}

function setup(opts: {
  me: FakePerson;
  graphManager?: { id: string } | null;
  graphError?: boolean;
  unitManagerId?: string | null;
  graph?: boolean;
}) {
  const byAzure: Record<string, { id: string }> = {
    "aad-boss": { id: "boss" },
  };
  const people = {
    findByUserId: vi.fn().mockResolvedValue(opts.me),
    findByAzureAdId: vi.fn(async (id: string) => byAzure[id] ?? null),
    update: vi.fn().mockResolvedValue(undefined),
  } as unknown as IPersonRepository;
  const orgUnits = {
    findById: vi
      .fn()
      .mockResolvedValue({ managerId: opts.unitManagerId ?? null }),
  } as unknown as IOrganizationUnitRepository;
  const ensure = {
    execute: vi.fn().mockResolvedValue({}),
  } as unknown as EnsureUserAccountsForPeopleUseCase;
  const graph = {
    fetchUserManager: opts.graphError
      ? vi.fn().mockRejectedValue(new Error("403"))
      : vi.fn().mockResolvedValue(opts.graphManager ?? null),
  } as unknown as IMicrosoftGraphService;
  const logger = { warn: vi.fn() } as unknown as ILoggerService;
  const useCase = new PrepareLineManagerUseCase(
    people,
    orgUnits,
    ensure,
    logger,
    opts.graph === false ? null : graph,
  );
  return { useCase, people, ensure, graph };
}

describe("PrepareLineManagerUseCase", () => {
  it("links the manager from Active Directory when none is stored", async () => {
    const me = person({});
    const { useCase, people, ensure } = setup({
      me,
      graphManager: { id: "aad-boss" },
      unitManagerId: "head",
    });
    const result = await useCase.execute({ userId: "u", ensureAccount: true });
    expect(result).toEqual({
      managerPersonId: "boss",
      linkedFromDirectory: true,
    });
    expect(people.update).toHaveBeenCalled();
    expect(ensure.execute).toHaveBeenCalledWith({
      personIds: ["boss"],
      requestedBy: undefined,
    });
  });

  it("keeps a stored manager without calling the directory", async () => {
    const { useCase, graph } = setup({ me: person({ managerId: "boss" }) });
    const result = await useCase.execute({ userId: "u", ensureAccount: false });
    expect(result.managerPersonId).toBe("boss");
    expect(graph.fetchUserManager).not.toHaveBeenCalled();
  });

  it("falls back to the unit manager when the directory fails", async () => {
    const { useCase, ensure } = setup({
      me: person({}),
      graphError: true,
      unitManagerId: "head",
    });
    const result = await useCase.execute({ userId: "u", ensureAccount: false });
    expect(result).toEqual({
      managerPersonId: "head",
      linkedFromDirectory: false,
    });
    expect(ensure.execute).not.toHaveBeenCalled();
  });

  it("works without Microsoft Graph configured", async () => {
    const { useCase } = setup({ me: person({}), graph: false });
    expect(
      (await useCase.execute({ userId: "u", ensureAccount: true }))
        .managerPersonId,
    ).toBeNull();
  });
});
