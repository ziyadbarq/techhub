/**
 * Business Process Detail Page
 */

import * as React from "react";
import { notFound } from "next/navigation";

import { BusinessProcessDetailView } from "@/components/services/business-process-detail-view";
import { getBusinessProcessAction } from "@/interface-adapters/controllers/business-process.controller";

export const dynamic = "force-dynamic";

interface BusinessProcessDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BusinessProcessDetailPage({
  params,
}: BusinessProcessDetailPageProps) {
  const { id } = await params;

  const result = await getBusinessProcessAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="container py-6">
      <BusinessProcessDetailView process={result.data} />
    </div>
  );
}
