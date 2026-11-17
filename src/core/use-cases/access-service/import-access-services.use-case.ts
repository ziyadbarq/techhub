import { injectable, inject } from "inversify";
import { createHash } from "crypto";
import { DI_TOKENS } from "@/di/types";
import type {
  IAccessServiceRepository,
  AccessServiceAssigneeInput,
} from "@/core/repositories/workflow/access-service.repository.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { AccessServiceRole } from "@/generated/prisma";
import type { EnsureUserAccountsForPeopleUseCase } from "@/core/use-cases/user-provisioning/ensure-user-accounts-for-people.use-case";
import {
  isRosterHeader,
  normalizeHeader,
  parseYesNo,
  PersonNameIndex,
  ROSTER_COLUMNS,
  slugifyServiceName,
  splitNames,
} from "./roster";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_ROWS = 500;

/** Template format: people by email. Compared case-insensitively. */
const REQUIRED_COLUMNS = [
  "name",
  "slug",
  "description",
  "requireManagerApproval",
  "instructions",
  "ownerEmails",
  "cybersecurityEmails",
  "implementerEmails",
] as const;

const ROLES: ReadonlyArray<{ role: AccessServiceRole; label: string }> = [
  { role: "OWNER", label: "Service owner" },
  { role: "CYBERSECURITY", label: "Cybersecurity owner" },
  { role: "IMPLEMENTER", label: "Service implementer" },
];

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ImportRowError {
  row: number;
  column?: string;
  message: string;
}

export interface ImportAccessServicesResult {
  importedCount: number;
  errors: ImportRowError[];
  /** Things to look at that don't block the import (e.g. a name not found). */
  warnings?: ImportRowError[];
  /** Of importedCount: services that will be / were created vs updated. */
  created?: number;
  updated?: number;
  /**
   * People from Active Directory who have never signed in and will get (or
   * got) a TechHub account so they can be assigned. Microsoft sign-in links
   * to it on their first login.
   */
  newAccounts?: number;
  /** Opaque token from dry-run; pass back to confirm a real import of identical content */
  contentHash?: string;
}

export interface ImportAccessServicesRequest {
  csvBytes: Buffer | Uint8Array;
  /** When true, validate only — no DB writes */
  dryRun?: boolean;
  /** Token returned by a prior dry-run; import is rejected if content changed */
  confirmedHash?: string;
  importedById?: string | null;
}

// ─── Internal types ───────────────────────────────────────────────────────────

type People = Record<AccessServiceRole, string[]>;

/** Before accounts are created: a known user, or a person who has none yet. */
interface PendingAssignee {
  role: AccessServiceRole;
  userId?: string;
  personId?: string;
}

interface ParsedRow {
  lineNumber: number;
  name: string;
  slug: string;
  /** undefined = not in the file: keep the stored value (default on create). */
  description?: string | null;
  requireManagerApproval?: boolean;
  instructions?: string | null;
  emails: People;
  names: People;
}

interface ParseResult {
  rows: ParsedRow[];
  errors: ImportRowError[];
  warnings: ImportRowError[];
  roster: boolean;
}

const emptyPeople = (): People => ({
  OWNER: [],
  CYBERSECURITY: [],
  IMPLEMENTER: [],
});

// ─── Use Case ─────────────────────────────────────────────────────────────────

