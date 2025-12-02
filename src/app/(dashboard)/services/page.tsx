/**
 * Services List Page
 */

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ServicesPageClient } from "@/components/services/services-page-client";
import { listServicesAction } from "@/interface-adapters/controllers/service.controller";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { hasPermission } from "@/lib/permissions/server";
import { requireFeature } from "@/lib/features/server";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  await requireFeature("SERVICES");

  const canCreate = await hasPermission(PERMISSIONS.SERVICES_CREATE);
  const result = await listServicesAction();

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage your service catalog and infrastructure
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/services/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Service
            </Link>
          </Button>
        )}
      </div>

      <ServicesPageClient data={result.success ? result.data : []} />
    </div>
  );
}
