"use client";

/**
 * System Setup Dashboard Component
 * Admin interface for system operations and diagnostics
 */

import { SystemHealthPanel } from "./panels/SystemHealthPanel";
import { SystemInfoPanel } from "./panels/SystemInfoPanel";

export function SystemSetupDashboard() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            System Health
          </h2>
          <p className="text-muted-foreground text-sm">
            Live status for services, queues, and external dependencies.
          </p>
        </div>
        <SystemHealthPanel />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">System Info</h2>
          <p className="text-muted-foreground text-sm">
            Database size, entity counts, and runtime details.
          </p>
        </div>
        <SystemInfoPanel />
      </section>
    </div>
  );
}
