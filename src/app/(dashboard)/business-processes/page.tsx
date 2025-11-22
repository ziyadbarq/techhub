/**
 * Business Processes List Page
 */

"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { BusinessProcessesTable } from "@/components/services/business-processes-table";
import { BusinessProcessForm } from "@/components/services/business-process-form";
import { listBusinessProcessesAction } from "@/interface-adapters/controllers/business-process.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";
import type { BusinessProcessDTO } from "@/interface-adapters/presenters/service.presenter";

export default function BusinessProcessesPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.BUSINESS_PROCESSES_MANAGE);

  const [processes, setProcesses] = React.useState<BusinessProcessDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingProcess, setEditingProcess] =
    React.useState<BusinessProcessDTO | null>(null);

  const loadProcesses = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listBusinessProcessesAction();
      if (result.success) {
        setProcesses(result.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProcesses();
  }, [loadProcesses]);

  const handleEdit = (process: BusinessProcessDTO) => {
    setEditingProcess(process);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingProcess(null);
  };

  const handleFormSuccess = () => {
    loadProcesses();
    router.refresh();
  };

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Processes</h1>
          <p className="text-muted-foreground mt-1">
            Manage business processes and their relationships to services
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditingProcess(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Business Process
          </Button>
        )}
      </div>

      <BusinessProcessesTable
        data={processes}
        loading={loading}
        onEdit={handleEdit}
      />

      <BusinessProcessForm
        open={formOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleFormSuccess}
        businessProcess={editingProcess}
      />
    </div>
  );
}
