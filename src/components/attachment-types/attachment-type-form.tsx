"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Edit2, X } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";

import {
  CreateAttachmentTypeSchema,
  UpdateAttachmentTypeSchema,
  type CreateAttachmentTypeDTO,
  type UpdateAttachmentTypeDTO,
} from "@/interface-adapters/dtos/generated/attachment-type.dto";
import type { AttachmentTypeDTO } from "@/interface-adapters/presenters/attachment-type.presenter";
import {
  createAttachmentType,
  updateAttachmentType,
} from "@/interface-adapters/controllers/attachment-type.controller";

interface AttachmentTypeFormProps {
  attachmentType?: AttachmentTypeDTO;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AttachmentTypeForm({
  attachmentType,
  onSuccess,
  onCancel,
}: AttachmentTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = !!attachmentType;
  const [showCodeField, setShowCodeField] = React.useState(isEditing);
  const [extensionInput, setExtensionInput] = React.useState("");
  const [extensions, setExtensions] = React.useState<string[]>(
    attachmentType?.allowedExtensions || [],
  );

  const form = useForm<CreateAttachmentTypeDTO | UpdateAttachmentTypeDTO>({
    resolver: zodResolver(
      isEditing ? UpdateAttachmentTypeSchema : CreateAttachmentTypeSchema,
    ),
    defaultValues: {
      name: attachmentType?.name || "",
      code: attachmentType?.code || "",
      description: attachmentType?.description || "",
      allowedExtensions: attachmentType?.allowedExtensions || [],
      maxFileSizeMB: attachmentType?.maxFileSizeMB || 100,
      isActive: attachmentType?.isActive ?? true,
    },
  });

  React.useEffect(() => {
    setShowCodeField(isEditing);
  }, [isEditing]);

  // Update form when extensions change
  React.useEffect(() => {
    form.setValue("allowedExtensions", extensions);
  }, [extensions, form]);

  const handleAddExtension = (ext: string) => {
    const normalized = ext
      .trim()
      .toLowerCase()
      .replace(/^\./, ""); // Remove leading dot

    if (!normalized) return;

    // Validate extension format (letters and numbers only)
    if (!/^[a-z0-9]+$/.test(normalized)) {
      toast.error(
        "Extension must contain only letters and numbers (e.g., pdf, jpg, docx)",
      );
      return;
    }

    if (extensions.includes(normalized)) {
      toast.error(`Extension ".${normalized}" already added`);
      return;
    }

    setExtensions([...extensions, normalized]);
    setExtensionInput("");
  };

  const handleRemoveExtension = (ext: string) => {
    setExtensions(extensions.filter((e) => e !== ext));
  };

  const handleExtensionKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddExtension(extensionInput);
    } else if (e.key === "," || e.key === " ") {
      e.preventDefault();
      handleAddExtension(extensionInput);
    } else if (e.key === "Backspace" && !extensionInput && extensions.length) {
      // Remove last extension if input is empty and backspace is pressed
      setExtensions(extensions.slice(0, -1));
    }
  };

  const onSubmit = async (
    data: CreateAttachmentTypeDTO | UpdateAttachmentTypeDTO,
  ) => {
    setIsSubmitting(true);
    try {
      const result = isEditing
        ? await updateAttachmentType(
            attachmentType.id,
            data as UpdateAttachmentTypeDTO,
          )
        : await createAttachmentType(data as CreateAttachmentTypeDTO);

      if (result.success) {
        toast.success(
          `Attachment type ${isEditing ? "updated" : "created"} successfully`,
        );
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error(
        `Failed to ${isEditing ? "update" : "create"} attachment type`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Invoice Attachment"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                The display name for this attachment type
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {!showCodeField && !isEditing ? (
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCodeField(true)}
              className="h-8 text-xs"
            >
              <Edit2 className="mr-2 h-3 w-3" />
              Manually set code (optional)
            </Button>
            <p className="text-muted-foreground mt-1 text-xs">
              Code will be auto-generated with prefix &quot;ATT&quot; if not
              provided
            </p>
          </div>
        ) : (
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Code {isEditing && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., INVOICE"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  {isEditing
                    ? "Unique code for this attachment type (uppercase, letters/numbers/hyphens/underscores only)"
                    : "Leave empty to auto-generate"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional description..."
                  className="resize-none"
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
          name="allowedExtensions"
          render={() => (
            <FormItem>
              <FormLabel>Allowed File Extensions</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 min-h-[2.5rem] rounded-md border bg-background p-2">
                    {extensions.map((ext) => (
                      <Badge
                        key={ext}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        .{ext}
                        <button
                          type="button"
                          onClick={() => handleRemoveExtension(ext)}
                          className="ml-1 rounded-full hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <Input
                      placeholder={
                        extensions.length === 0
                          ? "Type extensions (e.g., pdf, jpg, docx) and press Enter"
                          : "Add more..."
                      }
                      value={extensionInput}
                      onChange={(e) => setExtensionInput(e.target.value)}
                      onKeyDown={handleExtensionKeyDown}
                      onBlur={() => {
                        if (extensionInput.trim()) {
                          handleAddExtension(extensionInput);
                        }
                      }}
                      className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Leave empty to allow all file types. Type extensions and press
                Enter, comma, or space to add. Click X to remove.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxFileSizeMB"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum File Size (MB) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="100"
                  min={1}
                  max={10000}
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value ? parseInt(value, 10) : "");
                  }}
                />
              </FormControl>
              <FormDescription>
                Maximum file size in megabytes (1-10000 MB)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  Active attachment types can be used for file uploads
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
