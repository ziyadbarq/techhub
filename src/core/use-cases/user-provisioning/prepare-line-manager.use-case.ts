/**
 * Prepare Line Manager Use Case
 *
 * Makes a requester's line manager usable before a request:
 *
 * 1. If the requester's Person has no manager linked yet but came from
 *    Microsoft Entra ID / Active Directory, the manager is read from
 *    Microsoft Graph and linked now (the user sync links managers in bulk;
 *    this covers anyone it missed or who changed since).
 * 2. With `ensureAccount`, the manager gets a TechHub account if they have
 *    none, so the "line manager" approval reaches them and the request
 *    shows their name (most managers have never signed in).
 *
 * Best effort: a Graph error leaves the stored manager as it is.
 */

import { injectable, inject, optional } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { lineManagerPersonId } from "@/core/domain/workflow/line-manager";
import { IMicrosoftGraphService } from "@/core/services/microsoft-graph.service.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { EnsureUserAccountsForPeopleUseCase } from "./ensure-user-accounts-for-people.use-case";

const GRAPH_TIMEOUT_MS = 5000;

export interface PrepareLineManagerRequest {
  userId: string;
  ensureAccount: boolean;
  requestedBy?: string | null;
}

export interface PrepareLineManagerResult {
  managerPersonId: string | null;
  /** True when the manager was just read from the directory and linked. */
  linkedFromDirectory: boolean;
}

@injectable()
export class PrepareLineManagerUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRepository)
    private readonly people: IPersonRepository,
    @inject(DI_TOKENS.IOrganizationUnitRepository)
    private readonly orgUnits: IOrganizationUnitRepository,
    @inject(DI_TOKENS.EnsureUserAccountsForPeopleUseCase)
    private readonly ensureAccounts: EnsureUserAccountsForPeopleUseCase,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(IMicrosoftGraphService)
    @optional()
    private readonly graph: IMicrosoftGraphService | null,
  ) {}

  async execute(
    request: PrepareLineManagerRequest,
  ): Promise<PrepareLineManagerResult> {
    const person = await this.people.findByUserId(request.userId);
    if (!person || !person.isActive) {
      return { managerPersonId: null, linkedFromDirectory: false };
    }

    let linkedFromDirectory = false;
    if (!person.managerId && person.azureAdId && this.graph) {
      try {
        const manager = await withTimeout(
          this.graph.fetchUserManager(person.azureAdId),
          GRAPH_TIMEOUT_MS,
        );
        const managerPerson = manager
          ? await this.people.findByAzureAdId(manager.id)
          : null;
        if (managerPerson && managerPerson.id !== person.id) {
          person.update({ managerId: managerPerson.id });
          await this.people.update(person);
          linkedFromDirectory = true;
        } else if (manager) {
          this.logger.warn("user-provisioning.line-manager.not-synced", {
            personId: person.id,
          });
        }
      } catch (error) {
        this.logger.warn("user-provisioning.line-manager.graph-failed", {
          personId: person.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const orgUnit = await this.orgUnits.findById(person.orgUnitId);
    const managerPersonId = lineManagerPersonId({
      id: person.id,
      managerId: person.managerId,
      orgUnitManagerId: orgUnit?.managerId ?? null,
    });

    if (request.ensureAccount && managerPersonId) {
      await this.ensureAccounts.execute({
        personIds: [managerPersonId],
        requestedBy: request.requestedBy,
      });
    }
    return { managerPersonId, linkedFromDirectory };
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out after ${ms} ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
