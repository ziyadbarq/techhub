/**
 * Configuration Item Form Component
 */

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@/components/ui/separator";
import {
  CICustomFieldsSection,
  type CustomFieldValues,
} from "@/components/custom-fields";
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
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
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
import { useConfigurationItemReferenceData } from "@/hooks/use-configuration-item-reference-data";

interface ConfigurationItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingItem?: ConfigurationItemDTO | null;
}

const NONE_OPTION_VALUE = "__none__";

type CreateFormValues = z.input<typeof CreateConfigurationItemSchema>;
type CreateFormOutput = z.output<typeof CreateConfigurationItemSchema>;
type UpdateFormValues = z.input<typeof UpdateConfigurationItemSchema>;
type UpdateFormOutput = z.output<typeof UpdateConfigurationItemSchema>;
type SharedFormInstance =
  | UseFormReturn<CreateFormValues, undefined, CreateFormOutput>
  | UseFormReturn<UpdateFormValues, undefined, UpdateFormOutput>;

export function ConfigurationItemForm({
  open,
  onOpenChange,
  onSuccess,
  editingItem,
}: ConfigurationItemFormProps) {
  const isEditing = !!editingItem;

  const {
    data: referenceData,
    loading: referenceLoading,
    error: referenceError,
  } = useConfigurationItemReferenceData(open);

  // Custom field values (managed separately from form)
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValues>(
    {},
  );

  // Memoized options for searchable dropdown
  const ciClassOptions: SearchableSelectOption[] = useMemo(
    () =>
      referenceData.ciClasses.map((cls) => ({
        value: cls.id,
        label: `${cls.name} (${cls.code})`,
      })),
    [referenceData.ciClasses],
  );

  const lifecycleStateOptions: SearchableSelectOption[] = useMemo(
    () =>
      referenceData.lifecycleStates.map((state) => ({
        value: state.id,
        label: `${state.name} (${state.code})`,
      })),
    [referenceData.lifecycleStates],
  );

  const personOptions: SearchableSelectOption[] = useMemo(
    () =>
      referenceData.persons.map((person) => ({
        value: person.id,
        label: `${person.firstName} ${person.lastName}${
          person.orgUnitName ? ` • ${person.orgUnitName}` : ""
        }`,
      })),
    [referenceData.persons],
  );

  const orgUnitOptions: SearchableSelectOption[] = useMemo(
    () =>
      referenceData.organizationUnits.map((unit) => ({
        value: unit.id,
        label: `${unit.name} (${unit.code})`,
      })),
    [referenceData.organizationUnits],
  );

  const locationOptions: SearchableSelectOption[] = useMemo(
    () =>
      referenceData.locations.map((location) => ({
        value: location.id,
        label: `${location.name} (${location.code})`,
      })),
    [referenceData.locations],
  );

  const assetOptions: SearchableSelectOption[] = useMemo(
    () =>
      referenceData.assets.map((asset) => ({
        value: asset.id,
        label: `${asset.assetTag}${
          asset.categoryName ? ` • ${asset.categoryName}` : ""
        }`,
      })),
    [referenceData.assets],
  );

  // Load CI classes when dialog opens
  useEffect(() => {
    if (open && referenceError) {
      toast.error(referenceError);
    }
  }, [open, referenceError]);

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

  // Watch ciClassId for create form to track changes
  const watchedCIClassId = useWatch({
    control: createForm.control,
    name: "ciClassId",
  });
  // Handle custom field value changes
  const handleCustomFieldsChange = useCallback((values: CustomFieldValues) => {
    setCustomFieldValues(values);
  }, []);

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
      // Initialize custom field values from existing attributes
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomFieldValues((editingItem.attributes as CustomFieldValues) || {});
    } else if (open && !editingItem) {
      createForm.reset();

      setCustomFieldValues({});
    }
  }, [open, editingItem, createForm, updateForm]);

  const onCreateSubmit = async (data: CreateFormOutput) => {
    try {
      // Include custom field values in attributes
      const submitData = {
        ...data,
        attributes:
          Object.keys(customFieldValues).length > 0 ? customFieldValues : null,
      };
      const result = await createConfigurationItemAction(submitData);
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
      // Include custom field values in attributes
      const submitData = {
        ...data,
        attributes:
          Object.keys(customFieldValues).length > 0 ? customFieldValues : null,
      };
      const result = await updateConfigurationItemAction(
        editingItem!.id,
        submitData,
      );
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

  const renderOwnershipAndLocationFields = (
    formInstance: SharedFormInstance,
  ) => (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          control={formInstance.control as any}
          name="lifecycleStateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lifecycle State</FormLabel>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === NONE_OPTION_VALUE ? null : value)
                }
                value={field.value ?? NONE_OPTION_VALUE}
                disabled={referenceLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lifecycle state" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE_OPTION_VALUE}>None</SelectItem>
                  {lifecycleStateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          control={formInstance.control as any}
          name="primaryOwnerPersonId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Owner</FormLabel>
              <FormControl>
                <SearchableSelect
                  options={[
                    { value: NONE_OPTION_VALUE, label: "None" },
                    ...personOptions,
                  ]}
                  value={field.value ?? NONE_OPTION_VALUE}
                  onValueChange={(value) =>
                    field.onChange(value === NONE_OPTION_VALUE ? null : value)
                  }
                  placeholder="Select owner..."
                  searchPlaceholder="Search people..."
                  disabled={referenceLoading}
                />
              </FormControl>
              <FormDescription>Person accountable for this CI</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          control={formInstance.control as any}
          name="primaryOwnerOrgUnitId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Owner Org Unit</FormLabel>
              <FormControl>
                <SearchableSelect
                  options={[
                    { value: NONE_OPTION_VALUE, label: "None" },
                    ...orgUnitOptions,
                  ]}
                  value={field.value ?? NONE_OPTION_VALUE}
                  onValueChange={(value) =>
                    field.onChange(value === NONE_OPTION_VALUE ? null : value)
                  }
                  placeholder="Select org unit..."
                  searchPlaceholder="Search org units..."
                  disabled={referenceLoading}
                />
              </FormControl>
              <FormDescription>
                Department or squad responsible for this CI
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          control={formInstance.control as any}
          name="locationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <SearchableSelect
                  options={[
                    { value: NONE_OPTION_VALUE, label: "None" },
                    ...locationOptions,
                  ]}
                  value={field.value ?? NONE_OPTION_VALUE}
                  onValueChange={(value) =>
                    field.onChange(value === NONE_OPTION_VALUE ? null : value)
                  }
                  placeholder="Select location..."
                  searchPlaceholder="Search locations..."
                  disabled={referenceLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        control={formInstance.control as any}
        name="linkedAssetId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Linked Asset</FormLabel>
            <FormControl>
              <SearchableSelect
                options={[
                  { value: NONE_OPTION_VALUE, label: "None" },
                  ...assetOptions,
                ]}
                value={field.value ?? NONE_OPTION_VALUE}
                onValueChange={(value) =>
                  field.onChange(value === NONE_OPTION_VALUE ? null : value)
                }
                placeholder="Link to asset (optional)"
                searchPlaceholder="Search assets..."
                disabled={referenceLoading}
              />
            </FormControl>
            <FormDescription>
              Link this CI to a physical or virtual asset
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

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
                      <SearchableSelect
                        options={ciClassOptions}
                        value={field.value || undefined}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setCustomFieldValues({});
                        }}
                        placeholder="Select a CI class..."
                        searchPlaceholder="Search CI classes..."
                        disabled={referenceLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      The type of configuration item
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

              {renderOwnershipAndLocationFields(createForm)}

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

              {/* Custom Fields Section */}
              {watchedCIClassId && (
                <>
                  <Separator className="my-4" />
                  <CICustomFieldsSection
                    ciClassId={watchedCIClassId}
                    values={customFieldValues}
                    onChange={handleCustomFieldsChange}
                    disabled={createForm.formState.isSubmitting}
                  />
                </>
              )}

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

              {renderOwnershipAndLocationFields(updateForm)}

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

              {/* Custom Fields Section */}
              {editingItem?.ciClassId && (
                <>
                  <Separator className="my-4" />
                  <CICustomFieldsSection
                    ciClassId={editingItem.ciClassId}
                    values={customFieldValues}
                    onChange={handleCustomFieldsChange}
                    disabled={updateForm.formState.isSubmitting}
                  />
                </>
              )}

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
