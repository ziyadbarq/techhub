/**
 * Person Role Assignments Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PersonRoleAssignmentDTO } from "@/interface-adapters/presenters/person-role-assignment.presenter";
import { listPersonRoleAssignmentsAction } from "@/interface-adapters/controllers/person-role-assignment.controller";
import { PersonRoleAssignmentsTable } from "./person-role-assignments-table";
import { PersonRoleAssignmentForm } from "./person-role-assignment-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface PersonRoleAssignmentsPageClientProps {
  initialAssignments: PersonRoleAssignmentDTO[];
}

export function PersonRoleAssignmentsPageClient({
  initialAssignments,
}: PersonRoleAssignmentsPageClientProps) {
  const [assignments, setAssignments] =
    useState<PersonRoleAssignmentDTO[]>(initialAssignments);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<PersonRoleAssignmentDTO | null>(null);

  const loadAssignments = async () => {
    setIsLoading(true);
    try {
      const result = await listPersonRoleAssignmentsAction();
      if (result.success) {
        setAssignments(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load assignments");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Person Role Assignments</h2>
          <p className="text-muted-foreground">
            {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <PermissionGuard
          permission={PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_CREATE}
        >
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Assignment
          </Button>
        </PermissionGuard>
      </div>

      <PersonRoleAssignmentsTable
        data={assignments}
        loading={isLoading}
        onEdit={(assignment) => {
          setEditingAssignment(assignment);
          setIsFormOpen(true);
        }}
        onRefresh={loadAssignments}
      />
      <PersonRoleAssignmentForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingAssignment(null);
        }}
        onSuccess={loadAssignments}
        assignment={editingAssignment}
        personId=""
        roleId=""
      />
    </div>
  );
}
