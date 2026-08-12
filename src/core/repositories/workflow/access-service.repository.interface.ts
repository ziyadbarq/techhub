import type { AccessServiceRole } from "@/generated/prisma";
import type { Tx } from "./types";

export interface AccessServiceAssigneeInput {
  userId: string;
  role: AccessServiceRole;
}

export interface AccessServiceAssigneeDetail {
  userId: string;
  role: AccessServiceRole;
  userName: string;
  userEmail: string;
}

export interface AccessServiceData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  requireManagerApproval: boolean;
  instructions: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
  updatedById: string | null;
  assignees?: AccessServiceAssigneeDetail[];
}

export interface IAccessServiceRepository {
  findById(id: string, tx?: Tx): Promise<AccessServiceData | null>;
  findBySlug(slug: string, tx?: Tx): Promise<AccessServiceData | null>;
  findByName(name: string, tx?: Tx): Promise<AccessServiceData | null>;
  findAll(
    opts?: { activeOnly?: boolean },
    tx?: Tx,
  ): Promise<AccessServiceData[]>;
  findActiveAssigneesByRole(
    serviceId: string,
    role: AccessServiceRole,
    tx?: Tx,
  ): Promise<AccessServiceAssigneeDetail[]>;
  create(
    data: Omit<AccessServiceData, "createdAt" | "updatedAt" | "assignees">,
    assignees: AccessServiceAssigneeInput[],
    tx?: Tx,
  ): Promise<AccessServiceData>;
  update(
    id: string,
    data: Partial<
      Omit<AccessServiceData, "id" | "createdAt" | "updatedAt" | "assignees">
    >,
    assignees: AccessServiceAssigneeInput[],
    tx?: Tx,
  ): Promise<AccessServiceData>;
  /** Returns true when an active User row exists for the given email (case-insensitive). */
  isActiveUserEmail(email: string, tx?: Tx): Promise<boolean>;
  /** Returns the userId for an active User with the given email, or null. */
  findActiveUserIdByEmail(email: string, tx?: Tx): Promise<string | null>;
}

// ─── Snapshot Repository ─────────────────────────────────────────────────────

export interface SnapshotAssigneeInput {
  userId: string;
  userName: string;
  userEmail: string;
  role: AccessServiceRole;
}

export interface CreateSnapshotInput {
  requestId: string;
  sourceFieldKey: string;
  accessServiceId: string;
  serviceName: string;
  serviceSlug: string;
  requireManagerApproval: boolean;
  instructions: string | null;
  assignees: SnapshotAssigneeInput[];
}

export interface SnapshotAssigneeRow {
  userId: string | null;
  userName: string;
  userEmail: string;
  role: AccessServiceRole;
}

export interface AccessServiceSnapshotRow {
  id: string;
  requestId: string;
  sourceFieldKey: string;
  accessServiceId: string;
  serviceName: string;
  serviceSlug: string;
  requireManagerApproval: boolean;
  instructions: string | null;
  createdAt: Date;
  assignees: SnapshotAssigneeRow[];
}

export interface IAccessServiceSnapshotRepository {
  createSnapshot(input: CreateSnapshotInput, tx: Tx): Promise<void>;
  findByRequestAndField(
    requestId: string,
    sourceFieldKey: string,
    tx?: Tx,
  ): Promise<AccessServiceSnapshotRow | null>;
  findAllForRequest(
    requestId: string,
    tx?: Tx,
  ): Promise<AccessServiceSnapshotRow[]>;
  findActiveAssigneeIdsByRole(
    requestId: string,
    sourceFieldKey: string,
    role: AccessServiceRole,
    tx: Tx,
  ): Promise<string[]>;
}

// ─── Requester Identity Snapshot Repository ───────────────────────────────────

export interface CreateRequesterIdentityInput {
  requestId: string;
  requesterUserId: string;
  requesterName: string;
  requesterEmail: string;
  managerUserId?: string | null;
  managerName?: string | null;
  managerEmail?: string | null;
}

export interface RequesterIdentityRow {
  requesterUserId: string;
  requesterName: string;
  requesterEmail: string;
  managerUserId: string | null;
  managerName: string | null;
  managerEmail: string | null;
}

export interface IRequesterIdentitySnapshotRepository {
  create(input: CreateRequesterIdentityInput, tx: Tx): Promise<void>;
  findByRequestId(
    requestId: string,
    tx?: Tx,
  ): Promise<RequesterIdentityRow | null>;
}
