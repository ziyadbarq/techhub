import { injectable } from "inversify";

import { ConfigurationError } from "@/core/domain/workflow";
import type { ExecCtx, IAutomationHandler } from "@/core/repositories/workflow";

import { generateReferenceNumber } from "../reference-numbers.service";

/**
 * "generate-reference-number" automation handler — mints a sequenced
 * reference number using the supplied form's `referenceNumberFormat` and
 * writes it into the requested target field.
 *
 * Required args:
 *   - `formId`: form whose sequence is incremented
 *   - `fieldKey`: target form field (defaults to "reference_number")
 *
 * Always advances the step.
 */
@injectable()
export class GenerateReferenceNumberHandler implements IAutomationHandler {
  readonly key = "generate-reference-number";

  async run(
    args: Record<string, unknown>,
    exec: ExecCtx,
  ): Promise<{ fieldUpdates?: Record<string, unknown>; advance: boolean }> {
    const formId = String(args.formId ?? "");
    const targetField = String(args.fieldKey ?? "reference_number");
    if (!formId) {
      throw new ConfigurationError(
        "generate-reference-number requires `formId`",
      );
    }
    const ref = await generateReferenceNumber(formId, exec.tx);
    return { advance: true, fieldUpdates: { [targetField]: ref } };
  }
}
