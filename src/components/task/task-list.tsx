/**
 * Task List Component
 *
 * Displays a list of tasks with filtering.
 * Demonstrates client-side state management with server actions.
 */

"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { TaskDTO } from "@/interface-adapters/presenters/task.presenter";
import { listTasksAction } from "@/interface-adapters/controllers/task.controller";
import type { TaskStatus } from "@/core/domain/entities/task.entity";
import { TaskItem } from "./task-item";
import { TaskForm } from "./task-form";
import { TaskFilters } from "./task-filters";

export function TaskList() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskDTO[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | "ALL">(
    "ALL",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);

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

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Filter tasks when status changes
  useEffect(() => {
    if (selectedStatus === "ALL") {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter((task) => task.status === selectedStatus));
    }
  }, [tasks, selectedStatus]);

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

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Tasks</h2>
          <p className="text-muted-foreground">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
            {selectedStatus !== "ALL" && ` (${selectedStatus.toLowerCase()})`}
          </p>
        </div>

        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 gap-2"
        >
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <TaskFilters
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed py-12 text-center">
          <p className="text-muted-foreground">
            {selectedStatus === "ALL"
              ? "No tasks yet. Create one to get started!"
              : `No ${selectedStatus.toLowerCase()} tasks.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={handleSuccess}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Task Form Dialog */}
      <TaskForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        task={editingTask}
      />
    </div>
  );
}
