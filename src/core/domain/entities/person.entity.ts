/**
 * Person Domain Entity
 * Organizational people (links to Better Auth User + RBAC Role)
 */

export interface PersonProps {
  id: string;
  azureAdId: string | null; // Immutable MS Graph ID - source of truth for user sync
  userId: string | null; // Optional link to Better Auth User
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  phone: string | null;
  mobile: string | null;
  employeeId: string | null;
  orgUnitId: string;
  primaryRoleId: string | null;
  managerId: string | null;
  title: string | null; // Job title from Intune sync
  office: string | null; // Office location from MS Graph (e.g., "Riyadh HQ")
  locationId: string | null;
  department: string | null;
  hireDate: Date | null;
  terminationDate: Date | null;
  isActive: boolean;
  isExcluded: boolean; // TechHub-specific: hide from app (service accounts)
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePersonProps {
  azureAdId?: string | null;
  userId?: string | null;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email: string;
  phone?: string | null;
  mobile?: string | null;
  employeeId?: string | null;
  orgUnitId: string;
  primaryRoleId?: string | null;
  managerId?: string | null;
  title?: string | null;
  office?: string | null;
  locationId?: string | null;
  department?: string | null;
  hireDate?: Date | null;
  terminationDate?: Date | null;
  metadata?: Record<string, unknown> | null;
}

export class Person {
  private constructor(private props: PersonProps) {}

  static create(props: CreatePersonProps): Person {
    Person.validateFirstName(props.firstName);
    Person.validateLastName(props.lastName);
    Person.validateEmail(props.email);
    Person.validateOrgUnitId(props.orgUnitId);

    const now = new Date();

    return new Person({
      id: "",
      azureAdId: props.azureAdId || null,
      userId: props.userId || null,
      firstName: props.firstName.trim(),
      lastName: props.lastName.trim(),
      middleName: props.middleName?.trim() || null,
      email: props.email.trim().toLowerCase(),
      phone: props.phone?.trim() || null,
      mobile: props.mobile?.trim() || null,
      employeeId: props.employeeId?.trim() || null,
      orgUnitId: props.orgUnitId,
      primaryRoleId: props.primaryRoleId ?? null,
      managerId: props.managerId || null,
      title: props.title?.trim() || null,
      office: props.office?.trim() || null,
      locationId: props.locationId || null,
      department: props.department?.trim() || null,
      hireDate: props.hireDate || null,
      terminationDate: props.terminationDate || null,
      isActive: true,
      isExcluded: false,
      metadata: props.metadata || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: PersonProps): Person {
    return new Person(props);
  }

  update(props: {
    firstName?: string;
    lastName?: string;
    middleName?: string | null;
    email?: string;
    phone?: string | null;
    mobile?: string | null;
    employeeId?: string | null;
    orgUnitId?: string;
    primaryRoleId?: string | null;
    managerId?: string | null;
    title?: string | null;
    office?: string | null;
    locationId?: string | null;
    department?: string | null;
    hireDate?: Date | null;
    terminationDate?: Date | null;
    isActive?: boolean;
    metadata?: Record<string, unknown> | null;
  }): void {
    if (props.firstName !== undefined) {
      Person.validateFirstName(props.firstName);
      this.props.firstName = props.firstName.trim();
    }

    if (props.lastName !== undefined) {
      Person.validateLastName(props.lastName);
      this.props.lastName = props.lastName.trim();
    }

    if (props.middleName !== undefined) {
      this.props.middleName = props.middleName?.trim() || null;
    }

    if (props.email !== undefined) {
      Person.validateEmail(props.email);
      this.props.email = props.email.trim().toLowerCase();
    }

    if (props.phone !== undefined) {
      this.props.phone = props.phone?.trim() || null;
    }

    if (props.mobile !== undefined) {
      this.props.mobile = props.mobile?.trim() || null;
    }

    if (props.employeeId !== undefined) {
      this.props.employeeId = props.employeeId?.trim() || null;
    }

    if (props.orgUnitId !== undefined) {
      Person.validateOrgUnitId(props.orgUnitId);
      this.props.orgUnitId = props.orgUnitId;
    }

    if (props.primaryRoleId !== undefined) {
      this.props.primaryRoleId = props.primaryRoleId;
    }

    if (props.managerId !== undefined) {
      this.props.managerId = props.managerId;
    }

    if (props.title !== undefined) {
      this.props.title = props.title?.trim() || null;
    }

    if (props.office !== undefined) {
      this.props.office = props.office?.trim() || null;
    }

    if (props.locationId !== undefined) {
      this.props.locationId = props.locationId;
    }

    if (props.department !== undefined) {
      this.props.department = props.department?.trim() || null;
    }

    if (props.hireDate !== undefined) {
      this.props.hireDate = props.hireDate;
    }

    if (props.terminationDate !== undefined) {
      this.props.terminationDate = props.terminationDate;
    }

    if (props.isActive !== undefined) {
      this.props.isActive = props.isActive;
    }

    if (props.metadata !== undefined) {
      this.props.metadata = props.metadata;
    }

    this.props.updatedAt = new Date();
  }

  linkToUser(userId: string): void {
    if (this.props.userId) {
      throw new Error("Person is already linked to a user account");
    }
    this.props.userId = userId;
    this.props.updatedAt = new Date();
  }

  unlinkFromUser(): void {
    this.props.userId = null;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  exclude(): void {
    this.props.isExcluded = true;
    this.props.updatedAt = new Date();
  }

  include(): void {
    this.props.isExcluded = false;
    this.props.updatedAt = new Date();
  }

  moveToOrganizationUnit(orgUnitId: string): void {
    Person.validateOrgUnitId(orgUnitId);
    this.props.orgUnitId = orgUnitId;
    this.props.updatedAt = new Date();
  }

  private static validateFirstName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Person first name cannot be empty");
    }
    if (name.trim().length < 1) {
      throw new Error("Person first name must be at least 1 character");
    }
    if (name.trim().length > 100) {
      throw new Error("Person first name cannot exceed 100 characters");
    }
  }

  private static validateLastName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Person last name cannot be empty");
    }
    if (name.trim().length < 1) {
      throw new Error("Person last name must be at least 1 character");
    }
    if (name.trim().length > 100) {
      throw new Error("Person last name cannot exceed 100 characters");
    }
  }

