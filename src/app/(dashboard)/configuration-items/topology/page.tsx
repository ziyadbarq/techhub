/**
 * CI Topology Map
 *
 * Interactive graph visualization of configuration item relationships.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CITopologyGraph } from "@/components/cmdb/ci-topology-graph";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CI Topology Map",
  description: "Visual topology of configuration item relationships",
};

function TopologySkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="bg-muted h-[600px] animate-pulse rounded-lg" />
      </CardContent>
    </Card>
  );
}

export default async function CITopologyPage() {
  try {
    await requirePermission(PERMISSIONS.CONFIGURATION_ITEMS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/configuration-items/topology");
    throw error;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CI Topology Map</h1>
        <p className="text-muted-foreground">
          Interactive visualization of configuration item relationships and
          dependencies
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relationship Graph</CardTitle>
          <CardDescription>
            Nodes represent configuration items, edges represent relationships.
            Click a node to view its detail page. Animated edges indicate
            dependency relationships.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TopologySkeleton />}>
            <CITopologyGraph />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
