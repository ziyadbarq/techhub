/**
 * "Roster" import format: the access-services sheet the business keeps,
 * with people written by name rather than email.
 *
 *   Title | Service Owner | Cybersecurity Owner | Service Implementer
 *
 * Several people in one cell are separated by commas (or ; or new lines).
 * An optional "Manager Approval" column (yes/no) is honoured when present.
 */

export const ROSTER_COLUMNS = {
  title: "title",
  owner: "service owner",
  cybersecurity: "cybersecurity owner",
  implementer: "service implementer",
  managerApproval: "manager approval",
} as const;

/** Header cell → comparable key: lower case, single spaces, no BOM. */
export function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function isRosterHeader(headers: readonly string[]): boolean {
  const set = new Set(headers.map(normalizeHeader));
  return (
    set.has(ROSTER_COLUMNS.title) &&
    set.has(ROSTER_COLUMNS.owner) &&
    set.has(ROSTER_COLUMNS.cybersecurity) &&
    set.has(ROSTER_COLUMNS.implementer)
  );
}

/** "SFTP Portal – Reconciliation" → "sftp-portal-reconciliation". */
export function slugifyServiceName(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function splitNames(cell: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const part of cell.split(/[,;\n\r]+/)) {
    const name = part.trim().replace(/\s+/g, " ");
    const key = personNameKey(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

/**
 * Comparable form of a person's name: accents, case, punctuation and
 * spacing don't matter ("SalahAldin" matches "Salah Aldin").
 */
export function personNameKey(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, "");
}

export function parseYesNo(value: string): boolean | undefined {
  const v = value.trim().toLowerCase();
  if (["yes", "y", "true", "1", "required", "نعم"].includes(v)) return true;
  if (["no", "n", "false", "0", "not required", "لا"].includes(v)) return false;
  return undefined;
}

export interface ActivePersonNames {
  personId: string;
  /** null while the person has never signed in to TechHub. */
  userId: string | null;
  /** Every way this person's name may be written (display name, first + last …). */
  names: string[];
}

export type NameResolution =
  | { status: "found"; personId: string; userId: string | null }
  | { status: "unknown" }
  | { status: "ambiguous"; count: number };

export class PersonNameIndex {
  private readonly byKey = new Map<string, Set<string>>();
  private readonly people = new Map<string, ActivePersonNames>();

  constructor(people: readonly ActivePersonNames[]) {
    for (const person of people) {
      this.people.set(person.personId, person);
      for (const name of person.names) {
        const key = personNameKey(name);
        if (!key) continue;
        const ids = this.byKey.get(key) ?? new Set<string>();
        ids.add(person.personId);
        this.byKey.set(key, ids);
      }
    }
  }

  resolve(name: string): NameResolution {
    const ids = this.byKey.get(personNameKey(name));
    if (!ids || ids.size === 0) return { status: "unknown" };
    if (ids.size > 1) return { status: "ambiguous", count: ids.size };
    const person = this.people.get([...ids][0]!)!;
    return {
      status: "found",
      personId: person.personId,
      userId: person.userId,
    };
  }
}
