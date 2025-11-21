/**
 * CI Relationships Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { CIRelationshipDTO } from "@/interface-adapters/dtos/generated/ci-relationship.dto";
import { listCIRelationshipsAction } from "@/interface-adapters/controllers/ci-relationship.controller";
import { CIRelationshipsTable } from "./ci-relationships-table";
import { CIRelationshipForm } from "./ci-relationship-form";
import { CIRelationshipDetail } from "./ci-relationship-detail";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface CIRelationshipsPageClientProps {
  initialRelationships: CIRelationshipDTO[];
}

export function CIRelationshipsPageClient({
  initialRelationships,
}: CIRelationshipsPageClientProps) {
  const [relationships, setRelationships] =
    useState<CIRelationshipDTO[]>(initialRelationships);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] =
    useState<CIRelationshipDTO | null>(null);
  const [editingRelationship, setEditingRelationship] =
    useState<CIRelationshipDTO | null>(null);

  const loadRelationships = async () => {
    setIsLoading(true);
    try {
      const result = await listCIRelationshipsAction();
      if (result.success) {
        setRelationships(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load relationships");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (relationship: CIRelationshipDTO) => {
    setSelectedRelationship(relationship);
  };

  const handleEdit = (relationship: CIRelationshipDTO) => {
    setEditingRelationship(relationship);
    setIsFormOpen(true);
  };

  const handleSuccess = () => {
    loadRelationships();
    setIsFormOpen(false);
    setEditingRelationship(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingRelationship(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">CI Relationships</h2>
          <p className="text-muted-foreground">
            {relationships.length} relationship
            {relationships.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <PermissionGuard permission={PERMISSIONS.CI_RELATIONSHIPS_CREATE}>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
            >
              <Plus className="h-4 w-4" />
              New Relationship
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* CI Relationships Table */}
      <CIRelationshipsTable
        data={relationships}
        loading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
      />

      {/* CI Relationship Form Dialog */}
      <CIRelationshipForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        editingRelationship={editingRelationship}
      />

      {/* CI Relationship Detail Dialog */}
      {selectedRelationship && (
        <CIRelationshipDetail
          relationship={selectedRelationship}
          onClose={() => setSelectedRelationship(null)}
          onEdit={handleEdit}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
