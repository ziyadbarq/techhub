# Sidebar Usage Examples

Practical examples demonstrating how to use the advanced sidebar features in real-world scenarios.

## Table of Contents

- [Basic Setup](#basic-setup)
- [E-Commerce Application](#e-commerce-application)
- [Content Management System](#content-management-system)
- [Project Management Tool](#project-management-tool)
- [Real-Time Dashboard](#real-time-dashboard)
- [Multi-Tenant SaaS](#multi-tenant-saas)
- [Social Media Platform](#social-media-platform)
- [Advanced Patterns](#advanced-patterns)

## Basic Setup

### Minimal Configuration

The simplest possible sidebar setup:

```typescript
// src/config/navigation.ts
import { Home, Settings } from "lucide-react";

export const navGroups: NavGroup[] = [
  {
    id: "main",
    title: "Main",
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: Home,
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];
```

### Adding Badges

Add static and dynamic badges:

```typescript
{
  id: "main",
  title: "Main",
  items: [
    {
      title: "Dashboard",
      href: "/",
      icon: Home,
    },
    {
      title: "Notifications",
      href: "/notifications",
      icon: Bell,
      badge: "dynamic", // Updates in real-time
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      badge: "New", // Static badge
    },
  ],
}
```

Update badge from your code:

```typescript
import { updateBadge } from "@/hooks/use-badge-updates";

// Set notification count
const unreadCount = await getUnreadNotifications();
updateBadge("/notifications", String(unreadCount));
```

## E-Commerce Application

### Navigation Structure

```typescript
// src/config/navigation.ts
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  Tag,
  TrendingUp,
  DollarSign,
} from "lucide-react";

export const navGroups: NavGroup[] = [
  {
    id: "main",
    title: "Main",
    collapsible: false,
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: Home,
        badge: "dynamic",
        description: "Overview of your store",
      },
      {
        title: "Orders",
        href: "/orders",
        icon: ShoppingCart,
        badge: "dynamic",
        permission: "view:orders",
        children: [
          {
            title: "Pending",
            href: "/orders/pending",
            icon: Clock,
            badge: "dynamic",
          },
          {
            title: "Processing",
            href: "/orders/processing",
            icon: Package,
            badge: "dynamic",
          },
          {
            title: "Completed",
            href: "/orders/completed",
            icon: CheckCircle,
          },
          {
            title: "Cancelled",
            href: "/orders/cancelled",
            icon: XCircle,
          },
        ],
        defaultExpanded: true,
      },
    ],
  },
  {
    id: "catalog",
    title: "Catalog",
    collapsible: true,
    defaultCollapsed: false,
    permission: "view:products",
    items: [
      {
        title: "Products",
        href: "/products",
        icon: Package,
        badge: "dynamic",
        children: [
          {
            title: "All Products",
            href: "/products/all",
            icon: Package,
          },
          {
            title: "Low Stock",
            href: "/products/low-stock",
            icon: AlertCircle,
            badge: "dynamic",
          },
          {
            title: "Out of Stock",
            href: "/products/out-of-stock",
            icon: XCircle,
            badge: "dynamic",
          },
        ],
      },
      {
        title: "Categories",
        href: "/categories",
        icon: Tag,
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    collapsible: true,
    permission: "view:analytics",
    items: [
      {
        title: "Sales Reports",
        href: "/analytics/sales",
        icon: TrendingUp,
        children: [
          {
            title: "Today",
            href: "/analytics/sales/today",
            icon: Calendar,
            badge: "dynamic",
          },
          {
            title: "This Month",
            href: "/analytics/sales/month",
            icon: Calendar,
          },
          {
            title: "This Year",
            href: "/analytics/sales/year",
            icon: Calendar,
          },
        ],
      },
      {
        title: "Revenue",
        href: "/analytics/revenue",
        icon: DollarSign,
      },
      {
        title: "Customers",
        href: "/analytics/customers",
        icon: Users,
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    collapsible: true,
    defaultCollapsed: true,
    items: [
      {
        title: "Store Settings",
        href: "/settings/store",
        icon: Store,
        permission: "manage:settings",
      },
      {
        title: "Payment Methods",
        href: "/settings/payments",
        icon: CreditCard,
        permission: "manage:settings",
      },
      {
        title: "Shipping",
        href: "/settings/shipping",
        icon: Truck,
        permission: "manage:settings",
      },
    ],
  },
];
```

### Real-Time Order Updates

```typescript
// src/components/providers/OrderBadgeProvider.tsx
"use client";

import { useEffect } from "react";
import {
  updateBadge,
  incrementBadge,
  decrementBadge,
} from "@/hooks/use-badge-updates";

export function OrderBadgeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Connect to order updates via WebSocket or SSE
    const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);

    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "order:created":
          incrementBadge("/orders");
          incrementBadge("/orders/pending");
          break;

        case "order:status_changed":
          const { from, to } = data.payload;
          decrementBadge(`/orders/${from.toLowerCase()}`);
          incrementBadge(`/orders/${to.toLowerCase()}`);
          break;

        case "order:completed":
          decrementBadge("/orders");
          decrementBadge("/orders/processing");
          incrementBadge("/orders/completed");
          break;
      }
    });

    // Initial load
    fetchOrderCounts().then((counts) => {
      updateBadge("/orders", String(counts.total));
      updateBadge("/orders/pending", String(counts.pending));
      updateBadge("/orders/processing", String(counts.processing));
    });

    return () => socket.close();
  }, []);

  return <>{children}</>;
}

// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <OrderBadgeProvider>
          {children}
        </OrderBadgeProvider>
      </body>
    </html>
  );
}
```

### Inventory Alerts

```typescript
// Check inventory and update badges
async function checkInventory() {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { stock: { lte: 10 } }, // Low stock threshold
        { stock: 0 }, // Out of stock
      ],
    },
  });

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  updateBadge("/products/low-stock", String(lowStock));
  updateBadge("/products/out-of-stock", String(outOfStock));
}

// Run every 5 minutes
setInterval(checkInventory, 5 * 60 * 1000);
```

## Content Management System

### Navigation Structure

```typescript
// src/config/navigation.ts
export const navGroups: NavGroup[] = [
  {
    id: "content",
    title: "Content",
    collapsible: false,
    items: [
      {
        title: "Posts",
        href: "/posts",
        icon: FileText,
        badge: "dynamic",
        children: [
          {
            title: "All Posts",
            href: "/posts/all",
            icon: FileText,
          },
          {
            title: "Drafts",
            href: "/posts/drafts",
            icon: Edit,
            badge: "dynamic",
          },
          {
            title: "Published",
            href: "/posts/published",
            icon: Globe,
          },
          {
            title: "Scheduled",
            href: "/posts/scheduled",
            icon: Clock,
            badge: "dynamic",
          },
          {
            title: "Pending Review",
            href: "/posts/pending-review",
            icon: Eye,
            badge: "dynamic",
            permission: "review:posts",
          },
        ],
        defaultExpanded: true,
      },
      {
        title: "Media Library",
        href: "/media",
        icon: Image,
        children: [
          {
            title: "All Media",
            href: "/media/all",
            icon: Image,
          },
          {
            title: "Images",
            href: "/media/images",
            icon: Image,
          },
          {
            title: "Videos",
            href: "/media/videos",
            icon: Video,
          },
          {
            title: "Documents",
            href: "/media/documents",
            icon: FileText,
          },
        ],
      },
      {
        title: "Comments",
        href: "/comments",
        icon: MessageSquare,
        badge: "dynamic",
        permission: "view:comments",
        children: [
          {
            title: "All Comments",
            href: "/comments/all",
            icon: MessageSquare,
          },
          {
            title: "Pending Moderation",
            href: "/comments/pending",
            icon: AlertCircle,
            badge: "dynamic",
          },
          {
            title: "Spam",
            href: "/comments/spam",
            icon: Trash,
          },
        ],
      },
    ],
  },
  {
    id: "admin",
    title: "Administration",
    collapsible: true,
    permission: "view:admin",
    items: [
      {
        title: "Users",
        href: "/admin/users",
        icon: Users,
        permission: "manage:users",
        children: [
          {
            title: "All Users",
            href: "/admin/users/all",
            icon: Users,
          },
          {
            title: "Administrators",
            href: "/admin/users/admins",
            icon: Shield,
          },
          {
            title: "Editors",
            href: "/admin/users/editors",
            icon: Edit,
          },
          {
            title: "Authors",
            href: "/admin/users/authors",
            icon: Feather,
          },
        ],
      },
      {
        title: "Roles & Permissions",
        href: "/admin/roles",
        icon: Key,
        permission: "manage:roles",
      },
      {
        title: "Activity Log",
        href: "/admin/activity",
        icon: Activity,
        permission: "view:activity",
      },
    ],
  },
];
```

### Comment Moderation Workflow

```typescript
// src/lib/comment-moderation.ts
import { updateBadge, decrementBadge } from "@/hooks/use-badge-updates";

export async function handleCommentApproved(commentId: string) {
  await prisma.comment.update({
    where: { id: commentId },
    data: { status: "approved" },
  });

  // Update badge counts
  decrementBadge("/comments");
  decrementBadge("/comments/pending");

  // Notify user
  toast.success("Comment approved");
}

export async function handleCommentSpam(commentId: string) {
  await prisma.comment.update({
    where: { id: commentId },
    data: { status: "spam" },
  });

  decrementBadge("/comments");
  decrementBadge("/comments/pending");

  toast.success("Comment marked as spam");
}

// Refresh counts periodically
export async function refreshCommentCounts() {
  const pendingCount = await prisma.comment.count({
    where: { status: "pending" },
  });

  updateBadge("/comments", String(pendingCount));
  updateBadge("/comments/pending", String(pendingCount));
}
```

## Project Management Tool

### Navigation Structure

```typescript
// src/config/navigation.ts
export const navGroups: NavGroup[] = [
  {
    id: "workspace",
    title: "Workspace",
    collapsible: false,
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        title: "My Tasks",
        href: "/tasks",
        icon: CheckSquare,
        badge: "dynamic",
        children: [
          {
            title: "Assigned to Me",
            href: "/tasks/assigned",
            icon: User,
            badge: "dynamic",
          },
          {
            title: "Created by Me",
            href: "/tasks/created",
            icon: Plus,
          },
          {
            title: "Watching",
            href: "/tasks/watching",
            icon: Eye,
            badge: "dynamic",
          },
        ],
        defaultExpanded: true,
      },
      {
        title: "Projects",
        href: "/projects",
        icon: Folder,
        children: [
          {
            title: "Active Projects",
            href: "/projects/active",
            icon: Folder,
            badge: "dynamic",
          },
          {
            title: "Archived",
            href: "/projects/archived",
            icon: Archive,
          },
        ],
      },
    ],
  },
  {
    id: "team",
    title: "Team",
    collapsible: true,
    items: [
      {
        title: "Team Members",
        href: "/team",
        icon: Users,
      },
      {
        title: "Calendar",
        href: "/calendar",
        icon: Calendar,
        badge: "dynamic", // Upcoming deadlines
      },
      {
        title: "Reports",
        href: "/reports",
        icon: BarChart3,
        permission: "view:reports",
        children: [
          {
            title: "Sprint Report",
            href: "/reports/sprint",
            icon: Zap,
          },
          {
            title: "Burndown Chart",
            href: "/reports/burndown",
            icon: TrendingDown,
          },
          {
            title: "Team Velocity",
            href: "/reports/velocity",
            icon: Activity,
          },
        ],
      },
    ],
  },
];
```

### Task Assignment Notifications

```typescript
// src/lib/task-notifications.ts
import { incrementBadge, decrementBadge } from "@/hooks/use-badge-updates";

export async function notifyTaskAssigned(userId: string, taskId: string) {
  // Send notification to user
  await createNotification({
    userId,
    type: "task_assigned",
    taskId,
  });

  // Update badge for that user's session
  // (In a real app, you'd send this via WebSocket to specific user)
  incrementBadge("/tasks");
  incrementBadge("/tasks/assigned");
}

export async function notifyTaskCompleted(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { watchers: true },
  });

  // Notify all watchers
  for (const watcher of task.watchers) {
    incrementBadge("/tasks/watching"); // For watcher's session
  }

  // Update assignee's badge
  decrementBadge("/tasks");
  decrementBadge("/tasks/assigned");
}

// Check upcoming deadlines
export async function checkDeadlines() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const upcomingDeadlines = await prisma.task.count({
    where: {
      dueDate: {
        lte: tomorrow,
      },
      status: { not: "completed" },
    },
  });

  updateBadge("/calendar", String(upcomingDeadlines));
}
```

## Real-Time Dashboard

### Live Metrics Navigation

```typescript
// src/config/navigation.ts
export const navGroups: NavGroup[] = [
  {
    id: "monitoring",
    title: "Monitoring",
    collapsible: false,
    items: [
      {
        title: "Overview",
        href: "/",
        icon: Activity,
      },
      {
        title: "System Health",
        href: "/health",
        icon: Heart,
        badge: "dynamic", // Shows "OK", "Warning", "Critical"
        children: [
          {
            title: "API Status",
            href: "/health/api",
            icon: Globe,
            badge: "dynamic",
          },
          {
            title: "Database",
            href: "/health/database",
            icon: Database,
            badge: "dynamic",
          },
          {
            title: "Cache",
            href: "/health/cache",
            icon: Zap,
            badge: "dynamic",
          },
        ],
      },
      {
        title: "Alerts",
        href: "/alerts",
        icon: AlertTriangle,
        badge: "dynamic",
        children: [
          {
            title: "Critical",
            href: "/alerts/critical",
            icon: AlertCircle,
            badge: "dynamic",
          },
          {
            title: "Warnings",
            href: "/alerts/warnings",
            icon: AlertTriangle,
            badge: "dynamic",
          },
          {
            title: "Info",
            href: "/alerts/info",
            icon: Info,
          },
        ],
      },
    ],
  },
];
```

### Health Monitoring Integration

```typescript
// src/components/providers/HealthMonitorProvider.tsx
"use client";

import { useEffect } from "react";
import { updateBadge } from "@/hooks/use-badge-updates";

export function HealthMonitorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // SSE connection to health monitoring service
    const eventSource = new EventSource("/api/monitoring/health-stream");

    eventSource.addEventListener("health:update", (e) => {
      const health = JSON.parse(e.data);

      // Update system health badge
      updateBadge("/health", getHealthBadge(health.status));
      updateBadge("/health/api", getHealthBadge(health.api));
      updateBadge("/health/database", getHealthBadge(health.database));
      updateBadge("/health/cache", getHealthBadge(health.cache));
    });

    eventSource.addEventListener("alert:new", (e) => {
      const alert = JSON.parse(e.data);

      // Update alert counts
      if (alert.severity === "critical") {
        incrementBadge("/alerts");
        incrementBadge("/alerts/critical");
      } else if (alert.severity === "warning") {
        incrementBadge("/alerts");
        incrementBadge("/alerts/warnings");
      }

      // Show toast notification
      toast.error(`New ${alert.severity} alert: ${alert.message}`);
    });

    return () => eventSource.close();
  }, []);

  return <>{children}</>;
}

function getHealthBadge(status: "healthy" | "degraded" | "down") {
  switch (status) {
    case "healthy":
      return "✓";
    case "degraded":
      return "!";
    case "down":
      return "✗";
  }
}
```

## Multi-Tenant SaaS

### Tenant-Aware Navigation

```typescript
// src/config/navigation.ts
export const navGroups: NavGroup[] = [
  {
    id: "workspace",
    title: "Workspace",
    collapsible: false,
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: Home,
      },
      {
        title: "Projects",
        href: "/projects",
        icon: Folder,
        badge: "dynamic",
        permission: "view:projects",
      },
      {
        title: "Team",
        href: "/team",
        icon: Users,
        permission: "view:team",
        children: [
          {
            title: "Members",
            href: "/team/members",
            icon: Users,
          },
          {
            title: "Invitations",
            href: "/team/invitations",
            icon: Mail,
            badge: "dynamic",
            permission: "manage:team",
          },
          {
            title: "Roles",
            href: "/team/roles",
            icon: Key,
            permission: "manage:roles",
          },
        ],
      },
    ],
  },
  {
    id: "billing",
    title: "Billing",
    collapsible: true,
    permission: "view:billing",
    items: [
      {
        title: "Subscription",
        href: "/billing/subscription",
        icon: CreditCard,
        badge: "dynamic", // Shows plan status
      },
      {
        title: "Usage",
        href: "/billing/usage",
        icon: BarChart3,
        badge: "dynamic", // Shows usage percentage
      },
      {
        title: "Invoices",
        href: "/billing/invoices",
        icon: FileText,
      },
    ],
  },
  {
    id: "admin",
    title: "Admin",
    collapsible: true,
    permission: "view:admin",
    items: [
      {
        title: "API Keys",
        href: "/admin/api-keys",
        icon: Key,
        permission: "manage:api-keys",
      },
      {
        title: "Webhooks",
        href: "/admin/webhooks",
        icon: Webhook,
        permission: "manage:webhooks",
      },
      {
        title: "Audit Log",
        href: "/admin/audit",
        icon: Shield,
        permission: "view:audit",
      },
    ],
  },
  {
    id: "system-settings",
    title: "System Settings",
    collapsible: true,
    permission: "manage:settings",
    items: [
      {
        title: "Platform Settings",
        href: "/settings/platform",
        icon: Globe2,
        permission: "manage:settings",
      },
      {
        title: "Authentication",
        href: "/settings/authentication",
        icon: LockKeyhole,
        permission: "manage:settings",
      },
      {
        title: "Notifications",
        href: "/settings/notifications",
        icon: Bell,
        permission: "manage:settings",
      },
      {
        title: "Operations",
        href: "/settings/operations",
        icon: ServerCog,
        permission: "manage:settings",
      },
      {
        title: "Integrations",
        href: "/settings/integrations",
        icon: Cloud,
        permission: "manage:settings",
      },
    ],
  },
];
```

### Usage-Based Billing Alerts

```typescript
// src/lib/usage-monitoring.ts
import { updateBadge } from "@/hooks/use-badge-updates";

export async function monitorUsage(tenantId: string) {
  const usage = await getUsageMetrics(tenantId);
  const subscription = await getSubscription(tenantId);

  // Calculate usage percentage
  const percentage = (usage.current / subscription.limit) * 100;

  // Update badge based on usage
  let badge = "";
  if (percentage >= 90) {
    badge = "🔴"; // Critical - near limit
  } else if (percentage >= 75) {
    badge = "🟡"; // Warning - approaching limit
  } else {
    badge = "🟢"; // OK
  }

  updateBadge("/billing/usage", badge);

  // Show notification if approaching limit
  if (percentage >= 90 && !usage.notifiedAt) {
    toast.warning("You're approaching your usage limit");
    await markUsageNotified(tenantId);
  }
}

// Run every hour for each active tenant
setInterval(
  async () => {
    const tenants = await getActiveTenants();
    await Promise.all(tenants.map((t) => monitorUsage(t.id)));
  },
  60 * 60 * 1000,
);
```

## Social Media Platform

### Social Navigation

```typescript
// src/config/navigation.ts
export const navGroups: NavGroup[] = [
  {
    id: "social",
    title: "Social",
    collapsible: false,
    items: [
      {
        title: "Feed",
        href: "/",
        icon: Home,
        badge: "dynamic", // New posts count
      },
      {
        title: "Notifications",
        href: "/notifications",
        icon: Bell,
        badge: "dynamic",
        children: [
          {
            title: "All",
            href: "/notifications/all",
            icon: Bell,
            badge: "dynamic",
          },
          {
            title: "Mentions",
            href: "/notifications/mentions",
            icon: AtSign,
            badge: "dynamic",
          },
          {
            title: "Likes",
            href: "/notifications/likes",
            icon: Heart,
            badge: "dynamic",
          },
          {
            title: "Comments",
            href: "/notifications/comments",
            icon: MessageCircle,
            badge: "dynamic",
          },
        ],
        defaultExpanded: false,
      },
      {
        title: "Messages",
        href: "/messages",
        icon: Mail,
        badge: "dynamic",
        children: [
          {
            title: "Inbox",
            href: "/messages/inbox",
            icon: Inbox,
            badge: "dynamic",
          },
          {
            title: "Sent",
            href: "/messages/sent",
            icon: Send,
          },
          {
            title: "Archived",
            href: "/messages/archived",
            icon: Archive,
          },
        ],
      },
    ],
  },
  {
    id: "profile",
    title: "Profile",
    collapsible: true,
    items: [
      {
        title: "My Profile",
        href: "/profile",
        icon: User,
      },
      {
        title: "My Posts",
        href: "/profile/posts",
        icon: FileText,
      },
      {
        title: "Saved",
        href: "/saved",
        icon: Bookmark,
      },
      {
        title: "Friends",
        href: "/friends",
        icon: Users,
        badge: "dynamic", // Friend requests
      },
    ],
  },
];
```

### Real-Time Social Updates

```typescript
// src/components/providers/SocialUpdatesProvider.tsx
"use client";

import { useEffect } from "react";
import {
  updateBadge,
  incrementBadge,
  decrementBadge,
} from "@/hooks/use-badge-updates";

export function SocialUpdatesProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  useEffect(() => {
    // WebSocket connection for real-time updates
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}?userId=${userId}`);

    ws.addEventListener("message", (event) => {
      const { type, data } = JSON.parse(event.data);

      switch (type) {
        case "post:new":
          // New post in feed
          incrementBadge("/");
          break;

        case "notification:new":
          const { category } = data;
          incrementBadge("/notifications");
          incrementBadge(`/notifications/all`);

          if (category === "mention") {
            incrementBadge("/notifications/mentions");
          } else if (category === "like") {
            incrementBadge("/notifications/likes");
          } else if (category === "comment") {
            incrementBadge("/notifications/comments");
          }
          break;

        case "message:new":
          incrementBadge("/messages");
          incrementBadge("/messages/inbox");

          // Show browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("New message", {
              body: data.preview,
              icon: data.sender.avatar,
            });
          }
          break;

        case "friend:request":
          incrementBadge("/friends");
          break;

        case "notification:read":
          decrementBadge("/notifications");
          decrementBadge("/notifications/all");
          break;

        case "message:read":
          decrementBadge("/messages");
          decrementBadge("/messages/inbox");
          break;
      }
    });

    // Initial load - fetch current counts
    fetchInitialCounts(userId).then((counts) => {
      updateBadge("/notifications", String(counts.notifications));
      updateBadge("/notifications/all", String(counts.notifications));
      updateBadge("/notifications/mentions", String(counts.mentions));
      updateBadge("/notifications/likes", String(counts.likes));
      updateBadge("/notifications/comments", String(counts.comments));
      updateBadge("/messages", String(counts.unreadMessages));
      updateBadge("/messages/inbox", String(counts.unreadMessages));
      updateBadge("/friends", String(counts.friendRequests));
    });

    return () => ws.close();
  }, [userId]);

  return <>{children}</>;
}

async function fetchInitialCounts(userId: string) {
  const response = await fetch(`/api/users/${userId}/notification-counts`);
  return response.json();
}
```

## Advanced Patterns

### Conditional Navigation Based on Feature Flags

```typescript
// src/config/navigation.ts
import { isFeatureEnabled } from "@/lib/feature-flags";

export function getNavGroups(): NavGroup[] {
  const groups: NavGroup[] = [
    {
      id: "main",
      title: "Main",
      items: [
        {
          title: "Dashboard",
          href: "/",
          icon: Home,
        },
      ],
    },
  ];

  // Add experimental features group if beta features are enabled
  if (isFeatureEnabled("beta-features")) {
    groups.push({
      id: "experimental",
      title: "Experimental",
      collapsible: true,
      defaultCollapsed: true,
      items: [
        {
          title: "AI Assistant",
          href: "/ai-assistant",
          icon: Sparkles,
          badge: "Beta",
        },
        {
          title: "Advanced Analytics",
          href: "/analytics/advanced",
          icon: LineChart,
          badge: "Beta",
        },
      ],
    });
  }

  return groups;
}
```

### Dynamic Navigation from Database

```typescript
// src/config/navigation.ts
export async function getDynamicNavGroups(userId: string): Promise<NavGroup[]> {
  // Fetch user's custom navigation from database
  const customNav = await prisma.userNavigation.findMany({
    where: { userId },
    include: { items: true },
  });

  // Transform database records to NavGroup format
  return customNav.map((group) => ({
    id: group.id,
    title: group.title,
    collapsible: group.collapsible,
    defaultCollapsed: group.defaultCollapsed,
    items: group.items.map((item) => ({
      title: item.title,
      href: item.href,
      icon: iconMap[item.iconName],
      badge: item.badgeType === "dynamic" ? "dynamic" : item.badgeValue,
    })),
  }));
}

// Use in layout
export default async function Layout({ children }) {
  const session = await getServerSession();
  const navGroups = await getDynamicNavGroups(session.user.id);

  return (
    <Sidebar navGroups={navGroups}>
      {children}
    </Sidebar>
  );
}
```

### Context-Aware Badge Updates

```typescript
// src/lib/context-aware-badges.ts
import { updateBadge } from "@/hooks/use-badge-updates";

/**
 * Update badges based on user context (role, permissions, preferences)
 */
export async function updateContextAwareBadges(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { preferences: true },
  });

  // Update based on user role
  if (user.role === "admin") {
    const pendingApprovals = await getPendingApprovals();
    updateBadge("/admin/approvals", String(pendingApprovals));
  }

  if (user.role === "moderator") {
    const flaggedContent = await getFlaggedContent();
    updateBadge("/moderation/flagged", String(flaggedContent));
  }

  // Update based on user preferences
  if (user.preferences.showUnreadCount) {
    const unread = await getUnreadCount(userId);
    updateBadge("/inbox", String(unread));
  }

  // Update based on user's projects
  const projects = await getUserProjects(userId);
  for (const project of projects) {
    const taskCount = await getProjectTaskCount(project.id);
    updateBadge(`/projects/${project.id}`, String(taskCount));
  }
}
```

### Optimistic Badge Updates

```typescript
// src/lib/optimistic-badges.ts
import { updateBadge, incrementBadge } from "@/hooks/use-badge-updates";

