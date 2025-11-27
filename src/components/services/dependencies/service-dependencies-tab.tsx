"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Plus, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type {
  ServiceRelationshipDTO,
  ImpactedServiceDTO,
} from "@/interface-adapters/dtos/generated/service-relationship.dto";
import {
  listServiceRelationshipsAction,
  getImpactedServicesAction,
  deleteServiceRelationshipAction,
} from "@/interface-adapters/controllers/service-relationship.controller";
import { ServiceRelationshipForm } from "./service-relationship-form";

interface ServiceDependenciesTabProps {
  serviceId: string;
  serviceName: string;
}

export function ServiceDependenciesTab({
  serviceId,
  serviceName,
}: ServiceDependenciesTabProps) {
  const { hasPermission } = usePermissions();
  const [relationships, setRelationships] = useState<ServiceRelationshipDTO[]>(
    [],
  );
  const [impactedServices, setImpactedServices] = useState<
    ImpactedServiceDTO[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [relResult, impactResult] = await Promise.all([
        listServiceRelationshipsAction(serviceId),
        getImpactedServicesAction(serviceId),
      ]);

      if (relResult.success && relResult.data) {
        setRelationships(relResult.data);
      }
      if (impactResult.success && impactResult.data) {
        setImpactedServices(impactResult.data);
      }
    } catch {
      toast.error("Failed to load dependencies");
    } finally {
      setIsLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Separate into dependencies (what this service depends on) and dependents (what depends on this)
  const dependencies = relationships.filter(
    (r) => r.fromServiceId === serviceId,
  );
  const dependents = relationships.filter((r) => r.toServiceId === serviceId);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const result = await deleteServiceRelationshipAction(deleteId);
      if (result.success) {
        toast.success("Relationship deleted");
        fetchData();
      } else {
        toast.error(result.error || "Failed to delete relationship");
      }
    } catch {
      toast.error("Failed to delete relationship");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const formatRelationshipType = (type: string) => {
    return type.replace(/_/g, " ").toLowerCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground text-sm">Loading dependencies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Impact Analysis Card */}
      {impactedServices.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Impact Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-3 text-sm">
              If <strong>{serviceName}</strong> goes down, these services would
              be affected:
            </p>
            <div className="space-y-2">
              {impactedServices.map((service) => (
                <div
                  key={service.serviceId}
                  className="flex items-center gap-2"
                >
                  <Badge
                    variant={service.depth === 1 ? "destructive" : "secondary"}
                  >
                    Level {service.depth}
                  </Badge>
                  <span className="text-sm">{service.serviceName}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dependencies - What this service depends on */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Dependencies ({dependencies.length})
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              Services this depends on
            </span>
          </CardTitle>
          {hasPermission(PERMISSIONS.SERVICES_MANAGE) && (
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {dependencies.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              This service has no dependencies
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target Service</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Critical</TableHead>
                  <TableHead>Description</TableHead>
                  {hasPermission(PERMISSIONS.SERVICES_MANAGE) && (
                    <TableHead className="w-[80px]">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dependencies.map((rel) => (
                  <TableRow key={rel.id}>
                    <TableCell className="font-medium">
                      {rel.toServiceName || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatRelationshipType(rel.relationshipType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {rel.isCritical && (
                        <Badge variant="destructive">Critical</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {rel.description || "—"}
                    </TableCell>
                    {hasPermission(PERMISSIONS.SERVICES_MANAGE) && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(rel.id)}
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dependents - What depends on this service */}
      <Card>
        <CardHeader>
          <CardTitle>
            Dependents ({dependents.length})
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              Services that depend on this
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dependents.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No services depend on this service
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dependent Service</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Critical</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dependents.map((rel) => (
                  <TableRow key={rel.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {rel.fromServiceName || "Unknown"}
                        <ArrowRight className="text-muted-foreground h-4 w-4" />
                        <span className="text-muted-foreground">
                          {serviceName}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatRelationshipType(rel.relationshipType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {rel.isCritical && (
                        <Badge variant="destructive">Critical</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {rel.description || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Relationship Form */}
      <ServiceRelationshipForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        fromServiceId={serviceId}
        fromServiceName={serviceName}
        onSuccess={() => {
          setShowAddForm(false);
          fetchData();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Relationship</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this relationship? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
