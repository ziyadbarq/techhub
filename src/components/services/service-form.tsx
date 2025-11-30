/**
 * Service Form Component
 *
 * Refactored to use extracted form field components for better maintainability and DRY compliance.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Extracted reusable form field components
import {
  TextField,
  TextareaField,
  DateField,
  EnumSelectField,
  CheckboxField,
  NullableSelectField,
  NumberField,
} from "./service-form-fields";

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
      vendorId: service?.vendorId ?? null,
      businessProcessId: service?.businessProcessId ?? null,
      isInCentralRegister: service?.isInCentralRegister ?? true,
      complianceNotes: service?.complianceNotes ?? "",
      slaDetails: service?.slaDetails ?? null,
      metadata: service?.metadata ?? null,

      // SLA Fields
      slaResponseTimeP50: service?.slaResponseTimeP50 ?? undefined,
      slaResponseTimeP95: service?.slaResponseTimeP95 ?? undefined,
      slaResponseTimeP99: service?.slaResponseTimeP99 ?? undefined,
      slaResolutionTimeCritical:
        service?.slaResolutionTimeCritical ?? undefined,
      slaResolutionTimeHigh: service?.slaResolutionTimeHigh ?? undefined,
      slaResolutionTimeMedium: service?.slaResolutionTimeMedium ?? undefined,
      slaUptimePercentage: service?.slaUptimePercentage ?? undefined,
      slaErrorRateThreshold: service?.slaErrorRateThreshold ?? undefined,
      slaSupportTier: service?.slaSupportTier ?? "",
      slaContactEmail: service?.slaContactEmail ?? "",
      slaEscalationPath: service?.slaEscalationPath ?? "",

      // Health Monitoring Fields
      healthCheckUrl: service?.healthCheckUrl ?? "",
      healthCheckInterval: service?.healthCheckInterval ?? undefined,
      healthCheckTimeout: service?.healthCheckTimeout ?? undefined,
      healthCheckEnabled: service?.healthCheckEnabled ?? false,
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="classification">Classification</TabsTrigger>
            <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
            <TabsTrigger value="sla">SLA & Monitoring</TabsTrigger>
            <TabsTrigger value="governance">Governance</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TextField
                  control={form.control}
                  name="name"
                  label="Service Name"
                  placeholder="e.g., Customer Portal API"
                  required
                />

                <EnumSelectField
                  control={form.control}
                  name="serviceType"
                  label="Service Type"
                  enumValues={ServiceType}
                  required
                />

                <TextareaField
                  control={form.control}
                  name="description"
                  label="Description"
                  placeholder="Describe the service..."
                  rows={3}
                />

                <TextareaField
                  control={form.control}
                  name="businessPurpose"
                  label="Business Purpose"
                  placeholder="What business need does this service fulfill?"
                  rows={3}
                />

                <TextField
                  control={form.control}
                  name="gitlabRepoUrl"
                  label="GitLab Repository URL"
                  type="url"
                  placeholder="https://gitlab.com/..."
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
                <EnumSelectField
                  control={form.control}
                  name="dataConfidentiality"
                  label="Data Confidentiality"
                  enumValues={DataConfidentiality}
                  required
                />

                <EnumSelectField
                  control={form.control}
                  name="businessImpactLevel"
                  label="Business Impact Level"
                  enumValues={BusinessImpactLevel}
                  required
                />

                <EnumSelectField
                  control={form.control}
                  name="criticality"
                  label="Criticality"
                  enumValues={CriticalityLevel}
                  required
                />

                <CheckboxField
                  control={form.control}
                  name="isEssentialService"
                  label="Essential Service"
                  description="Mark this service as essential for business operations"
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
                <DateField
                  control={form.control}
                  name="deploymentDate"
                  label="Deployment Date"
                />

                <EnumSelectField
                  control={form.control}
                  name="currentStatus"
                  label="Current Status"
                  enumValues={ServiceStatus}
                  required
                />

                <DateField
                  control={form.control}
                  name="lastPatchDate"
                  label="Last Patch Date"
                  description="When was this service last patched or updated?"
                />

                <DateField
                  control={form.control}
                  name="plannedDecommissionDate"
                  label="Planned Decommission Date"
                  description="When is this service planned to be retired?"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* SLA & Monitoring Tab */}
          <TabsContent value="sla">
            <div className="space-y-6">
              {/* SLA Response Time */}
              <Card>
                <CardHeader>
                  <CardTitle>SLA Response Time Targets</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <NumberField
                    control={form.control}
                    name="slaResponseTimeP50"
                    label="P50 Response Time"
                    description="50th percentile (median) response time target"
                    unit="ms"
                    min={0}
                  />

                  <NumberField
                    control={form.control}
                    name="slaResponseTimeP95"
                    label="P95 Response Time"
                    description="95th percentile response time target"
                    unit="ms"
                    min={0}
                  />

                  <NumberField
                    control={form.control}
                    name="slaResponseTimeP99"
                    label="P99 Response Time"
                    description="99th percentile response time target"
                    unit="ms"
                    min={0}
                  />
                </CardContent>
              </Card>

              {/* SLA Resolution Time */}
              <Card>
                <CardHeader>
                  <CardTitle>SLA Resolution Time Targets</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <NumberField
                    control={form.control}
                    name="slaResolutionTimeCritical"
                    label="Critical Incidents"
                    description="Time to resolve critical severity incidents"
                    unit="min"
                    min={0}
                  />

                  <NumberField
                    control={form.control}
                    name="slaResolutionTimeHigh"
                    label="High Priority"
                    description="Time to resolve high priority incidents"
                    unit="min"
                    min={0}
                  />

                  <NumberField
                    control={form.control}
                    name="slaResolutionTimeMedium"
                    label="Medium Priority"
                    description="Time to resolve medium priority incidents"
                    unit="min"
                    min={0}
                  />
                </CardContent>
              </Card>

              {/* SLA Performance Targets */}
              <Card>
                <CardHeader>
                  <CardTitle>SLA Performance Targets</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <NumberField
                    control={form.control}
                    name="slaUptimePercentage"
                    label="Uptime Target"
                    description="Target uptime percentage (e.g., 99.9 for three nines)"
                    unit="%"
                    min={0}
                    max={100}
                    step={0.001}
                  />

                  <NumberField
                    control={form.control}
                    name="slaErrorRateThreshold"
                    label="Error Rate Threshold"
                    description="Maximum acceptable error rate percentage"
                    unit="%"
                    min={0}
                    max={100}
                    step={0.001}
                  />
                </CardContent>
              </Card>

              {/* SLA Support Details */}
              <Card>
                <CardHeader>
                  <CardTitle>SLA Support Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TextField
                    control={form.control}
                    name="slaSupportTier"
                    label="Support Tier"
                    placeholder="e.g., 24/7, Business Hours, Best Effort"
                    description="The level of support provided for this service"
                  />

                  <TextField
                    control={form.control}
                    name="slaContactEmail"
                    label="SLA Contact Email"
                    type="email"
                    placeholder="sla-contact@example.com"
                    description="Primary contact for SLA-related issues"
                  />

                  <TextareaField
                    control={form.control}
                    name="slaEscalationPath"
                    label="Escalation Path"
                    placeholder="Describe the escalation process..."
                    rows={3}
                    description="Steps to escalate SLA violations"
                  />
                </CardContent>
              </Card>

              {/* Health Monitoring */}
              <Card>
                <CardHeader>
                  <CardTitle>Health Monitoring Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CheckboxField
                    control={form.control}
                    name="healthCheckEnabled"
                    label="Enable Health Checks"
                    description="Automatically monitor the health status of this service"
                  />

                  <TextField
                    control={form.control}
                    name="healthCheckUrl"
                    label="Health Check URL"
                    type="url"
                    placeholder="https://service.example.com/health"
                    description="HTTP endpoint for health status checks"
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <NumberField
                      control={form.control}
                      name="healthCheckInterval"
                      label="Check Interval"
                      description="How often to check health status"
                      unit="min"
                      min={1}
                      max={1440}
                    />

                    <NumberField
                      control={form.control}
                      name="healthCheckTimeout"
                      label="Check Timeout"
                      description="Maximum time to wait for health check response"
                      unit="sec"
                      min={1}
                      max={300}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Governance Tab */}
          <TabsContent value="governance">
            <Card>
              <CardHeader>
                <CardTitle>Governance & Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <NullableSelectField
                  control={form.control}
                  name="vendorId"
                  label="Vendor"
                  options={vendors.map((v) => ({ id: v.id, label: v.name }))}
                  placeholder="Select vendor (optional)"
                  noneLabel="No vendor"
                />

                <NullableSelectField
                  control={form.control}
                  name="businessProcessId"
                  label="Business Process"
                  options={businessProcesses.map((p) => ({
                    id: p.id,
                    label: `${p.name} (${p.code})`,
                  }))}
                  placeholder="Select business process (optional)"
                  noneLabel="No business process"
                />

                <CheckboxField
                  control={form.control}
                  name="isInCentralRegister"
                  label="In Central Register"
                  description="Is this service registered in the central service registry?"
                />

                <TextareaField
                  control={form.control}
                  name="complianceNotes"
                  label="Compliance Notes"
                  placeholder="Any compliance or regulatory notes..."
                  rows={4}
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