/**
 * Optimistically update badge, then sync with server
 */
export async function optimisticIncrementBadge(
  href: string,
  serverSync: () => Promise<number>,
) {
  // Immediately update UI
  incrementBadge(href);

  try {
    // Sync with server
    const actualCount = await serverSync();
    updateBadge(href, String(actualCount));
  } catch (error) {
    // Rollback on error
    decrementBadge(href);
    throw error;
  }
}

// Usage
async function markNotificationAsRead(notificationId: string) {
  await optimisticIncrementBadge("/notifications", async () => {
    // Server request
    await fetch(`/api/notifications/${notificationId}/read`, {
      method: "POST",
    });

    // Return actual count from server
    const response = await fetch("/api/notifications/count");
    const { count } = await response.json();
    return count;
  });
}
```

### Badge Batching for Performance

```typescript
// src/lib/badge-batching.ts
import { updateBadge } from "@/hooks/use-badge-updates";

/**
 * Batch multiple badge updates together to reduce re-renders
 */
export class BadgeBatcher {
  private queue: Map<string, string | undefined> = new Map();
  private timeoutId: NodeJS.Timeout | null = null;

  update(href: string, value: string | undefined) {
    this.queue.set(href, value);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => this.flush(), 100);
  }

  private flush() {
    for (const [href, value] of this.queue) {
      updateBadge(href, value);
    }

    this.queue.clear();
    this.timeoutId = null;
  }
}

