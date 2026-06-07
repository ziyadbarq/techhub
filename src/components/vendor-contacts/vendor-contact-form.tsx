/**
 * Vendor Contact Form Component
 */

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import type { VendorContactDTO } from "@/interface-adapters/presenters/vendor-contact.presenter";
import type { VendorDTO } from "@/interface-adapters/presenters/vendor.presenter";
import {
  createVendorContactAction,
  updateVendorContactAction,
} from "@/interface-adapters/controllers/vendor-contact.controller";
import {
  CreateVendorContactSchema,
  type CreateVendorContactDTO,
} from "@/interface-adapters/dtos/generated/vendor-contact.dto";

interface VendorContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  contact?: VendorContactDTO | null;
  vendorId: string;
  vendors?: VendorDTO[];
}

type VendorContactFormValues = z.input<typeof CreateVendorContactSchema>;

export function VendorContactForm({
  open,
  onOpenChange,
  onSuccess,
  contact,
  vendorId,
  vendors = [],
}: VendorContactFormProps) {
  const isEditing = !!contact;
  const showVendorSelect = !vendorId;
  const vendorOptions = vendors.map((vendor) => ({
    value: vendor.id,
    label: `${vendor.name} (${vendor.code})`,
    disabled: !vendor.isActive,
  }));

  const form = useForm<
    VendorContactFormValues,
    undefined,
    CreateVendorContactDTO
  >({
    resolver: zodResolver(CreateVendorContactSchema),
    defaultValues: {
      vendorId: contact?.vendorId ?? vendorId,
      firstName: contact?.firstName ?? "",
      lastName: contact?.lastName ?? "",
      title: contact?.title ?? "",
      email: contact?.email ?? "",
      phone: contact?.phone ?? "",
      isPrimary: contact?.isPrimary ?? false,
      isActive: contact?.isActive ?? true,
      note: contact?.note ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      vendorId: contact?.vendorId ?? vendorId,
      firstName: contact?.firstName ?? "",
      lastName: contact?.lastName ?? "",
      title: contact?.title ?? "",
      email: contact?.email ?? "",
      phone: contact?.phone ?? "",
      isPrimary: contact?.isPrimary ?? false,
      isActive: contact?.isActive ?? true,
      note: contact?.note ?? "",
    });
  }, [contact, vendorId, form]);

  const onSubmit = async (data: CreateVendorContactDTO) => {
    try {
      const result = isEditing
        ? await updateVendorContactAction({
            id: contact.id,
            ...data,
          })
        : await createVendorContactAction(data);

      if (result.success) {
        toast.success(isEditing ? "Contact updated!" : "Contact created!");
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error(
        isEditing ? "Failed to update contact" : "Failed to create contact",
      );
    }
  };

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
          <DialogTitle>
            {isEditing ? "Edit Contact" : "Create Contact"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the contact details below."
              : "Add a new contact for this vendor."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {showVendorSelect && (
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Vendor <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={vendorOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select vendor"
                        searchPlaceholder="Search vendors..."
                        emptyMessage="No vendors found."
                        disabled={isEditing || vendorOptions.length === 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
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

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Account Manager"
                      maxLength={100}
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contact@example.com"
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

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes..."
                      maxLength={1000}
                      rows={3}
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
              name="isPrimary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Primary Contact</FormLabel>
                    <FormDescription>
                      This is the main contact for the vendor
                    </FormDescription>
                  </div>
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
                      This contact is currently active
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
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
