/**
 * Resolve People By Name Use Case
 *
 * Turns display names (as they appear in Active Directory) into TechHub user
 * accounts, so a workflow can be assigned to named people who may never
 * have signed in. Each name must match exactly one active person; that
 * person gets an account through EnsureUserAccountsForPeopleUseCase.
 * Unknown and ambiguous names are reported, never guessed.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { ValidationError } from "@/core/domain/errors";
import { PersonNameIndex } from "@/core/use-cases/access-service/roster";
import type { IAccessServiceRepository } from "@/core/repositories/workflow/access-service.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type {
  EnsureUserAccountsForPeopleUseCase,
  SkippedPersonReason,
} from "./ensure-user-accounts-for-people.use-case";

export const MAX_NAMES_PER_LOOKUP = 100;

export type ResolvedPerson =
  | { name: string; status: "found"; userId: string; created: boolean }
  | { name: string; status: "unknown" }
  | { name: string; status: "ambiguous"; count: number }
  | { name: string; status: "skipped"; reason: SkippedPersonReason };

export interface ResolvePeopleByNameRequest {
  names: readonly string[];
  requestedBy?: string | null;
}

@injectable()
export class ResolvePeopleByNameUseCase {
  constructor(
    @inject(DI_TOKENS.IAccessServiceRepository)
    private readonly people: IAccessServiceRepository,
    @inject(DI_TOKENS.EnsureUserAccountsForPeopleUseCase)
    private readonly ensureAccounts: EnsureUserAccountsForPeopleUseCase,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    request: ResolvePeopleByNameRequest,
  ): Promise<ResolvedPerson[]> {
    const names = [
      ...new Set(request.names.map((n) => n.trim()).filter(Boolean)),
    ];
    if (names.length > MAX_NAMES_PER_LOOKUP) {
      throw new ValidationError(
        `At most ${MAX_NAMES_PER_LOOKUP} names per lookup.`,
      );
    }

    const index = new PersonNameIndex(
      await this.people.listActivePeopleNames(),
    );
    const matches = names.map((name) => ({ name, match: index.resolve(name) }));
    const personIds = matches.flatMap(({ match }) =>
      match.status === "found" ? [match.personId] : [],
    );
    const accounts = await this.ensureAccounts.execute({
      personIds,
      requestedBy: request.requestedBy,
    });
    const created = new Set([...accounts.created, ...accounts.linked]);
    const skipped = new Map(
      accounts.skipped.map((s) => [s.personId, s.reason] as const),
    );

    const result = matches.map(({ name, match }): ResolvedPerson => {
      if (match.status === "unknown") return { name, status: "unknown" };
      if (match.status === "ambiguous") {
        return { name, status: "ambiguous", count: match.count };
      }
      const userId = accounts.userIdByPerson.get(match.personId);
      if (!userId) {
        return {
          name,
          status: "skipped",
          reason: skipped.get(match.personId) ?? "not-found",
        };
      }
      return {
        name,
        status: "found",
        userId,
        created: created.has(match.personId),
      };
    });

    this.logger.info("user-provisioning.resolve-people-by-name", {
      requested: names.length,
      found: result.filter((r) => r.status === "found").length,
      newAccounts: created.size,
      requestedBy: request.requestedBy,
    });
    return result;
  }
}