// Usage
const batcher = new BadgeBatcher();

// These will be batched together
batcher.update("/tasks", "10");
batcher.update("/notifications", "5");
batcher.update("/messages", "3");
// Only causes one re-render after 100ms
```

### Progressive Enhancement

```typescript
// src/hooks/use-progressive-badges.ts
import { useState, useEffect } from "react";
import { useBadgeUpdates } from "@/hooks/use-badge-updates";

/**
 * Use static badges with progressive enhancement to dynamic
 */
export function useProgressiveBadges() {
  const [isSupported, setIsSupported] = useState(false);
  const badges = useBadgeUpdates();

  useEffect(() => {
    // Check if real-time updates are supported
    const supported =
      typeof EventSource !== "undefined" && typeof WebSocket !== "undefined";

    setIsSupported(supported);
  }, []);

  return {
    badges: isSupported ? badges : {},
    isRealTime: isSupported,
  };
}

// Usage in Sidebar
function Sidebar() {
  const { badges, isRealTime } = useProgressiveBadges();

  // If real-time not supported, fall back to static badges
  const getBadgeValue = (item: NavItem) => {
    if (item.badge === "dynamic") {
      return isRealTime ? badges[item.href] : item.fallbackBadge;
    }
    return item.badge;
  };

  // ...
}
```

## Testing Examples

### Testing Badge Updates

```typescript
// __tests__/badge-updates.test.ts
import { renderHook, act } from "@testing-library/react";
import {
  useBadgeUpdates,
  updateBadge,
  incrementBadge,
  clearBadge,
} from "@/hooks/use-badge-updates";

