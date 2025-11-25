/**
 * Create User For Person Use Case
 *
 * Creates a User account for an existing Person record and links them together.
 * This is used for admin-provisioned user accounts where employees are imported
 * first and given login access later.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { IUserRepository } from "@/core/repositories/user-repository.interface";
import type { IRoleRepository } from "@/core/repositories/role-repository.interface";
import type { IUserRoleRepository } from "@/core/repositories/user-role-repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { UserRole } from "@/core/domain/entities/user-role.entity";
import { generateSecurePassword, hashPassword } from "@/lib/utils/password";

export interface CreateUserForPersonRequest {
  personId: string;
  /** If not provided, a secure random password will be generated */
  password?: string;
  /** User ID creating this account (for audit trail) */
  createdBy?: string;
}

export interface CreateUserForPersonResponse {
  userId: string;
  personId: string;
  email: string;
  /** The plain text password (only returned once, store securely!) */
  password: string;
  /** Whether the password was auto-generated */
  passwordGenerated: boolean;
}

@injectable()
export class CreateUserForPersonUseCase {
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
  ) {}

  async execute(
    request: CreateUserForPersonRequest,
  ): Promise<CreateUserForPersonResponse> {
    this.logger.info("Creating user for person", {
      personId: request.personId,
      hasProvidedPassword: !!request.password,
    });

    // 1. Validate person exists and is not already linked
    const person = await this.personRepository.findById(request.personId);
    if (!person) {
      throw new Error(`Person not found: ${request.personId}`);
    }

    if (person.userId) {
      throw new Error(
        `Person is already linked to user account: ${person.userId}`,
      );
    }

    // 2. Check if user already exists with this email
    const existingUser = await this.userRepository.findByEmail(person.email);
    if (existingUser) {
      throw new Error(
        `User account already exists with email: ${person.email}`,
      );
    }

    // 3. Generate or use provided password
    const plainPassword = request.password ?? generateSecurePassword();
    const passwordGenerated = !request.password;

    // 4. Hash password
    const passwordHash = await hashPassword(plainPassword);

    // 5. Create User record
    const user = await this.userRepository.createDirectly({
      email: person.email,
      name: person.fullName,
      passwordHash,
      emailVerified: false, // Admin-created accounts are not auto-verified
    });

    this.logger.info("User created successfully", {
      userId: user.id,
      email: user.email,
    });

    // 6. Link Person to User
    person.linkToUser(user.id);
    await this.personRepository.update(person);

    this.logger.info("Person linked to user", {
      personId: person.id,
      userId: user.id,
    });

    // 7. Assign default "viewer" role for system permissions
    const viewerRole = await this.roleRepository.findByName("viewer");
    if (!viewerRole) {
      throw new Error(
        "Viewer role not found - database may not be seeded properly",
      );
    }

    const userRole = UserRole.create({
      userId: user.id,
      roleId: viewerRole.id,
      createdBy: request.createdBy,
    });

    await this.userRoleRepository.create(userRole);

    this.logger.info("Viewer role assigned to user", {
      userId: user.id,
      roleId: viewerRole.id,
    });

    return {
      userId: user.id,
      personId: person.id,
      email: person.email,
      password: plainPassword,
      passwordGenerated,
    };
  }
}