@injectable()
export class ImportAccessServicesUseCase {
  constructor(
    @inject(DI_TOKENS.IAccessServiceRepository)
    private readonly repo: IAccessServiceRepository,
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.EnsureUserAccountsForPeopleUseCase)
    private readonly ensureAccounts: EnsureUserAccountsForPeopleUseCase,
  ) {}

  async execute(
    request: ImportAccessServicesRequest,
  ): Promise<ImportAccessServicesResult> {
    const bytes = Buffer.isBuffer(request.csvBytes)
      ? request.csvBytes
      : Buffer.from(request.csvBytes);

    if (bytes.byteLength > MAX_FILE_BYTES) {
      return {
        importedCount: 0,
        errors: [{ row: 0, message: "File exceeds the 2MB size limit." }],
      };
    }

    const contentHash = createHash("sha256").update(bytes).digest("hex");

    // If a confirmedHash was provided, verify it matches the actual file content
    if (request.confirmedHash && request.confirmedHash !== contentHash) {
      return {
        importedCount: 0,
        errors: [
          {
            row: 0,
            message:
              "File content changed since dry-run validation. Please re-upload.",
          },
        ],
      };
    }

    const parsed = parseCsv(bytes.toString("utf-8"));
    const warnings = [...parsed.warnings];

    if (parsed.errors.length > 0) {
      return { importedCount: 0, errors: parsed.errors, warnings, contentHash };
    }

    if (parsed.rows.length > MAX_ROWS) {
      return {
        importedCount: 0,
        errors: [
          {
            row: 0,
            message: `Import exceeds the ${MAX_ROWS}-row limit (got ${parsed.rows.length}).`,
          },
        ],
        contentHash,
      };
    }

    const { rows, errors } = parsed.roster
      ? this.dropRosterDuplicates(parsed.rows, warnings)
      : { rows: parsed.rows, errors: this.findDuplicates(parsed.rows) };
    if (errors.length > 0) {
      return { importedCount: 0, errors, warnings, contentHash };
    }

    const emailErrors = await this.checkEmails(rows);
    if (emailErrors.length > 0) {
      return { importedCount: 0, errors: emailErrors, warnings, contentHash };
    }

    const index = parsed.roster
      ? new PersonNameIndex(await this.repo.listActivePeopleNames())
      : null;
    const resolved = new Map<number, PendingAssignee[]>();
    for (const row of rows) {
      resolved.set(
        row.lineNumber,
        await this.resolveAssignees(row, index, warnings),
      );
    }

    const existing = new Map<number, string>();
    for (const row of rows) {
      const found = await this.repo.findBySlug(row.slug);
      if (found) existing.set(row.lineNumber, found.id);
    }
    const updated = existing.size;
    const created = rows.length - updated;
    const withoutAccount = new Set(
      [...resolved.values()]
        .flat()
        .filter((a) => !a.userId)
        .map((a) => a.personId!),
    );
    warnings.sort((x, y) => x.row - y.row);

    if (request.dryRun) {
      return {
        importedCount: rows.length,
        errors: [],
        warnings,
        created,
        updated,
        newAccounts: withoutAccount.size,
        contentHash,
      };
    }

    const accounts = withoutAccount.size
      ? await this.ensureAccounts.execute({
          personIds: [...withoutAccount],
          requestedBy: request.importedById ?? null,
        })
      : null;
    const toAssignees = (pending: PendingAssignee[]) => {
      const seen = new Set<string>();
      const out: AccessServiceAssigneeInput[] = [];
      for (const a of pending) {
        const userId =
          a.userId ?? accounts?.userIdByPerson.get(a.personId!) ?? null;
        if (!userId || seen.has(`${a.role}:${userId}`)) continue;
        seen.add(`${a.role}:${userId}`);
        out.push({ userId, role: a.role });
      }
      return out;
    };

    for (const row of rows) {
      await this.upsertRow(
        row,
        existing.get(row.lineNumber) ?? null,
        toAssignees(resolved.get(row.lineNumber) ?? []),
        request.importedById ?? null,
      );
    }

    this.logger.info("access-service.import", {
      count: rows.length,
      created,
      updated,
      warnings: warnings.length,
      newAccounts: accounts?.created.length ?? 0,
      format: parsed.roster ? "roster" : "template",
      importedById: request.importedById,
    });
    return {
      importedCount: rows.length,
      errors: [],
      warnings,
      created,
      updated,
      newAccounts: accounts?.created.length ?? 0,
    };
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  private findDuplicates(rows: ParsedRow[]): ImportRowError[] {
    const errors: ImportRowError[] = [];
    const slugsSeen = new Map<string, number>();
    const namesSeen = new Map<string, number>();

    for (const row of rows) {
      const sl = row.slug.toLowerCase();
      if (slugsSeen.has(sl)) {
        errors.push({
          row: row.lineNumber,
          column: "slug",
          message: `Duplicate slug "${sl}" (also on row ${slugsSeen.get(sl)}).`,
        });
      } else {
        slugsSeen.set(sl, row.lineNumber);
      }

      const nm = row.name.toLowerCase();
      if (namesSeen.has(nm)) {
        errors.push({
          row: row.lineNumber,
          column: "name",
          message: `Duplicate name "${row.name}" (also on row ${namesSeen.get(nm)}).`,
        });
      } else {
        namesSeen.set(nm, row.lineNumber);
      }
    }
    return errors;
  }

  /**
   * Business sheets repeat services now and then. An identical repeat is
   * skipped with a warning; two different rows for one service are an error.
   */
  private dropRosterDuplicates(
    rows: ParsedRow[],
    warnings: ImportRowError[],
  ): { rows: ParsedRow[]; errors: ImportRowError[] } {
    const first = new Map<string, ParsedRow>();
    const kept: ParsedRow[] = [];
    const errors: ImportRowError[] = [];
    for (const row of rows) {
      const earlier = first.get(row.slug);
      if (!earlier) {
        first.set(row.slug, row);
        kept.push(row);
        continue;
      }
      if (samePeople(earlier, row)) {
        warnings.push({
          row: row.lineNumber,
          column: "Title",
          message: `"${row.name}" repeats row ${earlier.lineNumber}; skipped.`,
        });
      } else {
        errors.push({
          row: row.lineNumber,
          column: "Title",
          message: `"${row.name}" is also on row ${earlier.lineNumber} with different people. Keep one row per service.`,
        });
      }
    }
    return { rows: kept, errors };
  }

  private async checkEmails(rows: ParsedRow[]): Promise<ImportRowError[]> {
    const errors: ImportRowError[] = [];
    for (const row of rows) {
      for (const { role } of ROLES) {
        for (const email of row.emails[role]) {
          if (!(await this.repo.isActiveUserEmail(email))) {
            errors.push({
              row: row.lineNumber,
              message: `Unknown or inactive user email "${email}".`,
            });
          }
        }
      }
    }
    return errors;
  }

  private async resolveAssignees(
    row: ParsedRow,
    index: PersonNameIndex | null,
    warnings: ImportRowError[],
  ): Promise<PendingAssignee[]> {
    const result: PendingAssignee[] = [];
    for (const { role, label } of ROLES) {
      const before = result.length;
      for (const email of row.emails[role]) {
        const userId = await this.repo.findActiveUserIdByEmail(email);
        if (userId) result.push({ role, userId });
      }
      for (const name of row.names[role]) {
        const match = index?.resolve(name) ?? { status: "unknown" as const };
        if (match.status === "found") {
          result.push({
            role,
            userId: match.userId ?? undefined,
            personId: match.personId,
          });
        } else if (match.status === "ambiguous") {
          warnings.push({
            row: row.lineNumber,
            column: label,
            message: `"${name}" matches ${match.count} active people; not assigned. Set them on the service by hand.`,
          });
        } else {
          warnings.push({
            row: row.lineNumber,
            column: label,
            message: `"${name}" isn't an active person in Persons (Active Directory); not assigned.`,
          });
        }
      }
      if (index && result.length === before) {
        warnings.push({
          row: row.lineNumber,
          column: label,
          message: `"${row.name}" has no ${label.toLowerCase()}. Requests for it will stop at that step until someone is assigned.`,
        });
      }
    }
    return result;
  }

  // ─── Upsert ───────────────────────────────────────────────────────────────

  private async upsertRow(
    row: ParsedRow,
    existingId: string | null,
    assignees: AccessServiceAssigneeInput[],
    importedById: string | null,
  ): Promise<void> {
    if (existingId) {
      await this.repo.update(
        existingId,
        {
          name: row.name,
          ...(row.description !== undefined
            ? { description: row.description }
            : {}),
          ...(row.requireManagerApproval !== undefined
            ? { requireManagerApproval: row.requireManagerApproval }
            : {}),
          ...(row.instructions !== undefined
            ? { instructions: row.instructions }
            : {}),
          updatedById: importedById,
        },
        assignees,
      );
      return;
    }
    await this.repo.create(
      {
        id: this.idGenerator.generateId(),
        name: row.name,
        slug: row.slug,
        description: row.description ?? null,
        isActive: true,
        // A new service asks the line manager unless the file says otherwise.
        requireManagerApproval: row.requireManagerApproval ?? true,
        instructions: row.instructions ?? null,
        createdById: importedById,
        updatedById: importedById,
      },
      assignees,
    );
  }
}

