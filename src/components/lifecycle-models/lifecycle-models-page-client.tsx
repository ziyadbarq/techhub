/**
 * Lifecycle Models Page Client Component
 *
 * Client-side wrapper for the lifecycle models page with state management.
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { LifecycleModelDTO } from "@/interface-adapters/presenters/lifecycle-model.presenter";
import { listLifecycleModelsAction } from "@/interface-adapters/controllers/lifecycle-model.controller";
import { LifecycleModelsTable } from "./lifecycle-models-table";
import { LifecycleModelForm } from "./lifecycle-model-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface LifecycleModelsPageClientProps {
  initialModels: LifecycleModelDTO[];
}

export function LifecycleModelsPageClient({
  initialModels,
}: LifecycleModelsPageClientProps) {
  const [models, setModels] = useState<LifecycleModelDTO[]>(initialModels);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<LifecycleModelDTO | null>(
    null,
  );

  const loadModels = async () => {
    setIsLoading(true);
    try {
      const result = await listLifecycleModelsAction();
      if (result.success) {
        setModels(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load lifecycle models");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (model: LifecycleModelDTO) => {
    setEditingModel(model);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingModel(null);
  };

  const handleSuccess = () => {
    loadModels();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Lifecycle Models</h2>
          <p className="text-muted-foreground">
            {models.length} model{models.length !== 1 ? "s" : ""}
          </p>
        </div>

        <PermissionGuard permission={PERMISSIONS.LIFECYCLE_MODELS_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Model
          </Button>
        </PermissionGuard>
      </div>

      {/* Models Table */}
      <LifecycleModelsTable
        data={models}
        loading={isLoading}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      {/* Model Form Dialog */}
      <LifecycleModelForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        model={editingModel}
      />
    </div>
  );
}
