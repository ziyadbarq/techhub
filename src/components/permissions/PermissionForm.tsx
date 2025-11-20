/**
 * PermissionForm Component
 *
 * Form for creating and editing permissions using React Hook Form and Zod validation.
 * Auto-generates permission name from resource and action fields.
 */

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";

import {
  CreatePermissionSchema,
  UpdatePermissionSchema,
  type CreatePermissionDTO,
  type UpdatePermissionDTO,
} from "@/interface-adapters/dtos/generated/permission.dto";
import type { PermissionDTO } from "@/interface-adapters/presenters/permission.presenter";

// type PermissionFormMode = "create" | "edit"; // Unused for now

// Form-specific type with required booleans for form state
type CreatePermissionFormValues = {
  resource: string;
  action: string;
  displayName: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
};

interface CreatePermissionFormProps {
  mode: "create";
  permission?: never;
  onSubmit: (data: CreatePermissionDTO) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

interface EditPermissionFormProps {
  mode: "edit";
  permission: PermissionDTO;
  onSubmit: (data: UpdatePermissionDTO) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

type PermissionFormProps = CreatePermissionFormProps | EditPermissionFormProps;

export function PermissionForm(props: PermissionFormProps) {
  const { mode, onCancel, isSubmitting = false } = props;
  const isEditMode = mode === "edit";

  if (isEditMode) {
    return (
      <EditPermissionFormInner
        permission={props.permission}
        onSubmit={props.onSubmit}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <CreatePermissionFormInner
      onSubmit={props.onSubmit}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
    />
  );
}

function CreatePermissionFormInner({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (data: CreatePermissionDTO) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
}) {
  const form = useForm<CreatePermissionFormValues>({
    // @ts-expect-error - Zod .default() makes fields optional in inferred type, but they're always present after validation
    resolver: zodResolver(CreatePermissionSchema),
    defaultValues: {
      resource: "",
      action: "",
      displayName: "",
      description: "",
      isSystem: false,
      isActive: true,
    },
  });

  // Type-safe control for FormField components (Zod .default() causes type mismatches)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const control = form.control as any;

  // Watch resource and action for auto-generating permission name
  // eslint-disable-next-line react-hooks/incompatible-library
  const resource = form.watch("resource");
  const action = form.watch("action");

  // Generate permission name preview
  const permissionName = React.useMemo(() => {
    if (resource && action) {
      const resourceStr = String(resource).toLowerCase().trim();
      const actionStr = String(action).toLowerCase().trim();
      return `${resourceStr}:${actionStr}`;
    }
    return "";
  }, [resource, action]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    // Zod will apply defaults during validation
    await onSubmit(data as CreatePermissionDTO);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Permission Name Preview */}
        {permissionName && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4" />
                Permission Key Preview
              </CardTitle>
              <CardDescription>
                This is the unique identifier for the permission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <code className="bg-muted text-foreground block rounded px-3 py-2 font-mono text-sm">
                {permissionName}
              </code>
            </CardContent>
          </Card>
        )}

        {/* Resource and Action */}
        <>
          <FormField
            control={control}
            name="resource"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resource</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., tasks, users, settings"
                    {...field}
                    onChange={(e) => {
                      // Convert to lowercase and remove spaces
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-");
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  The resource this permission applies to (lowercase,
                  hyphenated)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="action"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Action</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., view, create, update, delete"
                    {...field}
                    onChange={(e) => {
                      // Convert to lowercase and allow colons for nested actions
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-");
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  The action allowed on the resource (lowercase, can use colons
                  for nesting)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />
        </>

        {/* Display Name */}
        <FormField
          control={control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., View Tasks, Create Users"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Human-readable name shown in the UI
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this permission allows..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Additional context about what this permission grants
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Active Status */}
        <FormField
          control={control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  Only active permissions are enforced in the system
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value as boolean}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* System Permission Flag */}
        <FormField
          control={control}
          name="isSystem"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">System Permission</FormLabel>
                <FormDescription>
                  System permissions cannot be deleted or modified
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value as boolean}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>Create Permission</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function EditPermissionFormInner({
  permission,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  permission: PermissionDTO;
  onSubmit: (data: UpdatePermissionDTO) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
}) {
  const isSystemPermission = permission.isSystem;

  const form = useForm<UpdatePermissionDTO>({
    resolver: zodResolver(UpdatePermissionSchema),
    defaultValues: {
      id: permission.id,
      displayName: permission.displayName,
      description: permission.description ?? "",
      isActive: permission.isActive,
    },
  });

  // Type-safe control for FormField components
  const control = form.control;

  const handleSubmit = async (data: UpdatePermissionDTO) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Permission Name Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" />
              Permission Key
            </CardTitle>
            <CardDescription>
              This is the unique identifier for the permission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <code className="bg-muted text-foreground block rounded px-3 py-2 font-mono text-sm">
              {permission.name}
            </code>
          </CardContent>
        </Card>

        {/* Display Name */}
        <FormField
          control={control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., View Tasks, Create Users"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Human-readable name shown in the UI
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this permission allows..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Additional context about what this permission grants
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Active Status */}
        <FormField
          control={control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  Only active permissions are enforced in the system
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value as boolean}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* System Permission Warning */}
        {isSystemPermission && (
          <Card className="border-warning bg-warning/10">
            <CardContent className="pt-6">
              <p className="text-warning-foreground text-sm">
                <strong>System Permission:</strong> Resource and action cannot
                be modified for system permissions.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>Update Permission</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
