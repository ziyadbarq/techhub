import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type {
  IAccessServiceRepository,
  AccessServiceData,
} from "@/core/repositories/workflow/access-service.repository.interface";
import type { AccessServiceRole } from "@/generated/prisma";

const HEADERS = [
  "name",
  "slug",
  "description",
  "requireManagerApproval",
  "instructions",
  "ownerEmails",
  "cybersecurityEmails",
  "implementerEmails",
];

function escapeCell(raw: unknown): string {
  const value = raw === null || raw === undefined ? "" : String(raw);
  // Formula injection prevention
  const safeValue = /^[=+\-@]/.test(value) ? `\t${value}` : value;
  // CSV quoting
  if (
    safeValue.includes(",") ||
    safeValue.includes('"') ||
    safeValue.includes("\n") ||
    safeValue.includes("\r")
  ) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }
  return safeValue;
}

function emailsForRole(
  service: AccessServiceData,
  role: AccessServiceRole,
): string {
  return (service.assignees ?? [])
    .filter((a) => a.role === role)
    .map((a) => a.userEmail)
    .join(";");
}

@injectable()
export class ExportAccessServicesUseCase {
  constructor(
    @inject(DI_TOKENS.IAccessServiceRepository)
    private readonly repo: IAccessServiceRepository,
  ) {}

  async execute(): Promise<Buffer> {
    const services = await this.repo.findAll();

    const rows: string[] = [HEADERS.join(",")];

    for (const svc of services) {
      rows.push(
        [
          escapeCell(svc.name),
          escapeCell(svc.slug),
          escapeCell(svc.description),
          escapeCell(svc.requireManagerApproval),
          escapeCell(svc.instructions),
          escapeCell(emailsForRole(svc, "OWNER")),
          escapeCell(emailsForRole(svc, "CYBERSECURITY")),
          escapeCell(emailsForRole(svc, "IMPLEMENTER")),
        ].join(","),
      );
    }

    return Buffer.from(rows.join("\r\n"), "utf-8");
  }

  /**
   * The services as the business sheet keeps them (same columns the roster
   * import reads), people by name, so an export can be edited and imported
   * back as it is.
   */
  /** Empty sheet in the same layout, with two example rows. */
  template(): string[][] {
    return [
      [...ROSTER_EXPORT_HEADERS],
      [
        "Example Portal",
        "Full Name Of Owner",
        "First Cyber Approver, Second Cyber Approver",
        "First Implementer, Second Implementer",
        "Yes",
      ],
      [
        "Another Service",
        "Full Name Of Owner",
        "First Cyber Approver",
        "First Implementer",
        "No",
      ],
    ];
  }

  async roster(): Promise<string[][]> {
    const services = await this.repo.findAll();
    const names = (svc: AccessServiceData, role: AccessServiceRole) =>
      (svc.assignees ?? [])
        .filter((a) => a.role === role)
        .map((a) => a.userName || a.userEmail)
        .join(", ");
    return [
      [...ROSTER_EXPORT_HEADERS],
      ...services.map((svc) => [
        svc.name,
        names(svc, "OWNER"),
        names(svc, "CYBERSECURITY"),
        names(svc, "IMPLEMENTER"),
        svc.requireManagerApproval ? "Yes" : "No",
      ]),
    ];
  }
}

export const ROSTER_EXPORT_HEADERS = [
  "Title",
  "Service Owner",
  "Cybersecurity Owner",
  "Service Implementer",
  "Manager Approval",
] as const;
