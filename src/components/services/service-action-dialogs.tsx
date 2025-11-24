/**
 * Service Action Dialogs
 *
 * Unified confirmation dialogs for service actions (delete, retire).
 * Eliminates duplication between similar dialog patterns.
 */

"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Action type for service dialogs
 */
export type ServiceActionType = "delete" | "retire";

/**
 * Service action dialog props
 */
export interface ServiceActionDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to change dialog open state */
  onOpenChange: (open: boolean) => void;
  /** Name of the service for display in the dialog */
  serviceName: string;
  /** Type of action (delete or retire) */
  actionType: ServiceActionType;
  /** Whether the action is currently processing */
  isProcessing: boolean;
  /** Callback when user confirms the action */
  onConfirm: () => void;
}

/**
 * Configuration for each action type
 */
const ACTION_CONFIG: Record<
  ServiceActionType,
  {
    title: string;
    getDescription: (serviceName: string) => string;
    buttonText: string;
    processingText: string;
    buttonClass: string;
  }
> = {
  delete: {
    title: "Delete Service?",
    getDescription: (name) =>
      `This will permanently delete service "${name}". This action cannot be undone.`,
    buttonText: "Delete",
    processingText: "Deleting...",
    buttonClass:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
  retire: {
    title: "Retire Service?",
    getDescription: (name) =>
      `This will mark service "${name}" as RETIRED. This action can be reversed by editing the service status.`,
    buttonText: "Retire",
    processingText: "Retiring...",
    buttonClass: "bg-orange-600 text-white hover:bg-orange-700",
  },
};

/**
 * Unified confirmation dialog for service actions
 *
 * Provides a configurable dialog for delete and retire actions.
 * Eliminates code duplication while maintaining clear action-specific messaging.
 *
 * @example
 * ```tsx
 * function ServiceDetailView({ service }: { service: ServiceDTO }) {
 *   const { deleteDialog, isDeleting, handleDelete } = useServiceActions(service);
 *
 *   return (
 *     <>
 *       <Button onClick={() => deleteDialog.setOpen(true)}>Delete</Button>
 *
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
export function ServiceActionDialog({
  open,
  onOpenChange,
  serviceName,
  actionType,
  isProcessing,
  onConfirm,
}: ServiceActionDialogProps) {
  const config = ACTION_CONFIG[actionType];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{config.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {config.getDescription(serviceName)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isProcessing}
            className={config.buttonClass}
          >
            {isProcessing ? config.processingText : config.buttonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
