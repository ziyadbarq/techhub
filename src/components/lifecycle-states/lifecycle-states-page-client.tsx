/**
 * Lifecycle States Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { LifecycleModelDTO } from "@/interface-adapters/presenters/lifecycle-model.presenter";
import type { LifecycleStateDTO } from "@/interface-adapters/presenters/lifecycle-state.presenter";
import { listLifecycleStatesAction } from "@/interface-adapters/controllers/lifecycle-state.controller";
import { LifecycleStatesTable } from "./lifecycle-states-table";
import { LifecycleStateForm } from "./lifecycle-state-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface LifecycleStatesPageClientProps {
  initialStates: LifecycleStateDTO[];
  models?: LifecycleModelDTO[];
  modelId?: string;
}

export function LifecycleStatesPageClient({
  initialStates,
  models = [],
  modelId,
}: LifecycleStatesPageClientProps) {
  const [states, setStates] = useState<LifecycleStateDTO[]>(initialStates);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingState, setEditingState] = useState<LifecycleStateDTO | null>(
    null,
  );

  const loadStates = async () => {
    setIsLoading(true);
    try {
      const result = await listLifecycleStatesAction();
      if (result.success) {
        setStates(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load lifecycle states");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (state: LifecycleStateDTO) => {
    setEditingState(state);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingState(null);
  };

  const handleSuccess = () => {
    loadStates();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Lifecycle States</h2>
          <p className="text-muted-foreground">
            {states.length} state{states.length !== 1 ? "s" : ""}
          </p>
        </div>

        <PermissionGuard permission={PERMISSIONS.LIFECYCLE_STATES_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New State
          </Button>
        </PermissionGuard>
      </div>

      {/* States Table */}
      <LifecycleStatesTable
        data={states}
        loading={isLoading}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      {/* State Form Dialog */}
      <LifecycleStateForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        state={editingState}
        modelId={modelId ?? ""}
        models={models}
      />
    </div>
  );
}
