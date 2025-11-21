/**
 * Lifecycle Transitions Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { LifecycleTransitionDTO } from "@/interface-adapters/presenters/lifecycle-transition.presenter";
import { listLifecycleTransitionsAction } from "@/interface-adapters/controllers/lifecycle-transition.controller";
import { LifecycleTransitionsTable } from "./lifecycle-transitions-table";
import { LifecycleTransitionForm } from "./lifecycle-transition-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface LifecycleTransitionsPageClientProps {
  initialTransitions: LifecycleTransitionDTO[];
  modelId?: string;
}

export function LifecycleTransitionsPageClient({
  initialTransitions,
  modelId,
}: LifecycleTransitionsPageClientProps) {
  const [transitions, setTransitions] =
    useState<LifecycleTransitionDTO[]>(initialTransitions);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransition, setEditingTransition] =
    useState<LifecycleTransitionDTO | null>(null);

  const loadTransitions = async () => {
    setIsLoading(true);
    try {
      const result = await listLifecycleTransitionsAction();
      if (result.success) {
        setTransitions(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load lifecycle transitions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (transition: LifecycleTransitionDTO) => {
    setEditingTransition(transition);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTransition(null);
  };

  const handleSuccess = () => {
    loadTransitions();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Lifecycle Transitions</h2>
          <p className="text-muted-foreground">
            {transitions.length} transition{transitions.length !== 1 ? "s" : ""}
          </p>
        </div>

        <PermissionGuard permission={PERMISSIONS.LIFECYCLE_TRANSITIONS_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Transition
          </Button>
        </PermissionGuard>
      </div>

      {/* Transitions Table */}
      <LifecycleTransitionsTable
        data={transitions}
        loading={isLoading}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      {/* Transition Form Dialog */}
      <LifecycleTransitionForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        transition={editingTransition}
        modelId={modelId ?? ""}
        fromStateId=""
        toStateId=""
      />
    </div>
  );
}
