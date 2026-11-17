import { describe, expect, it, vi } from "vitest";
import { EnsureUserAccountsForPeopleUseCase } from "../ensure-user-accounts-for-people.use-case";

type PersonStub = {
  id: string;
  email: string;
  userId: string | null;
  isActive: boolean;
  isExcluded: boolean;
};

function setup(
  people: PersonStub[],
  existingUsers: Record<string, string> = {},
) {
  const personRepository = {
    findById: vi.fn(
      async (id: string) => people.find((p) => p.id === id) ?? null,
    ),
  };
  const userRepository = {
    findByEmail: vi.fn(async (email: string) =>
      existingUsers[email] ? { id: existingUsers[email] } : null,
    ),
  };
  const createUserForPerson = {
    execute: vi.fn(async ({ personId }: { personId: string }) => ({
      userId: `new-${personId}`,
    })),
  };
  const linkUserToPerson = { execute: vi.fn(async () => ({})) };
  const useCase = new EnsureUserAccountsForPeopleUseCase(
    personRepository as never,
    userRepository as never,
    createUserForPerson as never,
    linkUserToPerson as never,
    { info: vi.fn() } as never,
  );
  return { useCase, createUserForPerson, linkUserToPerson };
}

const person = (id: string, extra: Partial<PersonStub> = {}): PersonStub => ({
  id,
  email: `${id}@barq.test`,
  userId: null,
  isActive: true,
  isExcluded: false,
  ...extra,
});

describe("EnsureUserAccountsForPeopleUseCase", () => {
  it("uses, links or creates accounts, and never touches inactive or excluded people", async () => {
    const { useCase, createUserForPerson, linkUserToPerson } = setup(
      [
        person("signed-in", { userId: "u-1" }),
        person("same-email"),
        person("new"),
        person("left", { isActive: false }),
        person("excluded", { isExcluded: true }),
      ],
      { "same-email@barq.test": "u-existing" },
    );

    const result = await useCase.execute({
      personIds: [
        "signed-in",
        "same-email",
        "new",
        "new",
        "left",
        "excluded",
        "ghost",
      ],
      requestedBy: "admin",
    });

    expect(Object.fromEntries(result.userIdByPerson)).toEqual({
      "signed-in": "u-1",
      "same-email": "u-existing",
      new: "new-new",
    });
    expect(result.created).toEqual(["new"]);
    expect(result.linked).toEqual(["same-email"]);
    expect(result.skipped).toEqual([
      { personId: "left", reason: "inactive" },
      { personId: "excluded", reason: "excluded" },
      { personId: "ghost", reason: "not-found" },
    ]);
    expect(createUserForPerson.execute).toHaveBeenCalledTimes(1);
    expect(createUserForPerson.execute).toHaveBeenCalledWith({
      personId: "new",
      createdBy: "admin",
    });
    expect(linkUserToPerson.execute).toHaveBeenCalledWith({
      userId: "u-existing",
      personId: "same-email",
      linkedBy: "admin",
    });
  });
});
