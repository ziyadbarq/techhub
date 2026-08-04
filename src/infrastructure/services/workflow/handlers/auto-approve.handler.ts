import { injectable } from "inversify";

import type { IAutomationHandler } from "@/core/repositories/workflow";

/**
 * "auto-approve" automation handler — advances the step unconditionally.
 *
 * Used as a no-op decision step that simply progresses the workflow without
 * field mutation. Argument map is ignored.
 */
@injectable()
export class AutoApproveHandler implements IAutomationHandler {
  readonly key = "auto-approve";

  async run(): Promise<{
    fieldUpdates?: Record<string, unknown>;
    advance: boolean;
  }> {
    return { advance: true };
  }
}
