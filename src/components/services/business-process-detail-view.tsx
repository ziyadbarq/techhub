/**
 * Business Process Detail View Component
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Edit, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import type { BusinessProcessDTO } from "@/interface-adapters/presenters/service.presenter";
import { deleteBusinessProcessAction } from "@/interface-adapters/controllers/business-process.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { usePermissions } from "@/hooks/use-permissions";

interface BusinessProcessDetailViewProps {
  process: BusinessProcessDTO;
}

export function BusinessProcessDetailView({
  process,
}: BusinessProcessDetailViewProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const canManage = hasPermission(PERMISSIONS.BUSINESS_PROCESSES_MANAGE);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteBusinessProcessAction(process.id);
      if (result.success) {
        toast.success("Business process deleted successfully");
        router.push("/business-processes");
      } else {
        toast.error(result.error || "Failed to delete business process");
      }
    } catch (_error) {
      toast.error("Failed to delete business process");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/business-processes")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Business Processes
          </Button>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/business-processes/${process.id}/edit`)
              }
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Process Header */}
      <div>
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-3xl font-bold">{process.name}</h1>
          <span className="text-muted-foreground font-mono text-lg">
            {process.code}
          </span>
        </div>
        {process.description && (
          <p className="text-muted-foreground text-lg">{process.description}</p>
        )}
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-muted-foreground mb-1 text-sm font-medium">
                Code
              </dt>
              <dd className="font-mono text-sm">{process.code}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground mb-1 text-sm font-medium">
                Name
              </dt>
              <dd className="text-sm">{process.name}</dd>
            </div>
            {process.category && (
              <div>
                <dt className="text-muted-foreground mb-1 text-sm font-medium">
                  Category
                </dt>
                <dd className="text-sm">{process.category}</dd>
              </div>
            )}
          </div>

          {process.description && (
            <div>
              <dt className="text-muted-foreground mb-1 text-sm font-medium">
                Description
              </dt>
              <dd className="text-sm">{process.description}</dd>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      {process.metadata && Object.keys(process.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted overflow-auto rounded-lg p-4 text-sm">
              {JSON.stringify(process.metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Audit Information */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-muted-foreground mb-1 text-sm font-medium">
                Created At
              </dt>
              <dd className="text-sm">
                {format(new Date(process.createdAt), "PPpp")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground mb-1 text-sm font-medium">
                Updated At
              </dt>
              <dd className="text-sm">
                {format(new Date(process.updatedAt), "PPpp")}
              </dd>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business Process?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete business process &quot;{process.code}
              &quot; ({process.name}). This action cannot be undone.
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
