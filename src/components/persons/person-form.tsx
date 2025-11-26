/**
 * Person Form Component
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import {
  createPersonAction,
  updatePersonAction,
} from "@/interface-adapters/controllers/person.controller";
import {
  CreatePersonSchema,
  type CreatePersonDTO,
} from "@/interface-adapters/dtos/generated/person.dto";
import { listOrganizationUnitsAction } from "@/interface-adapters/controllers/organization-unit.controller";
import { listRolesAction } from "@/interface-adapters/controllers/role.controller";
import { listLocationsAction } from "@/interface-adapters/controllers/location.controller";
import type { OrganizationUnitDTO } from "@/interface-adapters/presenters/organization-unit.presenter";
import type { RoleDTO } from "@/interface-adapters/presenters/role.presenter";
import type { LocationDTO } from "@/interface-adapters/presenters/location.presenter";

interface PersonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  person?: PersonDTO | null;
}

type PersonFormValues = z.input<typeof CreatePersonSchema>;

const NONE_OPTION_VALUE = "__none__";

export function PersonForm({
  open,
  onOpenChange,
  onSuccess,
  person,
}: PersonFormProps) {
  const isEditing = !!person;

  // Entity lists for dropdowns
  const [orgUnits, setOrgUnits] = useState<OrganizationUnitDTO[]>([]);
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoized options for searchable dropdowns
  const orgUnitOptions: SearchableSelectOption[] = useMemo(
    () =>
      orgUnits.map((unit) => ({
        value: unit.id,
        label: `${unit.name} (${unit.code})`,
      })),
    [orgUnits],
  );

  const roleOptions: SearchableSelectOption[] = useMemo(
    () =>
      roles.map((role) => ({
        value: role.id,
        label: role.displayName,
      })),
    [roles],
  );

  const locationOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: NONE_OPTION_VALUE, label: "None" },
      ...locations.map((loc) => ({
        value: loc.id,
        label: `${loc.name} (${loc.code})`,
      })),
    ],
    [locations],
  );

  // Load entity lists when dialog opens
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orgUnitsResult, rolesResult, locationsResult] = await Promise.all([
        listOrganizationUnitsAction(),
        listRolesAction(),
        listLocationsAction(),
      ]);

      if (orgUnitsResult.success) {
        setOrgUnits(orgUnitsResult.data);
      }
      if (rolesResult.success) {
        setRoles(rolesResult.data);
      }
      if (locationsResult.success) {
        setLocations(locationsResult.data);
      }
    } catch (_error) {
      toast.error("Failed to load form data");
    } finally {
      setLoading(false);
    }
  };

  const form = useForm<PersonFormValues, undefined, CreatePersonDTO>({
    resolver: zodResolver(CreatePersonSchema),
    defaultValues: {
      firstName: person?.firstName ?? "",
      lastName: person?.lastName ?? "",
      middleName: person?.middleName ?? "",
      email: person?.email ?? "",
      phone: person?.phone ?? "",
      organizationUnitId: person?.organizationUnitId ?? "",
      primaryRoleId: person?.primaryRoleId ?? "",
      locationId: person?.locationId ?? "",
      employeeId: person?.employeeId ?? "",
      title: person?.title ?? "",
      department: person?.department ?? "",
      isActive: person?.isActive ?? true,
    },
  });

  useEffect(() => {
    form.reset({
      firstName: person?.firstName ?? "",
      lastName: person?.lastName ?? "",
      middleName: person?.middleName ?? "",
      email: person?.email ?? "",
      phone: person?.phone ?? "",
      organizationUnitId: person?.organizationUnitId ?? "",
      primaryRoleId: person?.primaryRoleId ?? "",
      locationId: person?.locationId ?? "",
      employeeId: person?.employeeId ?? "",
      title: person?.title ?? "",
      department: person?.department ?? "",
      isActive: person?.isActive ?? true,
    });
  }, [person, form]);

  const onSubmit = async (data: CreatePersonDTO) => {
    try {
      const result = isEditing
        ? await updatePersonAction({ id: person.id, ...data })
        : await createPersonAction(data);
      if (result.success) {
        toast.success(isEditing ? "Person updated!" : "Person created!");
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error(
        isEditing ? "Failed to update person" : "Failed to create person",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Person" : "Create Person"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      First Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ahmed" maxLength={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="M."
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Last Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Al Saud" maxLength={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1234567890"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="organizationUnitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Organization Unit{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={orgUnitOptions}
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                        placeholder="Select organization unit..."
                        searchPlaceholder="Search organization units..."
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="primaryRoleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Primary Role <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={roleOptions}
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                        placeholder="Select role..."
                        searchPlaceholder="Search roles..."
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="EMP-001"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Manager"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={locationOptions}
                      value={field.value || NONE_OPTION_VALUE}
                      onValueChange={(value) =>
                        field.onChange(value === NONE_OPTION_VALUE ? "" : value)
                      }
                      placeholder="Select location..."
                      searchPlaceholder="Search locations..."
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Engineering"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      This person is currently active
                    </FormDescription>
                  </div>
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
                disabled={form.formState.isSubmitting}
                className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
              >
                {form.formState.isSubmitting
                  ? "Saving..."
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
