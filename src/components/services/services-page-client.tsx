/**
 * Services Page Client Component
 *
 * Handles client-side refresh logic for the services table.
 */

"use client";

import { useRouter } from "next/navigation";
import type { ServiceDTO } from "@/interface-adapters/presenters/service.presenter";
import { ServicesTable } from "./services-table";

interface ServicesPageClientProps {
  data: ServiceDTO[];
}

export function ServicesPageClient({ data }: ServicesPageClientProps) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return <ServicesTable data={data} onRefresh={handleRefresh} />;
}