  private static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error("Invalid email address format");
    }
  }

  private static validateOrgUnitId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("Organization unit ID cannot be empty");
    }
  }

  isLinkedToUserAccount(): boolean {
    return !!this.props.userId;
  }

  get id(): string {
    return this.props.id;
  }
  get azureAdId(): string | null {
    return this.props.azureAdId;
  }
  get userId(): string | null {
    return this.props.userId;
  }
  get firstName(): string {
    return this.props.firstName;
  }
  get lastName(): string {
    return this.props.lastName;
  }
  get middleName(): string | null {
    return this.props.middleName;
  }
  get fullName(): string {
    return this.props.middleName
      ? `${this.props.firstName} ${this.props.middleName} ${this.props.lastName}`
      : `${this.props.firstName} ${this.props.lastName}`;
  }
  get email(): string {
    return this.props.email;
  }
  get phone(): string | null {
    return this.props.phone;
  }
  get mobile(): string | null {
    return this.props.mobile;
  }
  get employeeId(): string | null {
    return this.props.employeeId;
  }
  get orgUnitId(): string {
    return this.props.orgUnitId;
  }
  get primaryRoleId(): string | null {
    return this.props.primaryRoleId;
  }
  get managerId(): string | null {
    return this.props.managerId;
  }
  get title(): string | null {
    return this.props.title;
  }
  get office(): string | null {
    return this.props.office;
  }
  get locationId(): string | null {
    return this.props.locationId;
  }
  get department(): string | null {
    return this.props.department;
  }
  get hireDate(): Date | null {
    return this.props.hireDate;
  }
  get terminationDate(): Date | null {
    return this.props.terminationDate;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get isExcluded(): boolean {
    return this.props.isExcluded;
  }
  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  setId(id: string): void {
    if (this.props.id)
      throw new Error("Cannot change person ID after it has been set");
    this.props.id = id;
  }
  setUpdatedAt(date: Date): void {
    this.props.updatedAt = date;
  }

  toObject(): PersonProps {
    return { ...this.props };
  }

  equals(other: Person): boolean {
    return this.props.id === other.id;
  }
}
