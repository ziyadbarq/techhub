/**
 * Kit Form Component
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { z } from "zod";
import type { AssetKitDTO } from "@/interface-adapters/dtos/generated/asset-kit.dto";
import {
  createAssetKitAction,
  updateAssetKitAction,
} from "@/interface-adapters/controllers/asset-kit.controller";
import { CreateAssetKitDTO } from "@/interface-adapters/dtos/generated/asset-kit.dto";

interface KitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  kit?: AssetKitDTO | null;
}

type KitFormValues = z.input<typeof CreateAssetKitDTO>;
type KitFormOutput = z.output<typeof CreateAssetKitDTO>;

export function KitForm({ open, onOpenChange, onSuccess, kit }: KitFormProps) {
  const isEditing = !!kit;

  const form = useForm<KitFormValues, undefined, KitFormOutput>({
    resolver: zodResolver(CreateAssetKitDTO),
    defaultValues: {
      name: kit?.name ?? "",
      code: kit?.code ?? "",
      description: kit?.description ?? "",
      kitType: kit?.kitType ?? "NEW_HIRE",
      isActive: kit?.isActive ?? true,
    },
  });

  useEffect(() => {
    form.reset({
      name: kit?.name ?? "",
      code: kit?.code ?? "",
      description: kit?.description ?? "",
      kitType: kit?.kitType ?? "NEW_HIRE",
      isActive: kit?.isActive ?? true,
    });
  }, [kit, form]);

  const onSubmit = async (data: KitFormOutput) => {
    try {
      const result = isEditing
        ? await updateAssetKitAction(kit.id, data)
        : await createAssetKitAction(data);

      if (result.success) {
        toast.success(isEditing ? "Kit updated!" : "Kit created!");
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error(isEditing ? "Failed to update kit" : "Failed to create kit");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Kit" : "Create Kit"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the kit information."
              : "Create a new predefined asset bundle."}
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
                    <Input placeholder="e.g., New Employee Kit" {...field} />
                  </FormControl>
                  <FormDescription>
                    Descriptive name for this kit
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
                      placeholder="e.g., KIT-EMP-001"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for this kit
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Kit Type */}
            <FormField
              control={form.control}
              name="kitType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kit Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select kit type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NEW_HIRE">New Hire</SelectItem>
                      <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                      <SelectItem value="EXECUTIVE">Executive</SelectItem>
                      <SelectItem value="PROJECT">Project</SelectItem>
                      <SelectItem value="TEMPORARY">Temporary</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Purpose or use case for this kit
                  </FormDescription>
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
                      placeholder="Describe what's included in this kit..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    What's included and when to use this kit
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Active */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Kit can be checked out when active
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
                disabled={form.formState.isSubmitting}
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
