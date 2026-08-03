import { injectable } from "inversify";

import type { Tx } from "@/core/repositories/workflow";

const PLACEHOLDER = /\{(YYYY|YY|MM|DD|seq(?::(\d+))?)\}/g;

function pad(value: number, width: number): string {
  return String(value).padStart(width, "0");
}

export interface ReferenceNumberFormatTokens {
  year4: string;
  year2: string;
  month: string;
  day: string;
  sequence: number;
}

export function applyReferenceNumberFormat(
  format: string,
  tokens: ReferenceNumberFormatTokens,
): string {
  return format.replace(PLACEHOLDER, (_match, name: string, width?: string) => {
    if (name === "YYYY") return tokens.year4;
    if (name === "YY") return tokens.year2;
    if (name === "MM") return tokens.month;
    if (name === "DD") return tokens.day;
    if (name.startsWith("seq")) {
      const w = width ? parseInt(width, 10) : 1;
      return pad(tokens.sequence, w);
    }
    return _match;
  });
}

/**
 * Reference number service interface.
 *
 * Generates per-form sequenced reference numbers using the form's
 * `referenceNumberFormat` template (e.g., "REQ-{YYYY}-{seq:04}").
 */
export interface IReferenceNumberService {
  generate(formId: string, tx: Tx): Promise<string>;
  applyFormat(format: string, tokens: ReferenceNumberFormatTokens): string;
}

@injectable()
export class ReferenceNumberService implements IReferenceNumberService {
  applyFormat(format: string, tokens: ReferenceNumberFormatTokens): string {
    return applyReferenceNumberFormat(format, tokens);
  }

  async generate(formId: string, tx: Tx): Promise<string> {
    const form = await tx.form.update({
      where: { id: formId },
      data: { nextSequence: { increment: 1 } },
      select: { referenceNumberFormat: true, nextSequence: true },
    });

    const now = new Date();
    return applyReferenceNumberFormat(form.referenceNumberFormat, {
      year4: String(now.getUTCFullYear()),
      year2: String(now.getUTCFullYear()).slice(-2),
      month: pad(now.getUTCMonth() + 1, 2),
      day: pad(now.getUTCDate(), 2),
      sequence: form.nextSequence - 1,
    });
  }
}

/**
 * Module-level helper retained for direct callers (e.g. the
 * generate-reference-number automation handler) that don't have a Tx-aware
 * service instance handy. Accepts any Tx (PrismaClient or TransactionClient).
 */
export async function generateReferenceNumber(
  formId: string,
  tx: Tx,
): Promise<string> {
  const form = await tx.form.update({
    where: { id: formId },
    data: { nextSequence: { increment: 1 } },
    select: { referenceNumberFormat: true, nextSequence: true },
  });

  const now = new Date();
  return applyReferenceNumberFormat(form.referenceNumberFormat, {
    year4: String(now.getUTCFullYear()),
    year2: String(now.getUTCFullYear()).slice(-2),
    month: pad(now.getUTCMonth() + 1, 2),
    day: pad(now.getUTCDate(), 2),
    sequence: form.nextSequence - 1,
  });
}
