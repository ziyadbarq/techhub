/**
 * Service Form Component
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type {
  ServiceDTO,
  BusinessProcessDTO,
} from "@/interface-adapters/presenters/service.presenter";
import type { VendorDTO } from "@/interface-adapters/presenters/vendor.presenter";
import {
  createServiceAction,
  updateServiceAction,
} from "@/interface-adapters/controllers/service.controller";
import {
  CreateServiceSchema,
  type CreateServiceDTO,
} from "@/interface-adapters/dtos/generated/service.dto";
import {
  ServiceType,
  ServiceStatus,
  DataConfidentiality,
  BusinessImpactLevel,
  CriticalityLevel,
} from "@/generated/prisma/enums";

interface ServiceFormProps {
  mode: "create" | "edit";
  service?: ServiceDTO;
  vendors: VendorDTO[];
  businessProcesses: BusinessProcessDTO[];
}

type ServiceFormValues = z.input<typeof CreateServiceSchema>;

export function ServiceForm({
  mode,
  service,
  vendors,
  businessProcesses,
}: ServiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ServiceFormValues, undefined, CreateServiceDTO>({
    resolver: zodResolver(CreateServiceSchema),
    defaultValues: {
      name: service?.name ?? "",
      serviceType: service?.serviceType ?? ServiceType.APPLICATION,
      description: service?.description ?? "",
      businessPurpose: service?.businessPurpose ?? "",
      gitlabRepoUrl: service?.gitlabRepoUrl ?? "",
      dataConfidentiality:
        service?.dataConfidentiality ?? DataConfidentiality.INTERNAL,
      businessImpactLevel:
        service?.businessImpactLevel ?? BusinessImpactLevel.MEDIUM,
      criticality: service?.criticality ?? CriticalityLevel.MEDIUM,
      isEssentialService: service?.isEssentialService ?? false,
      deploymentDate: service?.deploymentDate
        ? new Date(service.deploymentDate).toISOString().split("T")[0]
        : "",
      currentStatus: service?.currentStatus ?? ServiceStatus.PRODUCTION,
      lastPatchDate: service?.lastPatchDate
        ? new Date(service.lastPatchDate).toISOString().split("T")[0]
        : "",
      plannedDecommissionDate: service?.plannedDecommissionDate
        ? new Date(service.plannedDecommissionDate).toISOString().split("T")[0]
        : "",
      vendorId: service?.vendorId ?? "",
      businessProcessId: service?.businessProcessId ?? "",
      isInCentralRegister: service?.isInCentralRegister ?? true,
      complianceNotes: service?.complianceNotes ?? "",
      slaDetails: service?.slaDetails ?? null,
      metadata: service?.metadata ?? null,
    },
  });

  const onSubmit = async (data: CreateServiceDTO) => {
    setIsSubmitting(true);
    try {
      // Normalize empty strings to undefined for optional fields
      const normalizedData = {
        ...data,
        deploymentDate: data.deploymentDate || undefined,
        lastPatchDate: data.lastPatchDate || undefined,
        plannedDecommissionDate: data.plannedDecommissionDate || undefined,
        vendorId: data.vendorId || undefined,
        businessProcessId: data.businessProcessId || undefined,
        description: data.description || undefined,
        businessPurpose: data.businessPurpose || undefined,
        gitlabRepoUrl: data.gitlabRepoUrl || undefined,
        complianceNotes: data.complianceNotes || undefined,
      };

      const result =
        mode === "edit" && service
          ? await updateServiceAction(service.id, normalizedData)
          : await createServiceAction(normalizedData);

      if (result.success) {
        toast.success(
          mode === "edit" ? "Service updated!" : "Service created!",
        );
        router.push(mode === "edit" ? `/services/${service?.id}` : "/services");
        router.refresh();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (_error) {
      toast.error(
        mode === "edit"
          ? "Failed to update service"
          : "Failed to create service",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="classification">Classification</TabsTrigger>
            <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
            <TabsTrigger value="governance">Governance</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Customer Portal API"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select service type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ServiceType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the service..."
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
                  name="businessPurpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Purpose</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What business need does this service fulfill?"
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
                  name="gitlabRepoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitLab Repository URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://gitlab.com/..."
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classification Tab */}
          <TabsContent value="classification">
            <Card>
              <CardHeader>
                <CardTitle>Service Classification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="dataConfidentiality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Confidentiality *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select confidentiality level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(DataConfidentiality).map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessImpactLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Impact Level *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select impact level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(BusinessImpactLevel).map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="criticality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Criticality *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select criticality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(CriticalityLevel).map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isEssentialService"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Essential Service</FormLabel>
                        <FormDescription>
                          Mark this service as essential for business operations
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lifecycle Tab */}
          <TabsContent value="lifecycle">
            <Card>
              <CardHeader>
                <CardTitle>Lifecycle Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="deploymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deployment Date</FormLabel>
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

                <FormField
                  control={form.control}
                  name="currentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Status *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ServiceStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastPatchDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Patch Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={
                            typeof field.value === "string" ? field.value : ""
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        When was this service last patched or updated?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plannedDecommissionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planned Decommission Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={
                            typeof field.value === "string" ? field.value : ""
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        When is this service planned to be retired?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Governance Tab */}
          <TabsContent value="governance">
            <Card>
              <CardHeader>
                <CardTitle>Governance & Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vendor (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No vendor</SelectItem>
                          {vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessProcessId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Process</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select business process (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No business process</SelectItem>
                          {businessProcesses.map((process) => (
                            <SelectItem key={process.id} value={process.id}>
                              {process.name} ({process.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isInCentralRegister"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>In Central Register</FormLabel>
                        <FormDescription>
                          Is this service registered in the central service
                          registry?
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="complianceNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compliance Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any compliance or regulatory notes..."
                          rows={4}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
              ? mode === "edit"
                ? "Updating..."
                : "Creating..."
              : mode === "edit"
                ? "Update Service"
                : "Create Service"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
