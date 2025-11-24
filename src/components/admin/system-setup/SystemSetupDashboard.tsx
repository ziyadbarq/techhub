"use client";

/**
 * System Setup Dashboard Component
 * Admin interface for system operations and diagnostics
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Database, Info } from "lucide-react";
import { SystemHealthPanel } from "./panels/SystemHealthPanel";
import { SystemInfoPanel } from "./panels/SystemInfoPanel";
import { DatabaseOperationsPanel } from "./panels/DatabaseOperationsPanel";

export function SystemSetupDashboard() {
  return (
    <Tabs defaultValue="health" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
        <TabsTrigger value="health" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span className="hidden sm:inline">System Health</span>
          <span className="sm:hidden">Health</span>
        </TabsTrigger>
        <TabsTrigger value="info" className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span className="hidden sm:inline">System Info</span>
          <span className="sm:hidden">Info</span>
        </TabsTrigger>
        <TabsTrigger value="operations" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <span className="hidden sm:inline">Database Ops</span>
          <span className="sm:hidden">Database</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="health" className="space-y-4">
        <SystemHealthPanel />
      </TabsContent>

      <TabsContent value="info" className="space-y-4">
        <SystemInfoPanel />
      </TabsContent>

      <TabsContent value="operations" className="space-y-4">
        <DatabaseOperationsPanel />
      </TabsContent>
    </Tabs>
  );
}
