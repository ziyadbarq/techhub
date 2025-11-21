/**
 * CI Classes Page - Client Component
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CIClassForm } from "./ci-class-form";
import { CIClassesTable } from "./ci-classes-table";
import type { CIClassDTO } from "@/interface-adapters/presenters/ci-class.presenter";

interface CIClassesPageClientProps {
  initialData: CIClassDTO[];
}

export function CIClassesPageClient({ initialData }: CIClassesPageClientProps) {
  const [data] = useState<CIClassDTO[]>(initialData);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<CIClassDTO | null>(null);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleEdit = (ciClass: CIClassDTO) => {
    setSelectedClass(ciClass);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setSelectedClass(null);
    }
  };

  const handleSuccess = () => {
    handleRefresh();
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CI Classes</h1>
          <p className="text-muted-foreground">
            Manage configuration item classes for your CMDB
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedClass(null);
            setFormOpen(true);
          }}
          className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          New CI Class
        </Button>
      </div>

      <CIClassesTable
        data={data}
        onEdit={handleEdit}
        onRefresh={handleRefresh}
      />

      <CIClassForm
        open={formOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleSuccess}
        ciClass={selectedClass}
      />
    </>
  );
}
