/**
 * Field Definitions Page Client Component
 */

"use client";

import { useState } from "react";
import { Plus, List, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FieldDefinitionDTO } from "@/interface-adapters/presenters/field-definition.presenter";
import { listFieldDefinitionsAction } from "@/interface-adapters/controllers/field-definition.controller";
import { FieldDefinitionsTable } from "./field-definitions-table";
import { FieldDefinitionForm } from "./field-definition-form";
import { FieldUsageDashboard } from "./field-usage-dashboard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface FieldDefinitionsPageClientProps {
  initialFields: FieldDefinitionDTO[];
}

export function FieldDefinitionsPageClient({
  initialFields,
}: FieldDefinitionsPageClientProps) {
  const [fields, setFields] = useState<FieldDefinitionDTO[]>(initialFields);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingField, setEditingField] = useState<FieldDefinitionDTO | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("list");

  const loadFields = async () => {
    setIsLoading(true);
    try {
      const result = await listFieldDefinitionsAction();
      if (result.success) {
        setFields(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load field definitions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (field: FieldDefinitionDTO) => {
    setEditingField(field);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingField(null);
  };

  const handleSuccess = () => {
    loadFields();
  };

  const handleViewFieldFromDashboard = (field: FieldDefinitionDTO) => {
    handleEdit(field);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Field Definitions</h2>
          <p className="text-muted-foreground">
            {fields.length} field definition{fields.length !== 1 ? "s" : ""}
          </p>
        </div>
        <PermissionGuard permission={PERMISSIONS.FIELD_DEFINITIONS_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Field Definition
          </Button>
        </PermissionGuard>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Field List
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <FieldDefinitionsTable
            data={fields}
            loading={isLoading}
            onEdit={handleEdit}
            onRefresh={handleSuccess}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4">
          <FieldUsageDashboard onViewField={handleViewFieldFromDashboard} />
        </TabsContent>
      </Tabs>

      <FieldDefinitionForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        field={editingField}
      />
    </div>
  );
}
