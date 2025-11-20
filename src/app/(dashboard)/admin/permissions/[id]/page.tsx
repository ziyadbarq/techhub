/**
 * Edit Permission Page
 *
 * Form for editing an existing permission.
 * Protected by PERMISSIONS_UPDATE permission.
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EditPermissionClient } from "./edit-permission-client";
import { getPermissionAction } from "@/interface-adapters/controllers/permission.controller";

interface EditPermissionPageProps {
  params: Promise<{ id: string }>;
}

async function PermissionDetails({ id }: { id: string }) {
  const result = await getPermissionAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <EditPermissionClient permission={result.data} />;
}

function PermissionDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export default async function EditPermissionPage({
  params,
}: EditPermissionPageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto max-w-3xl space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/permissions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Permission</h1>
          <p className="text-muted-foreground mt-2">
            Update permission details and settings
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <Suspense fallback={<PermissionDetailsSkeleton />}>
            <PermissionDetails id={id} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
