"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PermissionForm } from "@/components/permissions/PermissionForm";
import { createPermissionAction } from "@/interface-adapters/controllers/permission.controller";
import type { CreatePermissionDTO } from "@/interface-adapters/dtos/generated/permission.dto";
import { logger } from "@/lib/logger";

export function NewPermissionPageClient() {
  const log = logger.scope("NewPermissionPage");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreatePermissionDTO) => {
    setIsSubmitting(true);
    try {
      const result = await createPermissionAction(data);

      if (result.success) {
        toast.success("Permission created successfully");
        router.push("/admin/permissions");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to create permission");
      log.error("handleSubmit", "Failed to create permission", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

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
          <h1 className="text-3xl font-bold tracking-tight">
            Create Permission
          </h1>
          <p className="text-muted-foreground mt-2">
            Define a new permission for access control
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <PermissionForm
            mode="create"
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
