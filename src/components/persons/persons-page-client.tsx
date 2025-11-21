/**
 * Persons Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import { listPersonsAction } from "@/interface-adapters/controllers/person.controller";
import { PersonsTable } from "./persons-table";
import { PersonForm } from "./person-form";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface PersonsPageClientProps {
  initialPersons: PersonDTO[];
}

export function PersonsPageClient({ initialPersons }: PersonsPageClientProps) {
  const [persons, setPersons] = useState<PersonDTO[]>(initialPersons);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonDTO | null>(null);

  const loadPersons = async () => {
    setIsLoading(true);
    try {
      const result = await listPersonsAction();
      if (result.success) {
        setPersons(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load persons");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Persons</h2>
          <p className="text-muted-foreground">
            {persons.length} person{persons.length !== 1 ? "s" : ""}
          </p>
        </div>
        <PermissionGuard permission={PERMISSIONS.PERSONS_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Person
          </Button>
        </PermissionGuard>
      </div>

      <PersonsTable
        data={persons}
        loading={isLoading}
        onEdit={(person) => {
          setEditingPerson(person);
          setIsFormOpen(true);
        }}
        onRefresh={loadPersons}
      />
      <PersonForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingPerson(null);
        }}
        onSuccess={loadPersons}
        person={editingPerson}
      />
    </div>
  );
}
