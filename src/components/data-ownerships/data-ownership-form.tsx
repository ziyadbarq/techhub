"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

import {
  CreateDataOwnershipSchema,
  UpdateDataOwnershipSchema,
  type CreateDataOwnershipDTO,
  type UpdateDataOwnershipDTO,
} from "@/interface-adapters/dtos/generated/data-ownership.dto";
import type { DataOwnershipDTO } from "@/interface-adapters/presenters/data-ownership.presenter";
import type { DataDomainDTO } from "@/interface-adapters/presenters/data-domain.presenter";
import type { CIClassDTO } from "@/interface-adapters/presenters/ci-class.presenter";
import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import type { OrganizationUnitDTO } from "@/interface-adapters/presenters/organization-unit.presenter";
import {
  createDataOwnership,
  updateDataOwnership,
} from "@/interface-adapters/controllers/data-ownership.controller";

interface DataOwnershipFormProps {
  dataOwnership?: DataOwnershipDTO;
  dataDomains: DataDomainDTO[];
  ciClasses: CIClassDTO[];
  assetCategories: AssetCategoryDTO[];
  persons: PersonDTO[];
  organizationUnits: OrganizationUnitDTO[];
  onSuccess: () => void;
  onCancel: () => void;
}

type TargetType = "ciClass" | "assetCategory";
type OwnerType = "person" | "orgUnit" | "none";

export function DataOwnershipForm({
  dataOwnership,
  dataDomains,
  ciClasses,
  assetCategories,
  persons,
  organizationUnits,
  onSuccess,
  onCancel,
}: DataOwnershipFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = !!dataOwnership;

  // Determine initial target type
  const getInitialTargetType = (): TargetType => {
    if (dataOwnership?.ciClassId) return "ciClass";
    if (dataOwnership?.assetCategoryId) return "assetCategory";
    return "ciClass"; // default
  };

  // Determine initial owner type
  const getInitialOwnerType = (): OwnerType => {
    if (dataOwnership?.ownerPersonId) return "person";
    if (dataOwnership?.ownerOrgUnitId) return "orgUnit";
    return "none"; // default
  };

  const [targetType, setTargetType] = React.useState<TargetType>(
    getInitialTargetType(),
  );
  const [ownerType, setOwnerType] = React.useState<OwnerType>(
    getInitialOwnerType(),
  );

  const form = useForm<CreateDataOwnershipDTO | UpdateDataOwnershipDTO>({
    resolver: zodResolver(
      isEditing ? UpdateDataOwnershipSchema : CreateDataOwnershipSchema,
    ),
    defaultValues: {
      dataDomainId: dataOwnership?.dataDomainId || "",
      ciClassId: dataOwnership?.ciClassId || null,
      assetCategoryId: dataOwnership?.assetCategoryId || null,
      ownerPersonId: dataOwnership?.ownerPersonId || null,
      ownerOrgUnitId: dataOwnership?.ownerOrgUnitId || null,
      note: dataOwnership?.note || "",
    },
  });

  // Handle target type change
  const handleTargetTypeChange = (type: TargetType) => {
    setTargetType(type);
    if (type === "ciClass") {
      form.setValue("assetCategoryId", null);
    } else {
      form.setValue("ciClassId", null);
    }
  };

  // Handle owner type change
  const handleOwnerTypeChange = (type: OwnerType) => {
    setOwnerType(type);
    if (type === "person") {
      form.setValue("ownerOrgUnitId", null);
    } else if (type === "orgUnit") {
      form.setValue("ownerPersonId", null);
    } else {
      // none
      form.setValue("ownerPersonId", null);
      form.setValue("ownerOrgUnitId", null);
    }
  };

  const onSubmit = async (data: CreateDataOwnershipDTO | UpdateDataOwnershipDTO) => {
    setIsSubmitting(true);
    try {
      const result = isEditing
        ? await updateDataOwnership(dataOwnership.id, data as UpdateDataOwnershipDTO)
        : await createDataOwnership(data as CreateDataOwnershipDTO);

      if (result.success) {
        toast.success(
          `Data ownership ${isEditing ? "updated" : "created"} successfully`,
        );
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error(`Failed to ${isEditing ? "update" : "create"} data ownership`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Data Domain */}
        <FormField
          control={form.control}
          name="dataDomainId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Domain *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a data domain" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {dataDomains.map((domain) => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The data classification domain for this ownership
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Target Section */}
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <h3 className="text-sm font-medium">Target *</h3>
            <p className="text-muted-foreground text-xs">
              Select whether this ownership applies to a CI class or an asset
              category
            </p>
          </div>

          <RadioGroup
            value={targetType}
            onValueChange={(value) =>
              handleTargetTypeChange(value as TargetType)
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ciClass" id="target-ciClass" />
              <Label htmlFor="target-ciClass">CI Class</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="assetCategory" id="target-assetCategory" />
              <Label htmlFor="target-assetCategory">Asset Category</Label>
            </div>
          </RadioGroup>

          {targetType === "ciClass" && (
            <FormField
              control={form.control}
              name="ciClassId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CI Class *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a CI class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ciClasses.map((ciClass) => (
                        <SelectItem key={ciClass.id} value={ciClass.id}>
                          {ciClass.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {targetType === "assetCategory" && (
            <FormField
              control={form.control}
              name="assetCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Category *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an asset category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assetCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Owner Section */}
        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <h3 className="text-sm font-medium">Owner (Optional)</h3>
            <p className="text-muted-foreground text-xs">
              Optionally assign ownership to a person or an organizational unit
            </p>
          </div>

          <RadioGroup
            value={ownerType}
            onValueChange={(value) => handleOwnerTypeChange(value as OwnerType)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="owner-none" />
              <Label htmlFor="owner-none">No Owner</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="person" id="owner-person" />
              <Label htmlFor="owner-person">Person</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="orgUnit" id="owner-orgUnit" />
              <Label htmlFor="owner-orgUnit">Organization Unit</Label>
            </div>
          </RadioGroup>

          {ownerType === "person" && (
            <FormField
              control={form.control}
              name="ownerPersonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a person" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {persons.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.firstName} {person.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {ownerType === "orgUnit" && (
            <FormField
              control={form.control}
              name="ownerOrgUnitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Unit</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an organization unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {organizationUnits.map((orgUnit) => (
                        <SelectItem key={orgUnit.id} value={orgUnit.id}>
                          {orgUnit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Note */}
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional note..."
                  className="resize-none"
                  rows={3}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Additional notes about this data ownership assignment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
                ? "Update"
                : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
