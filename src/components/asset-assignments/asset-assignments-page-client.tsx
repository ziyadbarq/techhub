/**
 * Asset Assignments Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { AssetAssignmentDTO } from "@/interface-adapters/presenters/asset-assignment.presenter";
import { listAssetAssignmentsAction } from "@/interface-adapters/controllers/asset-assignment.controller";
import { AssetAssignmentsTable } from "./asset-assignments-table";
import { AssetAssignmentForm } from "./asset-assignment-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface AssetAssignmentsPageClientProps {
  initialAssetAssignments: AssetAssignmentDTO[];
}

export function AssetAssignmentsPageClient({
  initialAssetAssignments,
}: AssetAssignmentsPageClientProps) {
  const [assetAssignments, setAssetAssignments] = useState<
    AssetAssignmentDTO[]
  >(initialAssetAssignments);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssetAssignment, setEditingAssetAssignment] =
    useState<AssetAssignmentDTO | null>(null);

  const loadAssetAssignments = async () => {
    setIsLoading(true);
    try {
      const result = await listAssetAssignmentsAction();
      if (result.success) {
        setAssetAssignments(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load asset assignments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (assetAssignment: AssetAssignmentDTO) => {
    setEditingAssetAssignment(assetAssignment);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAssetAssignment(null);
  };

  const handleSuccess = () => {
    loadAssetAssignments();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Asset Assignments</h2>
          <p className="text-muted-foreground">
            {assetAssignments.length} assignment
            {assetAssignments.length !== 1 ? "s" : ""}
          </p>
        </div>

        <PermissionGuard permission={PERMISSIONS.ASSET_ASSIGNMENTS_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Assignment
          </Button>
        </PermissionGuard>
      </div>

      {/* Asset Assignments Table */}
      <AssetAssignmentsTable
        data={assetAssignments}
        loading={isLoading}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      {/* Asset Assignment Form Dialog */}
      <AssetAssignmentForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        assetAssignment={editingAssetAssignment}
      />
    </div>
  );
}
