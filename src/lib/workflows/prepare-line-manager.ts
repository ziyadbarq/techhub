import "server-only";
import { ensureModuleLoaded, getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { logger } from "@/lib/logger";
import type { PrepareLineManagerUseCase } from "@/core/use-cases/user-provisioning";

/**
 * Before a request form opens or is submitted: link the requester's line
 * manager from Active Directory if it's missing, and on submit make sure
 * the manager has an account. Never blocks the request; failures are
 * logged and the stored manager (if any) is used.
 */
export async function prepareRequesterLineManager(
  userId: string,
  options: { ensureAccount: boolean },
): Promise<void> {
  try {
    // Microsoft Graph is a lazily loaded module; without it (or without
    // its configuration) only the stored manager is used.
    await ensureModuleLoaded("microsoft-graph").catch(() => undefined);
    await getContainer()
      .get<PrepareLineManagerUseCase>(DI_TOKENS.PrepareLineManagerUseCase)
      .execute({
        userId,
        ensureAccount: options.ensureAccount,
        requestedBy: userId,
      });
  } catch (error) {
    logger
      .scope("Workflow")
      .warn(
        "prepareRequesterLineManager",
        "Couldn't prepare the line manager",
        {
          userId,
          error: error instanceof Error ? error.message : String(error),
        },
      );
  }
}
