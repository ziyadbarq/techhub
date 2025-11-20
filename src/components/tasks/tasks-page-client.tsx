/**
 * Tasks Page Client Component
 *
 * Client-side wrapper for the tasks page with state management.
 * Manages table data, form dialogs, and CSV import.
 */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { TaskDTO } from "@/interface-adapters/presenters/task.presenter";
import { listTasksAction } from "@/interface-adapters/controllers/task.controller";
import { TasksTable } from "./tasks-table";
import { TaskForm } from "../task/task-form";
import { CSVImportModal } from "./csv-import-modal";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface TasksPageClientProps {
  initialTasks: TaskDTO[];
}

export function TasksPageClient({ initialTasks }: TasksPageClientProps) {
  const [tasks, setTasks] = useState<TaskDTO[]>(initialTasks);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const result = await listTasksAction();
      if (result.success) {
        setTasks(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (task: TaskDTO) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleSuccess = () => {
    loadTasks();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Tasks</h2>
          <p className="text-muted-foreground">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </p>
        </div>

        <PermissionGuard permission={PERMISSIONS.TASKS_CREATE}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </PermissionGuard>
      </div>

      {/* Tasks Table */}
      <TasksTable
        data={tasks}
        loading={isLoading}
        onEdit={handleEdit}
        onRefresh={handleSuccess}
        onImport={() => setIsImportOpen(true)}
      />

      {/* Task Form Dialog */}
      <TaskForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        task={editingTask}
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
