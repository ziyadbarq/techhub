/**
 * Edit Permission Client Component
 *
 * Client-side wrapper for the permission edit form.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PermissionForm } from "@/components/permissions/PermissionForm";
import { updatePermissionAction } from "@/interface-adapters/controllers/permission.controller";
import type { UpdatePermissionDTO } from "@/interface-adapters/dtos/generated/permission.dto";
import type { PermissionDTO } from "@/interface-adapters/presenters/permission.presenter";
import { logger } from "@/lib/logger";

interface EditPermissionClientProps {
  permission: PermissionDTO;
}

export function EditPermissionClient({
  permission,
}: EditPermissionClientProps) {
  const log = logger.scope("EditPermissionClient");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: UpdatePermissionDTO) => {
    setIsSubmitting(true);
    try {
      const result = await updatePermissionAction(data);

      if (result.success) {
        toast.success("Permission updated successfully");
        router.push("/admin/permissions");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to update permission");
      log.error("handleSubmit", "Failed to update permission", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <PermissionForm
      mode="edit"
      permission={permission}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
    />
  );
}
