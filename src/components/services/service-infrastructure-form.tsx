/**
 * Service Infrastructure Form Component
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { ServiceInfrastructureDTO } from "@/interface-adapters/presenters/service.presenter";
import {
  createServiceInfrastructureAction,
  updateServiceInfrastructureAction,
} from "@/interface-adapters/controllers/service-infrastructure.controller";
import {
  CreateServiceInfrastructureSchema,
  type CreateServiceInfrastructureDTO,
} from "@/interface-adapters/dtos/generated/service.dto";
import { ServiceLocation } from "@/generated/prisma/enums";

interface ServiceInfrastructureFormProps {
  serviceId: string;
  infrastructure?: ServiceInfrastructureDTO | null;
}

type InfrastructureFormValues = z.input<
  typeof CreateServiceInfrastructureSchema
>;

export function ServiceInfrastructureForm({
  serviceId,
  infrastructure,
}: ServiceInfrastructureFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = !!infrastructure;

  const form = useForm<
    InfrastructureFormValues,
    undefined,
    CreateServiceInfrastructureDTO
  >({
    resolver: zodResolver(CreateServiceInfrastructureSchema),
    defaultValues: {
      serviceId,
      location: infrastructure?.location ?? ServiceLocation.ON_PREM,
      cloudProvider: infrastructure?.cloudProvider ?? "",
      compartment: infrastructure?.compartment ?? "",
      project: infrastructure?.project ?? "",
      region: infrastructure?.region ?? "",
      ipAddress: infrastructure?.ipAddress ?? "",
      hostname: infrastructure?.hostname ?? "",
      backupEnabled: infrastructure?.backupEnabled ?? false,
      backupSchedule: infrastructure?.backupSchedule ?? "",
      lastBackupDate: infrastructure?.lastBackupDate
        ? new Date(infrastructure.lastBackupDate).toISOString().split("T")[0]
        : "",
      cloudProviderDetails: infrastructure?.cloudProviderDetails ?? null,
    },
  });

  const selectedLocation = form.watch("location");
  const backupEnabled = form.watch("backupEnabled");

  const isCloudLocation =
    selectedLocation &&
    (
      [
        ServiceLocation.OCI_CLOUD,
        ServiceLocation.GCP_CLOUD,
        ServiceLocation.AWS_CLOUD,
        ServiceLocation.HYBRID,
      ] as ServiceLocation[]
    ).includes(selectedLocation);

  const onSubmit = async (data: CreateServiceInfrastructureDTO) => {
    setIsSubmitting(true);
    try {
      // Normalize empty strings to undefined for optional fields
      const normalizedData = {
        ...data,
        cloudProvider: data.cloudProvider || undefined,
        compartment: data.compartment || undefined,
        project: data.project || undefined,
        region: data.region || undefined,
        ipAddress: data.ipAddress || undefined,
        hostname: data.hostname || undefined,
        backupSchedule: data.backupSchedule || undefined,
        lastBackupDate: data.lastBackupDate || undefined,
      };

      const result = isEditing
        ? await updateServiceInfrastructureAction(
            infrastructure.id,
            normalizedData,
          )
        : await createServiceInfrastructureAction(normalizedData);

      if (result.success) {
        toast.success(
          isEditing ? "Infrastructure updated!" : "Infrastructure configured!",
        );
        router.refresh();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (_error) {
      toast.error(
        isEditing
          ? "Failed to update infrastructure"
          : "Failed to configure infrastructure",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? "Update Infrastructure" : "Configure Infrastructure"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Location</h3>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deployment Location *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ServiceLocation).map((location) => (
                          <SelectItem key={location} value={location}>
                            {location.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isCloudLocation && (
                <>
                  <FormField
                    control={form.control}
                    name="cloudProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cloud Provider</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Oracle Cloud, AWS, GCP"
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
                    name="compartment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compartment/Resource Group</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Cloud compartment or resource group"
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
                    name="project"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project/Subscription</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Cloud project or subscription"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., us-east-1, eu-west-1, Riyadh DC"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Network Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Network</h3>

              <FormField
                control={form.control}
                name="ipAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 192.168.1.100"
                        {...field}
                        value={field.value || ""}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription>
                      IPv4 address format (xxx.xxx.xxx.xxx)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hostname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hostname</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., api.example.com"
                        {...field}
                        value={field.value || ""}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Backup Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Backup Configuration</h3>

              <FormField
                control={form.control}
                name="backupEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable Backups</FormLabel>
                      <FormDescription>
                        Enable automated backup for this service
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {backupEnabled && (
                <>
                  <FormField
                    control={form.control}
                    name="backupSchedule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Backup Schedule</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Daily at 2 AM, Weekly Sunday 3 AM"
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
                    name="lastBackupDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Backup Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={
                              typeof field.value === "string" ? field.value : ""
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditing
                    ? "Updating..."
                    : "Configuring..."
                  : isEditing
                    ? "Update Infrastructure"
                    : "Configure Infrastructure"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
