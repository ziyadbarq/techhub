/**
 * Role Form Component
 *
 * Reusable form for creating and editing roles.
 * Uses React Hook Form with Zod validation.
 */

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { RoleDTO } from "@/interface-adapters/presenters/role.presenter";
import {
  createRoleAction,
  updateRoleAction,
} from "@/interface-adapters/controllers/role.controller";

// Form validation schema
const roleFormSchema = z.object({
  name: z
    .string()
    .min(1, "Role name is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Role name must be lowercase alphanumeric with hyphens only",
    ),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

interface RoleFormProps {
  role?: RoleDTO;
  mode: "create" | "edit";
}

export function RoleForm({ role, mode }: RoleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: role?.name ?? "",
      displayName: role?.displayName ?? "",
      description: role?.description ?? "",
      isActive: role?.isActive ?? true,
    },
  });

  const onSubmit = async (data: RoleFormValues) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        const result = await createRoleAction({
          name: data.name,
          displayName: data.displayName,
          description: data.description,
        });

        if (result.success) {
          toast.success("Role created successfully");
          router.push("/admin/roles");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } else {
        if (!role) {
          toast.error("Role not found");
          return;
        }

        const result = await updateRoleAction({
          id: role.id,
          displayName: data.displayName,
          description: data.description,
          isActive: data.isActive,
        });

        if (result.success) {
          toast.success("Role updated successfully");
          router.push("/admin/roles");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      }
    } catch (_error) {
      toast.error(`Failed to ${mode} role`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSystemRole = role?.isSystem ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create" : "Edit"} Role</CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Create a new role to organize permissions."
            : "Update role details. Note: System roles have limited editability."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="admin-user"
                      {...field}
                      disabled={mode === "edit" || isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for the role. Lowercase, alphanumeric, and
                    hyphens only. Cannot be changed after creation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Admin User"
                      {...field}
                      disabled={isSystemRole || isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Human-readable name shown in the UI.
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
                      placeholder="Describe the role and its purpose..."
                      {...field}
                      disabled={isSystemRole || isSubmitting}
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description to help users understand this role.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === "edit" && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Inactive roles cannot be assigned to users.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSystemRole || isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {isSystemRole && (
              <div className="border-barq-yellow bg-barq-yellow/10 rounded-lg border p-4">
                <p className="text-barq-yellow text-sm">
                  This is a system role. Some fields are read-only to protect
                  system integrity.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting || isSystemRole}
                className="flex-1"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "create" ? "Create Role" : "Update Role"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
