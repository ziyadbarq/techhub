import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImportAccessServicesUseCase } from "../import-access-services.use-case";
import {
  isRosterHeader,
  PersonNameIndex,
  slugifyServiceName,
  splitNames,
} from "../roster";
import type {
  AccessServiceData,
  IAccessServiceRepository,
} from "@/core/repositories/workflow/access-service.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";

const PEOPLE = [
  {
    personId: "p-wahab",
    userId: "u-wahab",
    names: ["Abdullah Mohammed Bin Abdulwahab"],
  },
  {
    personId: "p-tahani",
    userId: "u-tahani",
    names: ["Tahani Abdulaziz Almuwayziri"],
  },
  { personId: "p-manal", userId: "u-manal", names: ["Manal Zaid Alkhaldi"] },
  { personId: "p-hoor", userId: "u-hoor", names: ["Hoor Fareed Aldouaiji"] },
  { personId: "p-njoud", userId: "u-njoud", names: ["Njoud Fahad Algifari"] },
  {
    personId: "p-fagir",
    userId: "u-fagir",
    names: ["Ahmed Salah Aldin Fagir"],
  },
  // In Active Directory, never signed in to TechHub.
  { personId: "p-sara", userId: null, names: ["Sara Abdullah Alarifi"] },
  // Two active people share this name.
  {
    personId: "p-ahmed-1",
    userId: "u-ahmed-1",
    names: ["Ahmed Abdullah Mohammed"],
  },
  {
    personId: "p-ahmed-2",
    userId: "u-ahmed-2",
    names: ["Ahmed Abdullah Mohammed"],
  },
];

const csv = (...lines: string[]) => Buffer.from(lines.join("\r\n"), "utf-8");
const ROSTER_HEADER =
  "Title,Service Owner,Cybersecurity Owner,Service Implementer";

function setup(existing: Partial<AccessServiceData>[] = []) {
  const repo = {
    findBySlug: vi.fn(
      async (slug: string) =>
        (existing.find((s) => s.slug === slug) as AccessServiceData) ?? null,
    ),
    listActivePeopleNames: vi.fn(async () => PEOPLE),
    isActiveUserEmail: vi.fn(async (email: string) => email === "a@barq.com"),
    findActiveUserIdByEmail: vi.fn(async (email: string) =>
      email === "a@barq.com" ? "u-email" : null,
    ),
    create: vi.fn(async (data) => data),
    update: vi.fn(async (_id, data) => data),
  } as unknown as IAccessServiceRepository;
  const logger = { info: vi.fn() } as unknown as ILoggerService;
  const ensureAccounts = {
    execute: vi.fn(async ({ personIds }: { personIds: string[] }) => ({
      userIdByPerson: new Map(personIds.map((id) => [id, `new-${id}`])),
      created: [...personIds],
      linked: [],
      skipped: [],
    })),
  };
  let seq = 0;
  const useCase = new ImportAccessServicesUseCase(
    repo,
    { generateId: () => `svc-${++seq}` },
    logger,
    ensureAccounts as unknown as ConstructorParameters<
      typeof ImportAccessServicesUseCase
    >[3],
  );
  return { repo, useCase, ensureAccounts };
}

describe("roster helpers", () => {
  it("recognises the business sheet header in any case, with a BOM", () => {
    expect(
      isRosterHeader([
        "\uFEFFTitle",
        "service owner",
        "CYBERSECURITY OWNER",
        "Service  Implementer",
      ]),
    ).toBe(true);
    expect(isRosterHeader(["name", "slug"])).toBe(false);
  });

  it("makes stable slugs from titles", () => {
    expect(slugifyServiceName("SFTP Portal – Reconciliation")).toBe(
      "sftp-portal-reconciliation",
    );
    expect(slugifyServiceName("Retool_ Business Merchant")).toBe(
      "retool-business-merchant",
    );
    expect(slugifyServiceName("Gitlab")).toBe("gitlab");
  });

  it("splits names and ignores spacing and case differences", () => {
    expect(
      splitNames(
        "Manal Zaid Alkhaldi, Hoor Fareed Aldouaiji,manal zaid alkhaldi",
      ),
    ).toEqual(["Manal Zaid Alkhaldi", "Hoor Fareed Aldouaiji"]);
    const index = new PersonNameIndex(PEOPLE);
    expect(index.resolve("Ahmed SalahAldin Fagir")).toEqual({
      status: "found",
      personId: "p-fagir",
      userId: "u-fagir",
    });
    expect(index.resolve("Ahmed Abdullah Mohammed")).toEqual({
      status: "ambiguous",
      count: 2,
    });
    expect(index.resolve("Nobody Here")).toEqual({ status: "unknown" });
  });
});