function samePeople(a: ParsedRow, b: ParsedRow): boolean {
  const key = (row: ParsedRow) =>
    ROLES.map(({ role }) =>
      [...row.names[role], ...row.emails[role]]
        .map((v) => v.toLowerCase())
        .sort()
        .join("|"),
    ).join("#");
  return key(a) === key(b);
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

/** Parses either the email template or the business roster (detected by header). */
export function parseCsv(text: string): ParseResult {
  const errors: ImportRowError[] = [];
  const warnings: ImportRowError[] = [];
  const rows: ParsedRow[] = [];

  const lines = splitCsvLines(text);
  if (lines.length < 2) {
    errors.push({ row: 0, message: "The file has no data rows." });
    return { rows, errors, warnings, roster: false };
  }

  const headers = parseCsvLine(lines[0]!).map(normalizeHeader);
  const roster = isRosterHeader(headers);
  if (!roster) {
    const missing = REQUIRED_COLUMNS.filter(
      (c) => !headers.includes(c.toLowerCase()),
    );
    if (missing.length > 0) {
      errors.push({
        row: 1,
        message: `Missing required columns: ${missing.join(", ")}. Use the template, or a sheet with Title, Service Owner, Cybersecurity Owner and Service Implementer.`,
      });
      return { rows, errors, warnings, roster };
    }
  }

  const colIdx = (name: string) => headers.indexOf(name.toLowerCase());

  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1;
    const cells = parseCsvLine(lines[i]!);
    if (cells.every((cell) => !cell.trim())) continue;
    const get = (col: string) => {
      const at = colIdx(col);
      return at < 0 ? "" : (cells[at] ?? "").trim();
    };

    if (roster) {
      const name = get(ROSTER_COLUMNS.title).replace(/\s+/g, " ");
      if (!name) {
        errors.push({
          row: lineNumber,
          column: "Title",
          message: "Title is required.",
        });
        continue;
      }
      const slug = slugifyServiceName(name);
      if (!slug) {
        errors.push({
          row: lineNumber,
          column: "Title",
          message: `"${name}" needs at least one English letter or digit.`,
        });
        continue;
      }
      const approvalCell = get(ROSTER_COLUMNS.managerApproval);
      const requireManagerApproval = approvalCell
        ? parseYesNo(approvalCell)
        : undefined;
      if (approvalCell && requireManagerApproval === undefined) {
        warnings.push({
          row: lineNumber,
          column: "Manager Approval",
          message: `"${approvalCell}" isn't yes or no; left as it is.`,
        });
      }
      rows.push({
        lineNumber,
        name,
        slug,
        requireManagerApproval,
        emails: emptyPeople(),
        names: {
          OWNER: splitNames(get(ROSTER_COLUMNS.owner)),
          CYBERSECURITY: splitNames(get(ROSTER_COLUMNS.cybersecurity)),
          IMPLEMENTER: splitNames(get(ROSTER_COLUMNS.implementer)),
        },
      });
      continue;
    }

    const name = get("name");
    const slug = get("slug").toLowerCase();
    const description = get("description") || null;
    const rawBool = get("requireManagerApproval").toLowerCase();
    const instructions = get("instructions") || null;

    if (!name) {
      errors.push({
        row: lineNumber,
        column: "name",
        message: "name is required.",
      });
      continue;
    }
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      errors.push({
        row: lineNumber,
        column: "slug",
        message: `slug "${slug}" must match /^[a-z0-9-]+$/.`,
      });
      continue;
    }
    if (rawBool !== "true" && rawBool !== "false") {
      errors.push({
        row: lineNumber,
        column: "requireManagerApproval",
        message: `requireManagerApproval must be "true" or "false" (got "${rawBool}").`,
      });
      continue;
    }

    rows.push({
      lineNumber,
      name,
      slug,
      description,
      requireManagerApproval: rawBool === "true",
      instructions,
      emails: {
        OWNER: splitEmails(get("ownerEmails")),
        CYBERSECURITY: splitEmails(get("cybersecurityEmails")),
        IMPLEMENTER: splitEmails(get("implementerEmails")),
      },
      names: emptyPeople(),
    });
  }

  return { rows, errors, warnings, roster };
}

/** Split CSV into logical lines, respecting quoted fields that span lines */
function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const ch of text) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (current) lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Parse a single CSV line into cells, handling double-quoted fields */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(cell);
      cell = "";
    } else {
      cell += ch;
    }
  }
  cells.push(cell);
  return cells;
}

function splitEmails(raw: string): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  return raw
    .split(";")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e && !seen.has(e) && seen.add(e));
}
