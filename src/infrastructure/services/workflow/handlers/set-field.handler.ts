import { injectable } from "inversify";

import { ConfigurationError } from "@/core/domain/workflow";
import type { IAutomationHandler } from "@/core/repositories/workflow";

/**
 * "set-field" automation handler — writes a literal value into a form field.
 *
 * Required args:
 *   - `fieldKey`: target form field key
 *   - `value`: value to write (defaults to null)
 *
 * Always advances the step.
 */
@injectable()
export class SetFieldHandler implements IAutomationHandler {
  readonly key = "set-field";

  async run(args: Record<string, unknown>): Promise<{
    fieldUpdates?: Record<string, unknown>;
    advance: boolean;
  }> {
    const fieldKey = String(args.fieldKey ?? "");
    if (!fieldKey) {
      throw new ConfigurationError("set-field handler requires `fieldKey`");
    }
    return {
      advance: true,
      fieldUpdates: { [fieldKey]: args.value ?? null },
    };
  }
}
