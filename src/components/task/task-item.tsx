/**
 * Task Item Component
 *
 * Displays a single task with actions.
 * Demonstrates UI component patterns in Clean Architecture.
 */

"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import type { TaskDTO } from "@/interface-adapters/presenters/task.presenter";
import {
  completeTaskAction,
  deleteTaskAction,
} from "@/interface-adapters/controllers/task.controller";
import { TaskStatus } from "@/core/domain/entities/task.entity";

interface TaskItemProps {
  task: TaskDTO;
  onUpdate: () => void;
  onEdit: (task: TaskDTO) => void;
}

export function TaskItem({ task, onUpdate, onEdit }: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const result = await completeTaskAction(task.id);
      if (result.success) {
        toast.success("Task completed!");
        onUpdate();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to complete task");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteTaskAction(task.id);
      if (result.success) {
        toast.success("Task deleted!");
        onUpdate();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return "bg-success/10 text-success hover:bg-success/20";
      case TaskStatus.IN_PROGRESS:
        return "bg-barq-light-blue/10 text-barq-light-blue hover:bg-barq-light-blue/20";
      case TaskStatus.PENDING:
      default:
        return "bg-muted text-muted-foreground hover:bg-muted";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return "Completed";
      case TaskStatus.IN_PROGRESS:
        return "In Progress";
      case TaskStatus.PENDING:
      default:
        return "Pending";
    }
  };

  const isCompleted = task.status === TaskStatus.COMPLETED;

  return (
    <Card className={isCompleted ? "opacity-75" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className={isCompleted ? "line-through" : ""}>
              {task.title}
            </CardTitle>
            <CardDescription className="mt-1.5">
              Created {format(new Date(task.createdAt), "PPp")}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(task.status)} variant="secondary">
            {getStatusLabel(task.status)}
          </Badge>
        </div>
      </CardHeader>

      {task.description && (
        <CardContent>
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">
            {task.description}
          </p>
        </CardContent>
      )}

      <CardContent className="flex gap-2">
        {!isCompleted && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handleComplete}
              disabled={isCompleting}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Complete
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(task)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={isDeleting}
              className="ml-auto gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{task.title}"? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
