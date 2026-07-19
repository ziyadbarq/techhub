/**
 * Dashboard Components
 * Central exports for dashboard infrastructure and widgets
 */

// Infrastructure
export { WidgetContainer } from "./widget-container";
export { WidgetSkeleton, StatCardSkeleton } from "./widget-skeleton";
export { WidgetEmpty } from "./widget-empty";
export { WidgetError } from "./widget-error";
export { DashboardSection } from "./dashboard-section";

// Common Widgets
export { WelcomeBannerWidget } from "./widgets/welcome-banner-widget";
export { ProfileCardWidget } from "./widgets/profile-card-widget";

// Overview Widgets
export { MetricsCardsWidget } from "./widgets/metrics-cards-widget";
export { RecentActivityWidget } from "./widgets/recent-activity-widget";
export { TaskQueueWidget } from "./widgets/task-queue-widget";

// My Assets Section Widgets
export { MyAssetsWidget } from "./widgets/my-assets-widget";
export { MyServicesWidget } from "./widgets/my-services-widget";

// My Work Section Widgets
export { MyPendingApprovalsWidget } from "./widgets/my-pending-approvals-widget";
export { MyMaintenanceTasksWidget } from "./widgets/my-maintenance-tasks-widget";

// Setup Guide Widgets
export { DependencyInfographic } from "./widgets/dependency-infographic";

// Page Components
export { DashboardPageClient } from "./dashboard-page-client";
