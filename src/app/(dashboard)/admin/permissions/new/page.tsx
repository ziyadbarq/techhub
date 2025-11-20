/**
 * Create Permission Page
 *
 * Form for creating a new permission.
 * Protected by PERMISSIONS_CREATE permission.
 */

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

export default function NewPermissionPage() {
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
      console.error("Create permission error:", error);
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
            Add a new permission to the system
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <PermissionForm
            mode="create"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
