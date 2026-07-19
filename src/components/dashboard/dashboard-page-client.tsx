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
  MetricsCardsWidget,
  RecentActivityWidget,
  TaskQueueWidget,
  DashboardSection,
  DependencyInfographic,
} from "@/components/dashboard";
import { QuickActionsWidget } from "@/components/dashboard/widgets/quick-actions-widget";
import { ExpiringWarrantiesWidget } from "@/components/warranties/expiring-warranties-widget";
import { CurrentPersonProvider } from "@/contexts/current-person-context";

/**
 * Dashboard Widget Configuration
 * Toggle widgets on/off while features are being developed
 */
const DASHBOARD_CONFIG = {
  // Header
  welcomeBanner: true,

  // Overview row
  metricsCards: true,

  // Setup guide
  dependencyInfographic: true,

  // Left column - My Work section
  maintenanceTasks: false,
  pendingApprovals: false,

  // Left column - My Assignments section
  myAssets: false,
  myServices: false,

  // Overview grid
  taskQueue: true,
  recentActivity: true,

  // Right column
  profileCard: false,
  quickActions: false,
  expiringWarranties: false,
} as const;

export function DashboardPageClient() {
  const hasMyWorkWidgets =
    DASHBOARD_CONFIG.maintenanceTasks || DASHBOARD_CONFIG.pendingApprovals;
  const hasMyAssignmentsWidgets =
    DASHBOARD_CONFIG.myAssets || DASHBOARD_CONFIG.myServices;
  const hasLeftColumn = hasMyWorkWidgets || hasMyAssignmentsWidgets;
  const hasRightColumn =
    DASHBOARD_CONFIG.profileCard ||
    DASHBOARD_CONFIG.quickActions ||
    DASHBOARD_CONFIG.expiringWarranties;

  const hasOverviewGrid =
    DASHBOARD_CONFIG.taskQueue || DASHBOARD_CONFIG.recentActivity;

  return (
    <CurrentPersonProvider>
      <div className="space-y-6">
        {/* Welcome Banner */}
        {DASHBOARD_CONFIG.welcomeBanner && <WelcomeBannerWidget />}

        {/* Overview Metrics Row */}
        {DASHBOARD_CONFIG.metricsCards && <MetricsCardsWidget />}

        {/* Overview Grid - Task Queue + Recent Activity */}
        {hasOverviewGrid && (
          <div className="grid gap-6 lg:grid-cols-2">
            {DASHBOARD_CONFIG.taskQueue && <TaskQueueWidget />}
            {DASHBOARD_CONFIG.recentActivity && <RecentActivityWidget />}
          </div>
        )}

        {/* Data Entry Workflow Guide */}
        {DASHBOARD_CONFIG.dependencyInfographic && <DependencyInfographic />}

        {/* Main Dashboard Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - 2/3 width */}
          {hasLeftColumn && (
            <div className="space-y-6 lg:col-span-2">
              {/* My Work Section */}
              {hasMyWorkWidgets && (
                <DashboardSection
                  title="My Work"
                  description="Tasks and approvals requiring your attention"
                  columns={2}
                >
                  {DASHBOARD_CONFIG.maintenanceTasks && (
                    <MyMaintenanceTasksWidget />
                  )}
                  {DASHBOARD_CONFIG.pendingApprovals && (
                    <MyPendingApprovalsWidget />
                  )}
                </DashboardSection>
              )}

              {/* My Assignments Section */}
              {hasMyAssignmentsWidgets && (
                <DashboardSection
                  title="My Assignments"
                  description="Assets and services assigned to you"
                  columns={2}
                >
                  {DASHBOARD_CONFIG.myAssets && <MyAssetsWidget />}
                  {DASHBOARD_CONFIG.myServices && <MyServicesWidget />}
                </DashboardSection>
              )}
            </div>
          )}

          {/* Right Column - 1/3 width (or full width if no left column) */}
          {hasRightColumn && (
            <div
              className={`space-y-6 ${!hasLeftColumn ? "lg:col-span-3 lg:mx-auto lg:max-w-md" : ""}`}
            >
              {DASHBOARD_CONFIG.profileCard && <ProfileCardWidget />}
              {DASHBOARD_CONFIG.quickActions && <QuickActionsWidget />}
              {DASHBOARD_CONFIG.expiringWarranties && (
                <ExpiringWarrantiesWidget daysThreshold={30} maxItems={5} />
              )}
            </div>
          )}
        </div>
      </div>
    </CurrentPersonProvider>
  );
}
