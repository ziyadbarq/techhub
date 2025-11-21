/**
 * Vendor Contact Controller
 * Server actions for Vendor Contact CRUD operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreateVendorContactSchema,
  UpdateVendorContactSchema,
  VendorContactIdSchema,
  type CreateVendorContactDTO,
  type UpdateVendorContactDTO,
} from "../dtos/generated/vendor-contact.dto";
import {
  presentVendorContact,
  presentVendorContacts,
  type VendorContactDTO,
} from "../presenters/vendor-contact.presenter";
import type {
  CreateVendorContactUseCase,
  ListVendorContactsUseCase,
  GetVendorContactUseCase,
  UpdateVendorContactUseCase,
  DeleteVendorContactUseCase,
} from "@/core/use-cases/foundation/vendor-contact";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createVendorContactAction(
  data: CreateVendorContactDTO,
): Promise<ActionResponse<VendorContactDTO>> {
  try {
    await requirePermission(PERMISSIONS.VENDOR_CONTACTS_CREATE);

    const validated = CreateVendorContactSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreateVendorContactUseCase>(
      DI_TOKENS.CreateVendorContactUseCase,
    );

    const contact = await useCase.execute({
      vendorId: validated.vendorId,
      firstName: validated.firstName,
      lastName: validated.lastName,
      title: validated.title ?? undefined,
      email: validated.email ?? undefined,
      phone: validated.phone ?? undefined,
      mobile: validated.mobile ?? undefined,
      role: validated.role ?? undefined,
      isPrimary: validated.isPrimary ?? false,
      note: validated.note ?? undefined,
      metadata: validated.metadata ?? undefined,
    });

    revalidatePath("/vendor-contacts");
    revalidatePath(`/vendors/${validated.vendorId}`);

    return {
      success: true,
      data: presentVendorContact(contact),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createVendorContactAction" },
      "Failed to create vendor contact",
    );
  }
}

export async function listVendorContactsAction(): Promise<
  ActionResponse<VendorContactDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.VENDOR_CONTACTS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListVendorContactsUseCase>(
      DI_TOKENS.ListVendorContactsUseCase,
    );

    const contacts = await useCase.execute();

    return {
      success: true,
      data: presentVendorContacts(contacts),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listVendorContactsAction" },
      "Failed to list vendor contacts",
    );
  }
}

export async function getVendorContactAction(
  id: string,
): Promise<ActionResponse<VendorContactDTO>> {
  try {
    await requirePermission(PERMISSIONS.VENDOR_CONTACTS_VIEW);

    const validated = VendorContactIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetVendorContactUseCase>(
      DI_TOKENS.GetVendorContactUseCase,
    );

    const contact = await useCase.execute(validated.id);

    if (!contact) {
      return {
        success: false,
        error: "Vendor contact not found",
      };
    }

    return {
      success: true,
      data: presentVendorContact(contact),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getVendorContactAction" },
      "Failed to get vendor contact",
    );
  }
}

export async function updateVendorContactAction(
  data: UpdateVendorContactDTO,
): Promise<ActionResponse<VendorContactDTO>> {
  try {
    await requirePermission(PERMISSIONS.VENDOR_CONTACTS_UPDATE);

    const validated = UpdateVendorContactSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdateVendorContactUseCase>(
      DI_TOKENS.UpdateVendorContactUseCase,
    );

    const contact = await useCase.execute({
      id: validated.id,
      firstName: validated.firstName,
      lastName: validated.lastName,
      title: validated.title,
      email: validated.email,
      phone: validated.phone,
      mobile: validated.mobile,
      role: validated.role,
      isPrimary: validated.isPrimary,
      note: validated.note,
      metadata: validated.metadata,
    });

    revalidatePath("/vendor-contacts");
    revalidatePath(`/vendor-contacts/${validated.id}`);
    revalidatePath(`/vendors/${contact.vendorId}`);

    return {
      success: true,
      data: presentVendorContact(contact),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updateVendorContactAction" },
      "Failed to update vendor contact",
    );
  }
}

export async function deleteVendorContactAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.VENDOR_CONTACTS_DELETE);

    const validated = VendorContactIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeleteVendorContactUseCase>(
      DI_TOKENS.DeleteVendorContactUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/vendor-contacts");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deleteVendorContactAction" },
      "Failed to delete vendor contact",
    );
  }
}
