/**
 * Task Form Component
 *
 * Dialog form for creating and editing tasks.
 * Demonstrates form handling with React Hook Form and server actions.
 */

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import type { TaskDTO } from "@/interface-adapters/presenters/task.presenter";
import {
  createTaskAction,
  updateTaskAction,
} from "@/interface-adapters/controllers/task.controller";
import {
  CreateTaskSchema,
  type CreateTaskDTO,
} from "@/interface-adapters/dtos/task.dto";

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  task?: TaskDTO | null;
}

export function TaskForm({
  open,
  onOpenChange,
  onSuccess,
  task,
}: TaskFormProps) {
  const isEditing = !!task;

  const form = useForm<CreateTaskDTO>({
    resolver: zodResolver(CreateTaskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
    },
  });

  // Reset form when task changes
  useEffect(() => {
    form.reset({
      title: task?.title ?? "",
      description: task?.description ?? "",
    });
  }, [task, form]);

  const onSubmit = async (data: CreateTaskDTO) => {
    try {
      const result = isEditing
        ? await updateTaskAction({
            id: task.id,
            ...data,
          })
        : await createTaskAction(data);

      if (result.success) {
        toast.success(isEditing ? "Task updated!" : "Task created!");
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error(
        isEditing ? "Failed to update task" : "Failed to create task",
      );
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Create Task"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the task details below."
              : "Add a new task to your list."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Title <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter task title..."
                      maxLength={200}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/200 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter task description (optional)..."
                      maxLength={2000}
                      rows={4}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/2000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
              >
                {form.formState.isSubmitting
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
                  : isEditing
                    ? "Update Task"
                    : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
