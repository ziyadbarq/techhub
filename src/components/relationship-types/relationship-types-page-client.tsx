/**
 * Relationship Types Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { RelationshipTypeDTO } from "@/interface-adapters/dtos/generated/relationship-type.dto";
import { listRelationshipTypesAction } from "@/interface-adapters/controllers/relationship-type.controller";
import { RelationshipTypesTable } from "./relationship-types-table";
import { RelationshipTypeForm } from "./relationship-type-form";
import { RelationshipTypeDetail } from "./relationship-type-detail";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface RelationshipTypesPageClientProps {
  initialTypes: RelationshipTypeDTO[];
}

export function RelationshipTypesPageClient({
  initialTypes,
}: RelationshipTypesPageClientProps) {
  const [types, setTypes] = useState<RelationshipTypeDTO[]>(initialTypes);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<RelationshipTypeDTO | null>(
    null,
  );
  const [editingType, setEditingType] = useState<RelationshipTypeDTO | null>(
    null,
  );

  const loadTypes = async () => {
    setIsLoading(true);
    try {
      const result = await listRelationshipTypesAction();
      if (result.success) {
        setTypes(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load relationship types");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (type: RelationshipTypeDTO) => {
    setSelectedType(type);
  };

  const handleEdit = (type: RelationshipTypeDTO) => {
    setEditingType(type);
    setIsFormOpen(true);
  };

  const handleSuccess = () => {
    loadTypes();
    setIsFormOpen(false);
    setEditingType(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingType(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Relationship Types</h2>
          <p className="text-muted-foreground">
            {types.length} relationship type{types.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <PermissionGuard permission={PERMISSIONS.RELATIONSHIP_TYPES_CREATE}>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
            >
              <Plus className="h-4 w-4" />
              New Relationship Type
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Relationship Types Table */}
      <RelationshipTypesTable
        data={types}
        loading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      {/* Relationship Type Form Dialog */}
      <RelationshipTypeForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        editingType={editingType}
      />

      {/* Relationship Type Detail Dialog */}
      {selectedType && (
        <RelationshipTypeDetail
          type={selectedType}
          onClose={() => setSelectedType(null)}
          onEdit={handleEdit}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
