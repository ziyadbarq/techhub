/**
 * Service Actions Hook
 *
 * Manages state and handlers for service actions (delete, retire).
 * Extracts action logic from detail view components for reusability.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ServiceDTO } from "@/interface-adapters/presenters/service.presenter";
import {
  deleteServiceAction,
  retireServiceAction,
} from "@/interface-adapters/controllers/service.controller";

/**
 * Dialog state interface
 */
export interface DialogState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

/**
 * Service actions hook return type
 */
export interface UseServiceActionsReturn {
  deleteDialog: DialogState;
  retireDialog: DialogState;
  isDeleting: boolean;
  isRetiring: boolean;
  handleDelete: () => Promise<void>;
  handleRetire: () => Promise<void>;
}

/**
 * Hook for managing service actions (delete, retire)
 *
 * Provides dialog state management and action handlers for service operations.
 * Handles loading states, error handling, and navigation after successful actions.
 *
 * @param service - Service DTO object
 * @returns Dialog states and action handlers
 *
 * @example
 * ```tsx
 * function ServiceDetailView({ service }: { service: ServiceDTO }) {
 *   const {
 *     deleteDialog,
 *     retireDialog,
 *     isDeleting,
 *     isRetiring,
 *     handleDelete,
 *     handleRetire,
 *   } = useServiceActions(service);
 *
 *   return (
 *     <>
 *       <Button onClick={() => deleteDialog.setOpen(true)}>Delete</Button>
 *       <ServiceActionDialog
 *         open={deleteDialog.open}
 *         onOpenChange={deleteDialog.setOpen}
 *         serviceName={service.name}
 *         actionType="delete"
 *         isProcessing={isDeleting}
 *         onConfirm={handleDelete}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function useServiceActions(
  service: ServiceDTO,
): UseServiceActionsReturn {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [retireDialogOpen, setRetireDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetiring, setIsRetiring] = useState(false);

  /**
   * Handle service deletion
   *
   * Deletes the service and navigates to the services list on success.
   */
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteServiceAction(service.id);
      if (result.success) {
        toast.success("Service deleted successfully");
        router.push("/services");
      } else {
        toast.error(result.error || "Failed to delete service");
      }
    } catch (_error) {
      toast.error("Failed to delete service");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  /**
   * Handle service retirement
   *
   * Marks the service as retired and refreshes the current page on success.
   */
  const handleRetire = async () => {
    setIsRetiring(true);
    try {
      const result = await retireServiceAction(service.id);
      if (result.success) {
        toast.success("Service retired successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to retire service");
      }
    } catch (_error) {
      toast.error("Failed to retire service");
    } finally {
      setIsRetiring(false);
      setRetireDialogOpen(false);
    }
  };

  return {
    deleteDialog: {
      open: deleteDialogOpen,
      setOpen: setDeleteDialogOpen,
    },
    retireDialog: {
      open: retireDialogOpen,
      setOpen: setRetireDialogOpen,
    },
    isDeleting,
    isRetiring,
    handleDelete,
    handleRetire,
  };
}
