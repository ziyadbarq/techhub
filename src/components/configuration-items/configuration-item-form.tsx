/**
 * Configuration Item Form Component
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { z } from "zod";
import {
  createConfigurationItemAction,
  updateConfigurationItemAction,
} from "@/interface-adapters/controllers/configuration-item.controller";
import {
  CreateConfigurationItemSchema,
  UpdateConfigurationItemSchema,
  type ConfigurationItemDTO,
} from "@/interface-adapters/dtos/generated/configuration-item.dto";

interface ConfigurationItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingItem?: ConfigurationItemDTO | null;
}

type CreateFormValues = z.input<typeof CreateConfigurationItemSchema>;
type CreateFormOutput = z.output<typeof CreateConfigurationItemSchema>;
type UpdateFormValues = z.input<typeof UpdateConfigurationItemSchema>;
type UpdateFormOutput = z.output<typeof UpdateConfigurationItemSchema>;

export function ConfigurationItemForm({
  open,
  onOpenChange,
  onSuccess,
  editingItem,
}: ConfigurationItemFormProps) {
  const isEditing = !!editingItem;

  const createForm = useForm<CreateFormValues, undefined, CreateFormOutput>({
    resolver: zodResolver(CreateConfigurationItemSchema),
    defaultValues: {
      name: "",
      ciClassId: "",
      lifecycleStateId: null,
      criticality: null,
      environment: null,
      primaryOwnerPersonId: null,
      primaryOwnerOrgUnitId: null,
      locationId: null,
      linkedAssetId: null,
      ciKey: null,
      description: null,
      attributes: null,
    },
  });

  const updateForm = useForm<UpdateFormValues, undefined, UpdateFormOutput>({
    resolver: zodResolver(UpdateConfigurationItemSchema),
    defaultValues: {
      name: "",
      lifecycleStateId: null,
      criticality: null,
      environment: null,
      primaryOwnerPersonId: null,
      primaryOwnerOrgUnitId: null,
      locationId: null,
      linkedAssetId: null,
      ciKey: null,
      description: null,
      attributes: null,
    },
  });

  useEffect(() => {
    if (open && editingItem) {
      updateForm.reset({
        name: editingItem.name,
        lifecycleStateId: editingItem.lifecycleStateId,
        criticality: editingItem.criticality as
          | "LOW"
          | "MEDIUM"
          | "HIGH"
          | "CRITICAL"
          | null
          | undefined,
        environment: editingItem.environment as
          | "PROD"
          | "UAT"
          | "DEV"
          | "DR"
          | "TEST"
          | "OTHER"
          | null
          | undefined,
        primaryOwnerPersonId: editingItem.primaryOwnerPersonId,
        primaryOwnerOrgUnitId: editingItem.primaryOwnerOrgUnitId,
        locationId: editingItem.locationId,
        linkedAssetId: editingItem.linkedAssetId,
        ciKey: editingItem.ciKey,
        description: editingItem.description,
        attributes: editingItem.attributes,
      });
    } else if (open && !editingItem) {
      createForm.reset();
    }
  }, [open, editingItem, createForm, updateForm]);

  const onCreateSubmit = async (data: CreateFormOutput) => {
    try {
      const result = await createConfigurationItemAction(data);
      if (result.success) {
        toast.success("Configuration item created successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to create configuration item");
    }
  };

  const onUpdateSubmit = async (data: UpdateFormOutput) => {
    try {
      const result = await updateConfigurationItemAction(editingItem!.id, data);
      if (result.success) {
        toast.success("Configuration item updated successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to update configuration item");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Configuration Item" : "New Configuration Item"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the configuration item details below."
              : "Create a new configuration item in the CMDB."}
          </DialogDescription>
        </DialogHeader>

        {!isEditing ? (
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onCreateSubmit)}
              className="space-y-4"
            >
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter configuration item name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="ciClassId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CI Class *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter CI Class ID (temporary)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      TODO: Replace with CI Class selector dropdown
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="ciKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CI Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., APP-001, SRV-PROD-DB-01"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Unique identifier using alphanumeric characters, dots,
                      hyphens, and underscores
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="criticality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Criticality</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select criticality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Environment</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select environment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PROD">Production</SelectItem>
                          <SelectItem value="UAT">UAT</SelectItem>
                          <SelectItem value="DEV">Development</SelectItem>
                          <SelectItem value="TEST">Test</SelectItem>
                          <SelectItem value="DR">Disaster Recovery</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter description"
                        rows={3}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
                  disabled={createForm.formState.isSubmitting}
                >
                  {createForm.formState.isSubmitting ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...updateForm}>
            <form
              onSubmit={updateForm.handleSubmit(onUpdateSubmit)}
              className="space-y-4"
            >
              <FormField
                control={updateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter configuration item name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="ciKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CI Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., APP-001, SRV-PROD-DB-01"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Unique identifier using alphanumeric characters, dots,
                      hyphens, and underscores
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={updateForm.control}
                  name="criticality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Criticality</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select criticality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={updateForm.control}
                  name="environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Environment</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select environment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PROD">Production</SelectItem>
                          <SelectItem value="UAT">UAT</SelectItem>
                          <SelectItem value="DEV">Development</SelectItem>
                          <SelectItem value="TEST">Test</SelectItem>
                          <SelectItem value="DR">Disaster Recovery</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={updateForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter description"
                        rows={3}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
                  disabled={updateForm.formState.isSubmitting}
                >
                  {updateForm.formState.isSubmitting ? "Updating..." : "Update"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
