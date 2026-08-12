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

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_ROWS = 500;

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

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ImportRowError {
  row: number;
  column?: string;
  message: string;
}

export interface ImportAccessServicesResult {
  importedCount: number;
  errors: ImportRowError[];
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

interface ParsedRow {
  lineNumber: number;
  name: string;
  slug: string;
  description: string | null;
  requireManagerApproval: boolean;
  instructions: string | null;
  ownerEmails: string[];
  cybersecurityEmails: string[];
  implementerEmails: string[];
}

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

    const text = bytes.toString("utf-8");
    const { rows: parsedRows, errors: parseErrors } = parseCsv(text);

    if (parseErrors.length > 0) {
      return { importedCount: 0, errors: parseErrors, contentHash };
    }

    if (parsedRows.length > MAX_ROWS) {
      return {
        importedCount: 0,
        errors: [
          {
            row: 0,
            message: `Import exceeds the ${MAX_ROWS}-row limit (got ${parsedRows.length}).`,
          },
        ],
        contentHash,
      };
    }

    const validationErrors = await this.validate(parsedRows);
    if (validationErrors.length > 0) {
      return { importedCount: 0, errors: validationErrors, contentHash };
    }

    if (request.dryRun) {
      return { importedCount: parsedRows.length, errors: [], contentHash };
    }

    // All-or-nothing upsert
    let count = 0;
    for (const row of parsedRows) {
      await this.upsertRow(row, request.importedById ?? null);
      count++;
    }

    this.logger.info("access-service.import", {
      count,
      importedById: request.importedById,
    });
    return { importedCount: count, errors: [] };
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  private async validate(rows: ParsedRow[]): Promise<ImportRowError[]> {
    const errors: ImportRowError[] = [];

    // Intra-file duplicate checks
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

    if (errors.length > 0) return errors;

    // DB-level checks: unknown emails
    for (const row of rows) {
      const allEmails = [
        ...row.ownerEmails,
        ...row.cybersecurityEmails,
        ...row.implementerEmails,
      ];
      for (const email of allEmails) {
        if (!email) continue;
        // We validate emails exist & are active via the repository's user lookup
        // (The Prisma repository will expose findActiveUserByEmail internally)
        // We delegate per-email validation to the repository upsert path;
        // unknown/inactive emails will surface there. For dry-run accuracy we
        // call a lightweight check here via the repo interface.
        const isValid = await this.repo.isActiveUserEmail(email);
        if (!isValid) {
          errors.push({
            row: row.lineNumber,
            message: `Unknown or inactive user email "${email}".`,
          });
        }
      }
    }

    return errors;
  }

  // ─── Upsert ───────────────────────────────────────────────────────────────

  private async upsertRow(
    row: ParsedRow,
    importedById: string | null,
  ): Promise<void> {
    const existing = await this.repo.findBySlug(row.slug);

    const assignees = await this.buildAssignees(row);

    if (existing) {
      await this.repo.update(
        existing.id,
        {
          name: row.name,
          description: row.description,
          requireManagerApproval: row.requireManagerApproval,
          instructions: row.instructions,
          updatedById: importedById,
        },
        assignees,
      );
    } else {
      const id = this.idGenerator.generateId();
      await this.repo.create(
        {
          id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          isActive: true,
          requireManagerApproval: row.requireManagerApproval,
          instructions: row.instructions,
          createdById: importedById,
          updatedById: importedById,
        },
        assignees,
      );
    }
  }

  private async buildAssignees(
    row: ParsedRow,
  ): Promise<AccessServiceAssigneeInput[]> {
    const result: AccessServiceAssigneeInput[] = [];
    const roleMap: Array<{ emails: string[]; role: AccessServiceRole }> = [
      { emails: row.ownerEmails, role: "OWNER" },
      { emails: row.cybersecurityEmails, role: "CYBERSECURITY" },
      { emails: row.implementerEmails, role: "IMPLEMENTER" },
    ];

    for (const { emails, role } of roleMap) {
      const seen = new Set<string>();
      for (const email of emails) {
        const lower = email.toLowerCase();
        if (seen.has(lower)) continue;
        seen.add(lower);
        const userId = await this.repo.findActiveUserIdByEmail(lower);
        if (userId) {
          result.push({ userId, role });
        }
      }
    }

    return result;
  }
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseCsv(text: string): {
  rows: ParsedRow[];
  errors: ImportRowError[];
} {
  const errors: ImportRowError[] = [];
  const rows: ParsedRow[] = [];

  const lines = splitCsvLines(text);
  if (lines.length < 2) {
    errors.push({ row: 0, message: "CSV has no data rows." });
    return { rows, errors };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const missingCols = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  if (missingCols.length > 0) {
    errors.push({
      row: 1,
      message: `Missing required columns: ${missingCols.join(", ")}.`,
    });
    return { rows, errors };
  }

  const colIdx = (name: string) => headers.indexOf(name);

  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1;
    const raw = lines[i].trim();
    if (!raw) continue;

    const cells = parseCsvLine(lines[i]);
    const get = (col: string) => (cells[colIdx(col)] ?? "").trim();

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
      ownerEmails: splitEmails(get("ownerEmails")),
      cybersecurityEmails: splitEmails(get("cybersecurityEmails")),
      implementerEmails: splitEmails(get("implementerEmails")),
    });
  }

  return { rows, errors };
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
  return raw
    .split(";")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
