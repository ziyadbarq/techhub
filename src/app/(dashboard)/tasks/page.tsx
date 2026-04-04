/**
 * Tasks Demo Page
 *
 * Demonstrates a complete CRUD feature using Clean Architecture.
 * Shows how all layers work together from UI to database.
 *
 * Features:
 * - TanStack Table with sorting, filtering, pagination
 * - React Hook Form with Zod validation
 * - CSV import/export
 * - Bulk operations
 * - Server-side data fetching with Server Actions
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TasksPageClient } from "@/components/tasks/tasks-page-client";
import { listTasksAction } from "@/interface-adapters/controllers/task.controller";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  // Require TASKS_VIEW permission
  try {
    await requirePermission(PERMISSIONS.TASKS_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/tasks");
    throw error;
  }

  // Fetch initial data on the server
  const result = await listTasksAction();
  const initialTasks = result.success ? result.data : [];

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/" className="mb-6 inline-block">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Task Manager Demo</h1>
          <p className="text-muted-foreground text-lg">
            Complete CRUD example demonstrating Clean Architecture with advanced
            UI components
          </p>
        </div>

        {/* Architecture Info Card */}
        <div className="bg-muted/50 mb-8 rounded-lg border p-6">
          <h2 className="mb-3 text-lg font-semibold">What This Demo Shows</h2>
          <div className="grid gap-4 text-sm md:grid-cols-3">
            <div>
              <h3 className="mb-2 font-medium">Backend (Complete)</h3>
              <ul className="text-muted-foreground space-y-1">
                <li>✓ Domain entity with business logic</li>
                <li>✓ Repository pattern (interface + implementation)</li>
                <li>
                  ✓ 6 use cases (Create, List, Get, Update, Delete, Complete)
                </li>
                <li>✓ Server actions controller</li>
                <li>✓ Dependency injection</li>
                <li>✓ CSV service with DI</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium">Frontend (Complete)</h3>
              <ul className="text-muted-foreground space-y-1">
                <li>✓ React 19 client components</li>
                <li>✓ shadcn/ui components</li>
                <li>✓ React Hook Form + Zod</li>
                <li>✓ TanStack Table v9</li>
                <li>✓ Toast notifications</li>
                <li>✓ Barq theme system</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium">Features</h3>
              <ul className="text-muted-foreground space-y-1">
                <li>✓ Sorting & filtering</li>
                <li>✓ Pagination</li>
                <li>✓ Row selection</li>
                <li>✓ Bulk operations</li>
                <li>✓ CSV import/export</li>
                <li>✓ Column visibility</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tasks Table */}
        <TasksPageClient initialTasks={initialTasks} />

        {/* Footer */}
        <div className="text-muted-foreground mt-12 border-t pt-8 text-center text-sm">
          <p>Explore the code to understand the architecture:</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <code className="bg-muted rounded px-2 py-1">
              src/core/domain/entities/task.entity.ts
            </code>
            <code className="bg-muted rounded px-2 py-1">
              src/core/use-cases/task/
            </code>
            <code className="bg-muted rounded px-2 py-1">
              src/components/tasks/
            </code>
            <code className="bg-muted rounded px-2 py-1">
              src/infrastructure/services/csv/
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
