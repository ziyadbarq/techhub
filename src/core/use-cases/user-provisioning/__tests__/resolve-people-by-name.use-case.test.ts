import { describe, it, expect, vi } from "vitest";
import { ResolvePeopleByNameUseCase } from "../resolve-people-by-name.use-case";
import type { IAccessServiceRepository } from "@/core/repositories/workflow/access-service.repository.interface";
import type { EnsureUserAccountsForPeopleUseCase } from "../ensure-user-accounts-for-people.use-case";
import type { ILoggerService } from "@/core/services/logger.service.interface";

const people = [
  { personId: "p-sara", userId: "u-sara", names: ["Sara Ali Alqahtani"] },
  { personId: "p-fahad", userId: null, names: ["Fahad Saad Alswhaim"] },
  { personId: "p-left", userId: null, names: ["Old Employee"] },
  { personId: "p-a1", userId: null, names: ["Abdullah Ali Alshahrani"] },
  { personId: "p-a2", userId: null, names: ["Abdullah Ali Alshahrani"] },
];

function setup() {
  const repo = {
    listActivePeopleNames: vi.fn().mockResolvedValue(people),
  } as unknown as IAccessServiceRepository;
  const ensure = {
    execute: vi.fn().mockImplementation(async ({ personIds }) => ({
      userIdByPerson: new Map(
        (personIds as string[])
          .filter((id) => id !== "p-left")
          .map((id) => [id, id === "p-sara" ? "u-sara" : `u-new-${id}`]),
      ),
      created: (personIds as string[]).filter((id) => id === "p-fahad"),
      linked: [],
      skipped: (personIds as string[])
        .filter((id) => id === "p-left")
        .map((personId) => ({ personId, reason: "excluded" as const })),
    })),
  } as unknown as EnsureUserAccountsForPeopleUseCase;
  const logger = { info: vi.fn() } as unknown as ILoggerService;
  return {
    useCase: new ResolvePeopleByNameUseCase(repo, ensure, logger),
    ensure,
  };
}

describe("ResolvePeopleByNameUseCase", () => {
  it("returns accounts for matched people and creates missing ones", async () => {
    const { useCase, ensure } = setup();
    const result = await useCase.execute({
      names: ["sara ali alqahtani", "Fahad Saad Alswhaim", "Nobody Here"],
      requestedBy: "admin",
    });
    expect(result).toEqual([
      {
        name: "sara ali alqahtani",
        status: "found",
        userId: "u-sara",
        created: false,
      },
      {
        name: "Fahad Saad Alswhaim",
        status: "found",
        userId: "u-new-p-fahad",
        created: true,
      },
      { name: "Nobody Here", status: "unknown" },
    ]);
    expect(ensure.execute).toHaveBeenCalledWith({
      personIds: ["p-sara", "p-fahad"],
      requestedBy: "admin",
    });
  });

  it("never guesses between people with the same name", async () => {
    const { useCase } = setup();
    expect(
      await useCase.execute({ names: ["Abdullah Ali Alshahrani"] }),
    ).toEqual([
      { name: "Abdullah Ali Alshahrani", status: "ambiguous", count: 2 },
    ]);
  });

  it("reports people who can't be given an account", async () => {
    const { useCase } = setup();
    expect(await useCase.execute({ names: ["Old Employee"] })).toEqual([
      { name: "Old Employee", status: "skipped", reason: "excluded" },
    ]);
  });

  it("refuses very long lists", async () => {
    const { useCase } = setup();
    const names = Array.from({ length: 101 }, (_, i) => `Person ${i}`);
    await expect(useCase.execute({ names })).rejects.toThrow(/At most 100/);
  });
});
