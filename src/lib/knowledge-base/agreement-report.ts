/**
 * Policy agreement report: who in a document's audience has agreed to its
 * current published version, and who has not yet.
 *
 * Pure — the database queries live in `agreements.ts` — so the counting rules
 * are unit-tested on their own.
 *
 * An agreement always belongs to ONE published version. Publishing a new
 * version restarts agreement for everyone; an employee who agreed to an
 * earlier version is listed as pending, with that version noted, so the
 * owner can see they are re-confirming rather than reading it for the first
 * time.
 */

export type AgreementPerson = {
  userId: string;
  name: string;
  email: string;
  department: string | null;
};

export type AgreementRecord = {
  userId: string;
  version: number;
  acknowledgedAt: Date;
};

export type AgreementRow = AgreementPerson & {
  /** When this person agreed to the CURRENT version; null while pending. */
  agreedAt: string | null;
  /** Latest earlier version they agreed to, when pending; otherwise null. */
  previousVersion: number | null;
};

export type AgreementReport = {
  version: number;
  total: number;
  agreedCount: number;
  pendingCount: number;
  agreed: AgreementRow[];
  pending: AgreementRow[];
};

const byName = (a: AgreementRow, b: AgreementRow) =>
  a.name.localeCompare(b.name, "en", { sensitivity: "base" }) ||
  a.email.localeCompare(b.email);

export function buildAgreementReport(
  version: number,
  audience: readonly AgreementPerson[],
  records: readonly AgreementRecord[],
): AgreementReport {
  const current = new Map<string, Date>();
  const earlier = new Map<string, number>();
  for (const record of records) {
    if (record.version === version) {
      current.set(record.userId, record.acknowledgedAt);
    } else if (record.version < version) {
      earlier.set(
        record.userId,
        Math.max(earlier.get(record.userId) ?? 0, record.version),
      );
    }
  }

  const seen = new Set<string>();
  const agreed: AgreementRow[] = [];
  const pending: AgreementRow[] = [];
  for (const person of audience) {
    if (seen.has(person.userId)) continue;
    seen.add(person.userId);
    const agreedAt = current.get(person.userId);
    if (agreedAt) {
      agreed.push({ ...person, agreedAt: agreedAt.toISOString(), previousVersion: null });
    } else {
      pending.push({
        ...person,
        agreedAt: null,
        previousVersion: earlier.get(person.userId) ?? null,
      });
    }
  }

  // Most recent agreements first; pending alphabetically, to chase.
  agreed.sort(
    (a, b) => (b.agreedAt ?? "").localeCompare(a.agreedAt ?? "") || byName(a, b),
  );
  pending.sort(byName);

  return {
    version,
    total: agreed.length + pending.length,
    agreedCount: agreed.length,
    pendingCount: pending.length,
    agreed,
    pending,
  };
}

/** A spreadsheet cell that cannot be read as a formula (CSV injection). */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
  return /[",\n\r]/.test(safe) ? '"' + safe.replace(/"/g, '""') + '"' : safe;
}

export function agreementReportToCsv(report: AgreementReport): string {
  const header = ["Name", "Email", "Department", "Status", "Agreed at", "Previously agreed version"];
  const rows = [...report.agreed, ...report.pending].map((row) => [
    row.name,
    row.email,
    row.department ?? "",
    row.agreedAt ? "Agreed" : "Pending",
    row.agreedAt ?? "",
    row.previousVersion ? "v" + row.previousVersion : "",
  ]);
  return [header, ...rows].map((cells) => cells.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