describe("ImportAccessServicesUseCase — business roster", () => {
  beforeEach(() => vi.clearAllMocks());

  const file = csv(
    ROSTER_HEADER,
    'SFTP Portal – Reconciliation,Abdullah Mohammed Bin Abdulwahab,Tahani Abdulaziz Almuwayziri,"Manal Zaid Alkhaldi, Hoor Fareed Aldouaiji"',
    'Odoo Permission,,"Tahani Abdulaziz Almuwayziri, Unknown Person","Ahmed Abdullah Mohammed, Manal Zaid Alkhaldi"',
    "Tableau,Njoud Fahad Algifari,Tahani Abdulaziz Almuwayziri,Hoor Fareed Aldouaiji",
    "Tableau,Njoud Fahad Algifari,Tahani Abdulaziz Almuwayziri,Hoor Fareed Aldouaiji",
    "Gitlab,Njoud Fahad Algifari,Tahani Abdulaziz Almuwayziri,Hoor Fareed Aldouaiji",
  );

  it("previews creates/updates and lists what needs checking", async () => {
    const { useCase, repo } = setup([
      { id: "svc-gitlab", slug: "gitlab", requireManagerApproval: false },
    ]);
    const result = await useCase.execute({ csvBytes: file, dryRun: true });

    expect(result.errors).toEqual([]);
    expect(result.importedCount).toBe(4);
    expect(result.created).toBe(3);
    expect(result.updated).toBe(1);
    const messages = (result.warnings ?? []).map(
      (w) => `${w.row}|${w.column}|${w.message}`,
    );
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^3\|Service owner\|.*has no service owner/),
        expect.stringMatching(
          /^3\|Cybersecurity owner\|"Unknown Person" isn't an active/,
        ),
        expect.stringMatching(
          /^3\|Service implementer\|"Ahmed Abdullah Mohammed" matches 2/,
        ),
        expect.stringMatching(/^5\|Title\|"Tableau" repeats row 4; skipped/),
      ]),
    );
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("creates new services with manager approval on and replaces people on existing ones", async () => {
    const { useCase, repo } = setup([
      { id: "svc-gitlab", slug: "gitlab", requireManagerApproval: false },
    ]);
    const dry = await useCase.execute({ csvBytes: file, dryRun: true });
    const result = await useCase.execute({
      csvBytes: file,
      confirmedHash: dry.contentHash,
      importedById: "admin",
    });

    expect(result.importedCount).toBe(4);
    expect(repo.create).toHaveBeenCalledTimes(3);
    const [sftp, sftpPeople] = vi.mocked(repo.create).mock.calls[0]!;
    expect(sftp).toMatchObject({
      name: "SFTP Portal – Reconciliation",
      slug: "sftp-portal-reconciliation",
      requireManagerApproval: true,
      isActive: true,
    });
    expect(sftpPeople).toEqual([
      { userId: "u-wahab", role: "OWNER" },
      { userId: "u-tahani", role: "CYBERSECURITY" },
      { userId: "u-manal", role: "IMPLEMENTER" },
      { userId: "u-hoor", role: "IMPLEMENTER" },
    ]);

    // Existing GitLab: renamed to the sheet's title, people replaced,
    // manager-approval setting untouched (the sheet doesn't say).
    const [id, data, people] = vi.mocked(repo.update).mock.calls[0]!;
    expect(id).toBe("svc-gitlab");
    expect(data).toEqual({ name: "Gitlab", updatedById: "admin" });
    expect(people).toHaveLength(3);
  });

  it("honours an optional Manager Approval column", async () => {
    const { useCase, repo } = setup();
    await useCase.execute({
      csvBytes: csv(
        ROSTER_HEADER + ",Manager Approval",
        "VPN,Njoud Fahad Algifari,Tahani Abdulaziz Almuwayziri,Hoor Fareed Aldouaiji,No",
      ),
    });
    expect(vi.mocked(repo.create).mock.calls[0]![0]).toMatchObject({
      requireManagerApproval: false,
    });
  });

  it("refuses two different rows for the same service", async () => {
    const { useCase } = setup();
    const result = await useCase.execute({
      csvBytes: csv(
        ROSTER_HEADER,
        "Tableau,Njoud Fahad Algifari,Tahani Abdulaziz Almuwayziri,Hoor Fareed Aldouaiji",
        "Tableau,Manal Zaid Alkhaldi,Tahani Abdulaziz Almuwayziri,Hoor Fareed Aldouaiji",
      ),
      dryRun: true,
    });
    expect(result.errors[0]?.message).toMatch(/different people/);
  });
});

describe("ImportAccessServicesUseCase — email template", () => {
  it("accepts the downloadable template (headers in their original case)", async () => {
    const { useCase, repo } = setup();
    const result = await useCase.execute({
      csvBytes: csv(
        "name,slug,description,requireManagerApproval,instructions,ownerEmails,cybersecurityEmails,implementerEmails",
        '"IT VPN Access","it-vpn-access","VPN",false,"",a@barq.com,a@barq.com,a@barq.com',
      ),
    });
    expect(result.errors).toEqual([]);
    expect(vi.mocked(repo.create).mock.calls[0]![0]).toMatchObject({
      slug: "it-vpn-access",
      requireManagerApproval: false,
    });
  });
});

describe("ImportAccessServicesUseCase — people who haven't signed in", () => {
  const file = csv(
    ROSTER_HEADER,
    "OCI SRE,Sara Abdullah Alarifi,Tahani Abdulaziz Almuwayziri,Sara Abdullah Alarifi",
  );

  it("counts the accounts it would create without creating them", async () => {
    const { useCase, ensureAccounts } = setup();
    const result = await useCase.execute({ csvBytes: file, dryRun: true });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.newAccounts).toBe(1);
    expect(ensureAccounts.execute).not.toHaveBeenCalled();
  });

  it("creates their account on import and assigns it", async () => {
    const { useCase, ensureAccounts, repo } = setup();
    const result = await useCase.execute({
      csvBytes: file,
      importedById: "admin",
    });
    expect(ensureAccounts.execute).toHaveBeenCalledWith({
      personIds: ["p-sara"],
      requestedBy: "admin",
    });
    expect(result.newAccounts).toBe(1);
    expect(vi.mocked(repo.create).mock.calls[0]![1]).toEqual([
      { userId: "new-p-sara", role: "OWNER" },
      { userId: "u-tahani", role: "CYBERSECURITY" },
      { userId: "new-p-sara", role: "IMPLEMENTER" },
    ]);
  });
});