describe("Badge Updates", () => {
  it("should update badge value", () => {
    const { result } = renderHook(() => useBadgeUpdates());

    act(() => {
      updateBadge("/tasks", "5");
    });

    expect(result.current["/tasks"]).toBe("5");
  });

  it("should increment badge value", () => {
    const { result } = renderHook(() => useBadgeUpdates());

    act(() => {
      updateBadge("/tasks", "5");
      incrementBadge("/tasks");
    });

    expect(result.current["/tasks"]).toBe("6");
  });

  it("should clear badge", () => {
    const { result } = renderHook(() => useBadgeUpdates());

    act(() => {
      updateBadge("/tasks", "5");
      clearBadge("/tasks");
    });

    expect(result.current["/tasks"]).toBeUndefined();
  });
});
```

### Testing Permission-Based Navigation

```typescript
// __tests__/navigation-permissions.test.ts
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/layout/Sidebar";
import * as permissions from "@/lib/permissions";

describe("Navigation Permissions", () => {
  it("should hide admin items for non-admin users", () => {
    jest.spyOn(permissions, "getUserRole").mockReturnValue("user");

    render(<Sidebar />);

    expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();
  });

  it("should show admin items for admin users", () => {
    jest.spyOn(permissions, "getUserRole").mockReturnValue("admin");

    render(<Sidebar />);

    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });
});
```

## Related Documentation

- [Sidebar Features](./SIDEBAR_FEATURES.md) - Complete feature reference
- [Architecture Overview](../architecture/ARCHITECTURE.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
