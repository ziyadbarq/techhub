/**
 * Dashboard Page Client Component
 * Main dashboard layout with role-aware widgets
 */

"use client";

import {
  WelcomeBannerWidget,
  ProfileCardWidget,
  MyAssetsWidget,
  MyServicesWidget,
  MyPendingApprovalsWidget,
  MyMaintenanceTasksWidget,
  DashboardSection,
} from "@/components/dashboard";
import { QuickActionsWidget } from "@/components/dashboard/widgets/quick-actions-widget";
import { ExpiringWarrantiesWidget } from "@/components/warranties/expiring-warranties-widget";

export function DashboardPageClient() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner - Always visible */}
      <WelcomeBannerWidget />

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="space-y-6 lg:col-span-2">
          {/* My Work Section */}
          <DashboardSection
            title="My Work"
            description="Tasks and approvals requiring your attention"
            columns={2}
          >
            <MyMaintenanceTasksWidget />
            <MyPendingApprovalsWidget />
          </DashboardSection>

          {/* My Assets Section */}
          <DashboardSection
            title="My Assignments"
            description="Assets and services assigned to you"
            columns={2}
          >
            <MyAssetsWidget />
            <MyServicesWidget />
          </DashboardSection>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Profile Card */}
          <ProfileCardWidget />

          {/* Quick Actions */}
          <QuickActionsWidget />

          {/* Expiring Warranties - Feature flag controlled */}
          <ExpiringWarrantiesWidget daysThreshold={30} maxItems={5} />
        </div>
      </div>
    </div>
  );
}
