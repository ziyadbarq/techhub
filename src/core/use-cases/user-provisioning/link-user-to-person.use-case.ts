/**
 * Link User To Person Use Case
 *
 * Links an existing User account to an existing Person record.
 * This is used when both records exist but are not linked - typically
 * when users were created before their Person records, or when
 * the automatic linking during login didn't work.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { IUserRepository } from "@/core/repositories/user-repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { IUserRoleRepository } from "@/core/repositories/user-role-repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { UserRole } from "@/core/domain/entities/user-role.entity";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface LinkUserToPersonRequest {
  userId: string;
  personId: string;
  /** User ID performing this action (for audit trail) */
  linkedBy?: string;
}

export interface LinkUserToPersonResponse {
  userId: string;
  personId: string;
  email: string;
  personName: string;
}

@injectable()
export class LinkUserToPersonUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRepository)
    private personRepository: IPersonRepository,
    @inject(DI_TOKENS.IUserRepository)
    private userRepository: IUserRepository,
    @inject(DI_TOKENS.IRoleRepository)
    private roleRepository: IRoleRepository,
    @inject(DI_TOKENS.IUserRoleRepository)
    private userRoleRepository: IUserRoleRepository,
    @inject(DI_TOKENS.ILoggerService)
    private logger: ILoggerService,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    request: LinkUserToPersonRequest,
  ): Promise<LinkUserToPersonResponse> {
    this.logger.info("Linking user to person", {
      userId: request.userId,
      personId: request.personId,
      linkedBy: request.linkedBy,
    });

    // 1. Validate user exists
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error(`User not found: ${request.userId}`);
    }

    // 2. Validate person exists
    const person = await this.personRepository.findById(request.personId);
    if (!person) {
      throw new Error(`Person not found: ${request.personId}`);
    }

    // 3. Check if user is already linked to a person
    const existingPersonForUser = await this.personRepository.findByUserId(
      request.userId,
    );
    if (existingPersonForUser) {
      throw new Error(
        `This user is already linked to person: ${existingPersonForUser.fullName}`,
      );
    }

    // 4. Check if person is already linked to a user
    if (person.userId) {
      throw new Error("This person is already linked to a user account");
    }

    // 5. Validate email match (case-insensitive)
    if (user.email.toLowerCase() !== person.email.toLowerCase()) {
      throw new Error(
        `Email addresses must match to link user and person. User email: ${user.email}, Person email: ${person.email}`,
      );
    }

    // 6. Check person is active
    if (!person.isActive) {
      throw new Error("Cannot link to an inactive person");
    }

    // 7. Link person to user
    person.linkToUser(user.id);
    await this.personRepository.update(person);

    this.logger.info("Person linked to user", {
      personId: person.id,
      userId: user.id,
    });

    // 8. Ensure user has at least "viewer" role
    const existingRoles = await this.userRoleRepository.findByUserId(user.id);
    if (existingRoles.length === 0) {
      const viewerRole = await this.roleRepository.findByName("viewer");
      if (viewerRole) {
        const userRole = UserRole.create(
          {
            userId: user.id,
            roleId: viewerRole.id,
            createdBy: request.linkedBy,
          },
          this.idGenerator,
        );
        await this.userRoleRepository.create(userRole);

        this.logger.info("Viewer role assigned to user", {
          userId: user.id,
          roleId: viewerRole.id,
        });
      }
    }

    return {
      userId: user.id,
      personId: person.id,
      email: person.email,
      personName: person.fullName,
    };
  }
}
