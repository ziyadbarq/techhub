"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { requirePermission } from "@/lib/permissions/server";
import { requireFeature } from "@/lib/features/server";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handleControllerError } from "./error-handler";
import type { ActionResponse } from "./types";
import type {
  CreateAccessServiceUseCase,
  UpdateAccessServiceUseCase,
  ListAccessServicesUseCase,
  GetAccessServiceUseCase,
  ToggleAccessServiceStatusUseCase,
  ImportAccessServicesUseCase,
  ExportAccessServicesUseCase,
  ImportAccessServicesResult,
} from "@/core/use-cases/access-service";
import type {
  AccessServiceData,
  IAccessServiceRepository,
} from "@/core/repositories/workflow/access-service.repository.interface";
export type { AccessServiceData } from "@/core/repositories/workflow/access-service.repository.interface";
import type { AccessServiceRole } from "@/generated/prisma";
import { getSession } from "@/lib/auth/session";

/** Assignee can be specified by userId or by email (email is resolved server-side) */
export interface AccessServiceAssigneePayload {
  userId?: string;
  email?: string;
  role: AccessServiceRole;
}

export interface CreateAccessServicePayload {
  name: string;
  slug: string;
  description?: string | null;
  requireManagerApproval?: boolean;
  instructions?: string | null;
  assignees?: AccessServiceAssigneePayload[];
}

export interface UpdateAccessServicePayload {
  name?: string;
  slug?: string;
  description?: string | null;
  requireManagerApproval?: boolean;
  instructions?: string | null;
  assignees?: AccessServiceAssigneePayload[];
}

async function requireFeatureAndPermission(permission: string) {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(
    permission as Parameters<typeof requirePermission>[0],
  );
}

async function resolveAssignees(
  raw: AccessServiceAssigneePayload[],
): Promise<Array<{ userId: string; role: AccessServiceRole }>> {
  const repo = getContainer().get<IAccessServiceRepository>(
    DI_TOKENS.IAccessServiceRepository,
  );
  const resolved: Array<{ userId: string; role: AccessServiceRole }> = [];
  for (const a of raw) {
    if (a.userId) {
      resolved.push({ userId: a.userId, role: a.role });
    } else if (a.email) {
      const userId = await repo.findActiveUserIdByEmail(a.email);
      if (userId) resolved.push({ userId, role: a.role });
    }
  }
  return resolved;
}

export async function listAccessServicesAction(opts?: {
  activeOnly?: boolean;
}): Promise<ActionResponse<AccessServiceData[]>> {
  try {
    await requireFeatureAndPermission(
      PERMISSIONS.WORKFLOWS_ACCESS_SERVICES_VIEW,
    );
    const uc = getContainer().get<ListAccessServicesUseCase>(
      DI_TOKENS.ListAccessServicesUseCase,
    );
    const data = await uc.execute({ activeOnly: opts?.activeOnly });
    return { success: true, data };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listAccessServicesAction" },
      "Failed to list access services",
    );
  }
}

export async function getAccessServiceAction(
  id: string,
): Promise<ActionResponse<AccessServiceData>> {
  try {
    await requireFeatureAndPermission(
      PERMISSIONS.WORKFLOWS_ACCESS_SERVICES_VIEW,
    );
    const uc = getContainer().get<GetAccessServiceUseCase>(
      DI_TOKENS.GetAccessServiceUseCase,
    );
    const data = await uc.execute({ id });
    return { success: true, data };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getAccessServiceAction" },
      "Failed to get access service",
    );
  }
}

export async function createAccessServiceAction(
  payload: CreateAccessServicePayload,
): Promise<ActionResponse<AccessServiceData>> {
  try {
    await requireFeatureAndPermission(
      PERMISSIONS.WORKFLOWS_ACCESS_SERVICES_CREATE,
    );
    const session = await getSession();
    const uc = getContainer().get<CreateAccessServiceUseCase>(
      DI_TOKENS.CreateAccessServiceUseCase,
    );
    const assignees = payload.assignees
      ? await resolveAssignees(payload.assignees)
      : [];
    const data = await uc.execute({
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      requireManagerApproval: payload.requireManagerApproval,
      instructions: payload.instructions,
      assignees,
      createdById: session?.user?.id ?? null,
    });
    revalidatePath("/workflows/admin/access-services");
    return { success: true, data };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createAccessServiceAction" },
      "Failed to create access service",
    );
  }
}

export async function updateAccessServiceAction(
  id: string,
  payload: UpdateAccessServicePayload,
): Promise<ActionResponse<AccessServiceData>> {
  try {
    await requireFeatureAndPermission(
      PERMISSIONS.WORKFLOWS_ACCESS_SERVICES_UPDATE,
    );
    const session = await getSession();
    const uc = getContainer().get<UpdateAccessServiceUseCase>(
      DI_TOKENS.UpdateAccessServiceUseCase,
    );
    const assignees = payload.assignees
      ? await resolveAssignees(payload.assignees)
      : undefined;
    const data = await uc.execute({
      id,
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      requireManagerApproval: payload.requireManagerApproval,
      instructions: payload.instructions,
      assignees,
      updatedById: session?.user?.id ?? null,
    });
    revalidatePath("/workflows/admin/access-services");
    return { success: true, data };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateAccessServiceAction" },
      "Failed to update access service",
    );
  }
}

export async function toggleAccessServiceStatusAction(
  id: string,
  isActive: boolean,
): Promise<ActionResponse<AccessServiceData>> {
  try {
    await requireFeatureAndPermission(
      PERMISSIONS.WORKFLOWS_ACCESS_SERVICES_MANAGE,
    );
    const session = await getSession();
    const uc = getContainer().get<ToggleAccessServiceStatusUseCase>(
      DI_TOKENS.ToggleAccessServiceStatusUseCase,
    );
    const data = await uc.execute({
      id,
      isActive,
      updatedById: session?.user?.id ?? null,
    });
    revalidatePath("/workflows/admin/access-services");
    return { success: true, data };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "toggleAccessServiceStatusAction" },
      "Failed to toggle access service status",
    );
  }
}

export async function importAccessServicesAction(
  formData: FormData,
  opts?: { dryRun?: boolean; confirmedHash?: string },
): Promise<ActionResponse<ImportAccessServicesResult>> {
  try {
    await requireFeatureAndPermission(
      PERMISSIONS.WORKFLOWS_ACCESS_SERVICES_MANAGE,
    );
    const session = await getSession();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { success: false, error: "No file uploaded." };
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const uc = getContainer().get<ImportAccessServicesUseCase>(
      DI_TOKENS.ImportAccessServicesUseCase,
    );
    const result = await uc.execute({
      csvBytes: bytes,
      dryRun: opts?.dryRun ?? false,
      confirmedHash: opts?.confirmedHash,
      importedById: session?.user?.id ?? null,
    });
    if (!opts?.dryRun) {
      revalidatePath("/workflows/admin/access-services");
    }
    return { success: true, data: result };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "importAccessServicesAction" },
      "Failed to import access services",
    );
  }
}

export async function exportAccessServicesAction(): Promise<
  ActionResponse<{ csvBase64: string }>
> {
  try {
    await requireFeatureAndPermission(
      PERMISSIONS.WORKFLOWS_ACCESS_SERVICES_VIEW,
    );
    const uc = getContainer().get<ExportAccessServicesUseCase>(
      DI_TOKENS.ExportAccessServicesUseCase,
    );
    const csvBuffer = await uc.execute();
    return { success: true, data: { csvBase64: csvBuffer.toString("base64") } };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "exportAccessServicesAction" },
      "Failed to export access services",
    );
  }
}
