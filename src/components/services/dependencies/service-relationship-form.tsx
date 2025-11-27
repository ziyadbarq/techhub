"use client";
"use no memo";

import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

import { ServiceRelationshipType } from "@/generated/prisma/enums";
import {
  CreateServiceRelationshipSchema,
  type CreateServiceRelationshipDTO,
} from "@/interface-adapters/dtos/generated/service-relationship.dto";
import { createServiceRelationshipAction } from "@/interface-adapters/controllers/service-relationship.controller";
import { listServicesAction } from "@/interface-adapters/controllers/service.controller";

interface ServiceRelationshipFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromServiceId: string;
  fromServiceName: string;
  onSuccess: () => void;
}

type FormValues = z.input<typeof CreateServiceRelationshipSchema>;

const relationshipTypeLabels: Record<ServiceRelationshipType, string> = {
  [ServiceRelationshipType.DEPENDS_ON]: "Depends On",
  [ServiceRelationshipType.CALLS]: "Calls",
  [ServiceRelationshipType.PUBLISHES_EVENTS_TO]: "Publishes Events To",
  [ServiceRelationshipType.CONSUMES_EVENTS_FROM]: "Consumes Events From",
  [ServiceRelationshipType.BACKUP_FOR]: "Backup For",
};

const relationshipTypeDescriptions: Record<ServiceRelationshipType, string> = {
  [ServiceRelationshipType.DEPENDS_ON]:
    "This service requires the target service to function",
  [ServiceRelationshipType.CALLS]:
    "This service makes API/network calls to the target service",
  [ServiceRelationshipType.PUBLISHES_EVENTS_TO]:
    "This service publishes events that the target service consumes",
  [ServiceRelationshipType.CONSUMES_EVENTS_FROM]:
    "This service consumes events published by the target service",
  [ServiceRelationshipType.BACKUP_FOR]:
    "This service serves as a backup/failover for the target service",
};

interface ServiceOption {
  id: string;
  name: string;
}

export function ServiceRelationshipForm({
  open,
  onOpenChange,
  fromServiceId,
  fromServiceName,
  onSuccess,
}: ServiceRelationshipFormProps) {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  const form = useForm<FormValues, undefined, CreateServiceRelationshipDTO>({
    resolver: zodResolver(CreateServiceRelationshipSchema),
    defaultValues: {
      fromServiceId,
      toServiceId: "",
      relationshipType: ServiceRelationshipType.DEPENDS_ON,
      isCritical: false,
      description: "",
    },
  });

  // Load available services
  const loadServices = useCallback(async () => {
    setIsLoadingServices(true);
    try {
      const result = await listServicesAction();
      if (result.success && result.data) {
        const options = result.data
          .filter((s) => s.id !== fromServiceId)
          .map((s) => ({ id: s.id, name: s.name }));
        setServices(options);
      }
    } catch {
      toast.error("Failed to load services");
    } finally {
      setIsLoadingServices(false);
    }
  }, [fromServiceId]);

  // Load services and reset form when dialog opens
  useEffect(() => {
    if (open) {
      loadServices();
      form.reset({
        fromServiceId,
        toServiceId: "",
        relationshipType: ServiceRelationshipType.DEPENDS_ON,
        isCritical: false,
        description: "",
      });
    }
  }, [open, fromServiceId, form, loadServices]);

  const onSubmit = async (data: CreateServiceRelationshipDTO) => {
    try {
      const result = await createServiceRelationshipAction(data);
      if (result.success) {
        toast.success("Relationship created successfully");
        onSuccess();
      } else {
        toast.error(result.error || "Failed to create relationship");
      }
    } catch {
      toast.error("Failed to create relationship");
    }
  };

  const selectedType = useWatch({
    control: form.control,
    name: "relationshipType",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Service Dependency</DialogTitle>
          <DialogDescription>
            Create a new dependency relationship from{" "}
            <strong>{fromServiceName}</strong> to another service.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Target Service */}
            <FormField
              control={form.control}
              name="toServiceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Service *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingServices}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingServices
                              ? "Loading services..."
                              : "Select target service"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The service that {fromServiceName} depends on
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Relationship Type */}
            <FormField
              control={form.control}
              name="relationshipType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(
                        Object.values(
                          ServiceRelationshipType,
                        ) as ServiceRelationshipType[]
                      ).map((type) => (
                        <SelectItem key={type} value={type}>
                          {relationshipTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedType && (
                    <FormDescription>
                      {relationshipTypeDescriptions[selectedType]}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Critical */}
            <FormField
              control={form.control}
              name="isCritical"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Critical Dependency</FormLabel>
                    <FormDescription>
                      Mark if this dependency is critical for service operation.
                      Critical dependencies are highlighted in impact analysis.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe this dependency relationship..."
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes about this dependency
                  </FormDescription>
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
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Creating..."
                  : "Create Dependency"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
