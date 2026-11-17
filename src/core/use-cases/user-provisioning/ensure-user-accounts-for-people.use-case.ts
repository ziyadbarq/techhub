/**
 * Ensure User Accounts For People Use Case
 *
 * Makes sure each given Person (synced from Microsoft Entra ID / Active
 * Directory) has a TechHub user account, so they can be assigned work — for
 * example as an access service's owner, cybersecurity approver or
 * implementer — before they have ever signed in.
 *
 * - Already linked: the existing account is used.
 * - A user with the same email exists but isn't linked: it is linked.
 * - Otherwise an account is created through CreateUserForPersonUseCase
 *   (Viewer role, random password nobody is told). Microsoft sign-in links
 *   to it by email on the person's first login (trusted account linking).
 *
 * Inactive or excluded people are never given an account.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { IUserRepository } from "@/core/repositories/user-repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { CreateUserForPersonUseCase } from "./create-user-for-person.use-case";
import type { LinkUserToPersonUseCase } from "./link-user-to-person.use-case";

export interface EnsureUserAccountsForPeopleRequest {
  personIds: readonly string[];
  /** User performing the action (audit trail). */
  requestedBy?: string | null;
}

export type SkippedPersonReason = "not-found" | "inactive" | "excluded";

export interface EnsureUserAccountsForPeopleResponse {
  /** personId → userId for every person who has (or now has) an account. */
  userIdByPerson: Map<string, string>;
  /** People who got a new account in this call. */
  created: string[];
  /** People who got linked to an existing, unlinked account with their email. */
  linked: string[];
  skipped: Array<{ personId: string; reason: SkippedPersonReason }>;
}

@injectable()
export class EnsureUserAccountsForPeopleUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
    @inject(DI_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(DI_TOKENS.CreateUserForPersonUseCase)
    private readonly createUserForPerson: CreateUserForPersonUseCase,
    @inject(DI_TOKENS.LinkUserToPersonUseCase)
    private readonly linkUserToPerson: LinkUserToPersonUseCase,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(
    request: EnsureUserAccountsForPeopleRequest,
  ): Promise<EnsureUserAccountsForPeopleResponse> {
    const result: EnsureUserAccountsForPeopleResponse = {
      userIdByPerson: new Map(),
      created: [],
      linked: [],
      skipped: [],
    };
    const createdBy = request.requestedBy ?? undefined;

    for (const personId of new Set(request.personIds)) {
      const person = await this.personRepository.findById(personId);
      if (!person) {
        result.skipped.push({ personId, reason: "not-found" });
        continue;
      }
      if (!person.isActive) {
        result.skipped.push({ personId, reason: "inactive" });
        continue;
      }
      if (person.isExcluded) {
        result.skipped.push({ personId, reason: "excluded" });
        continue;
      }
      if (person.userId) {
        result.userIdByPerson.set(personId, person.userId);
        continue;
      }

      const existing = await this.userRepository.findByEmail(person.email);
      if (existing) {
        await this.linkUserToPerson.execute({
          userId: existing.id,
          personId,
          linkedBy: createdBy,
        });
        result.userIdByPerson.set(personId, existing.id);
        result.linked.push(personId);
        continue;
      }

      const created = await this.createUserForPerson.execute({
        personId,
        createdBy,
      });
      result.userIdByPerson.set(personId, created.userId);
      result.created.push(personId);
    }

    if (result.created.length || result.linked.length) {
      this.logger.info("user-provisioning.ensure-accounts", {
        created: result.created.length,
        linked: result.linked.length,
        skipped: result.skipped.length,
        requestedBy: request.requestedBy,
      });
    }
    return result;
  }
}
