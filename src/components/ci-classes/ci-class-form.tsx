/**
 * CI Class Form Component
 */

"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { z } from "zod";
import type { CIClassDTO } from "@/interface-adapters/presenters/ci-class.presenter";
import {
  createCIClassAction,
  updateCIClassAction,
  listCIClassesAction,
} from "@/interface-adapters/controllers/ci-class.controller";
import { listLifecycleModelsAction } from "@/interface-adapters/controllers/lifecycle-model.controller";
import { CreateCIClassSchema } from "@/interface-adapters/dtos/generated/ci-class.dto";
import type { LifecycleModelDTO } from "@/interface-adapters/presenters/lifecycle-model.presenter";

interface CIClassFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  ciClass?: CIClassDTO | null;
}

type CIClassFormValues = z.input<typeof CreateCIClassSchema>;
type CIClassFormOutput = z.output<typeof CreateCIClassSchema>;

const NONE_OPTION_VALUE = "__none__";
const CRITICALITY_VALUES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const ENVIRONMENT_VALUES = [
  "PROD",
  "UAT",
  "DEV",
  "DR",
  "TEST",
  "OTHER",
] as const;

export function CIClassForm({
  open,
  onOpenChange,
  onSuccess,
  ciClass,
}: CIClassFormProps) {
  const normalizeCriticality = (
    value: CIClassDTO["defaultCriticality"] | undefined,
  ): CIClassFormValues["defaultCriticality"] => {
    if (
      value &&
      CRITICALITY_VALUES.includes(value as (typeof CRITICALITY_VALUES)[number])
    ) {
      return value as (typeof CRITICALITY_VALUES)[number];
    }
    return null;
  };

  const normalizeEnvironment = (
    value: CIClassDTO["defaultEnvironment"] | undefined,
  ): CIClassFormValues["defaultEnvironment"] => {
    if (
      value &&
      ENVIRONMENT_VALUES.includes(value as (typeof ENVIRONMENT_VALUES)[number])
    ) {
      return value as (typeof ENVIRONMENT_VALUES)[number];
    }
    return null;
  };

  const isEditing = !!ciClass;
  const [lifecycleModels, setLifecycleModels] = useState<LifecycleModelDTO[]>(
    [],
  );
  const [parentClasses, setParentClasses] = useState<CIClassDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<CIClassFormValues, undefined, CIClassFormOutput>({
    resolver: zodResolver(CreateCIClassSchema),
    defaultValues: {
      name: ciClass?.name ?? "",
      code: ciClass?.code ?? "",
      parentClassId: ciClass?.parentClassId ?? undefined,
      description: ciClass?.description ?? "",
      lifecycleModelId: ciClass?.lifecycleModelId ?? undefined,
      defaultCriticality: normalizeCriticality(ciClass?.defaultCriticality),
      defaultEnvironment: normalizeEnvironment(ciClass?.defaultEnvironment),
      isDiscoverable: ciClass?.isDiscoverable ?? false,
    },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [lifecycleResult, classesResult] = await Promise.all([
        listLifecycleModelsAction(),
        listCIClassesAction(),
      ]);

      if (lifecycleResult.success) {
        setLifecycleModels(lifecycleResult.data);
      }

      if (classesResult.success) {
        // Exclude current class from parent options
        const filteredClasses = isEditing
          ? classesResult.data.filter((c) => c.id !== ciClass?.id)
          : classesResult.data;
        setParentClasses(filteredClasses);
      }
    } catch (_error) {
      toast.error("Failed to load form data");
    } finally {
      setLoading(false);
    }
  }, [ciClass?.id, isEditing]);

  useEffect(() => {
    if (open) {
      loadData();
      form.reset({
        name: ciClass?.name ?? "",
        code: ciClass?.code ?? "",
        parentClassId: ciClass?.parentClassId ?? undefined,
        description: ciClass?.description ?? "",
        lifecycleModelId: ciClass?.lifecycleModelId ?? undefined,
        defaultCriticality: normalizeCriticality(ciClass?.defaultCriticality),
        defaultEnvironment: normalizeEnvironment(ciClass?.defaultEnvironment),
        isDiscoverable: ciClass?.isDiscoverable ?? false,
      });
    }
  }, [open, ciClass, form, loadData]);

  const onSubmit = async (data: CIClassFormOutput) => {
    try {
      const result = isEditing
        ? await updateCIClassAction(ciClass.id, data)
        : await createCIClassAction(data);

      if (result.success) {
        toast.success(isEditing ? "CI Class updated!" : "CI Class created!");
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error(
        isEditing ? "Failed to update CI class" : "Failed to create CI class",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit CI Class" : "Create CI Class"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the configuration item class information."
              : "Create a new configuration item class for the CMDB."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Server, Database, Application"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Display name for this CI class
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., SERVER, DATABASE, APP"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                    />
                  </FormControl>
                  <FormDescription>Unique identifier code</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parent Class */}
            <FormField
              control={form.control}
              name="parentClassId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Class (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === NONE_OPTION_VALUE ? null : value)
                    }
                    value={field.value ?? NONE_OPTION_VALUE}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="None (root class)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_OPTION_VALUE}>
                        None (root class)
                      </SelectItem>
                      {parentClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} ({cls.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Hierarchical parent class</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe this CI class..."
                      className="resize-none"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Purpose and usage of this class
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lifecycle Model */}
            <FormField
              control={form.control}
              name="lifecycleModelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lifecycle Model (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === NONE_OPTION_VALUE ? null : value)
                    }
                    value={field.value ?? NONE_OPTION_VALUE}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_OPTION_VALUE}>None</SelectItem>
                      {lifecycleModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Default lifecycle model for CIs of this class
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Default Criticality */}
            <FormField
              control={form.control}
              name="defaultCriticality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Criticality (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === NONE_OPTION_VALUE ? null : value)
                    }
                    value={field.value ?? NONE_OPTION_VALUE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_OPTION_VALUE}>None</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Default criticality level for CIs
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Default Environment */}
            <FormField
              control={form.control}
              name="defaultEnvironment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Environment (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === NONE_OPTION_VALUE ? null : value)
                    }
                    value={field.value ?? NONE_OPTION_VALUE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_OPTION_VALUE}>None</SelectItem>
                      <SelectItem value="PROD">Production (PROD)</SelectItem>
                      <SelectItem value="UAT">User Acceptance (UAT)</SelectItem>
                      <SelectItem value="DEV">Development (DEV)</SelectItem>
                      <SelectItem value="DR">Disaster Recovery (DR)</SelectItem>
                      <SelectItem value="TEST">Testing (TEST)</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Default environment for CIs</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Discoverable */}
            <FormField
              control={form.control}
              name="isDiscoverable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Discoverable</FormLabel>
                    <FormDescription>
                      Can CIs of this class be auto-discovered?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                disabled={form.formState.isSubmitting || loading}
                className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
              >
                {form.formState.isSubmitting
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
                  : isEditing
                    ? "Update"
                    : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
