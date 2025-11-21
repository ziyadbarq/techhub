# Advanced Sidebar Features

This document describes the advanced features implemented in the application sidebar, including collapsible navigation groups, multi-level nested navigation, role-based permissions, animations, and real-time badge updates.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
  - [Collapsible Navigation Groups](#collapsible-navigation-groups)
  - [Multi-Level Nested Navigation](#multi-level-nested-navigation)
  - [Role-Based Permissions](#role-based-permissions)
  - [Framer Motion Animations](#framer-motion-animations)
  - [Real-Time Badge Updates](#real-time-badge-updates)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)

## Overview

The enhanced sidebar provides a rich navigation experience with:

- **Collapsible groups** - Organize navigation items into collapsible sections
- **Nested navigation** - Support for unlimited nesting levels
- **Permission control** - Show/hide items based on user roles
- **Smooth animations** - Fluid transitions using Framer Motion
- **Live badge updates** - Real-time notification counts

All features work seamlessly together while maintaining:

- Accessibility (ARIA landmarks, keyboard navigation)
- Responsive design (mobile, tablet, desktop)
- State persistence (collapsed/expanded states saved)
- Performance optimization (memoization, lazy rendering)

## Features

### Collapsible Navigation Groups

Navigation items are organized into logical groups that can be collapsed/expanded by users.

**Key Features:**

- Click group header to toggle collapse/expand
- State persisted in `localStorage` across sessions
- Animated height transitions
- Chevron icon indicates state
- Optional: make groups permanently expanded (`collapsible: false`)

**Configuration:**

```typescript
// src/config/navigation.ts
export const navGroups: NavGroup[] = [
  {
    id: "main",
    title: "Main",
    collapsible: false, // Always expanded
    items: [
      /* ... */
    ],
  },
  {
    id: "content",
    title: "Content",
    collapsible: true, // Can be collapsed
    defaultCollapsed: false, // Starts expanded
    items: [
      /* ... */
    ],
  },
];
```

**User Experience:**

1. User clicks group header
2. Group smoothly animates to collapsed/expanded state
3. State is saved to localStorage
4. On next visit, group remembers its state

### Multi-Level Nested Navigation

Navigation items can have unlimited levels of children, creating hierarchical menus.

**Key Features:**

- Recursive rendering supports any depth
- Parent items have expand/collapse controls
- Clicking parent item expands children (doesn't navigate)
- Session-based state (resets on page reload)
- Indentation indicates nesting level

**Configuration:**

```typescript
// src/config/navigation.ts
{
  title: "Tasks",
  href: "/tasks",
  icon: CheckSquare,
  children: [
    {
      title: "Active Tasks",
      href: "/tasks/active",
      icon: Clock,
      children: [ // Nested deeper
        {
          title: "High Priority",
          href: "/tasks/active/high-priority",
          icon: AlertCircle,
        },
      ],
    },
    {
      title: "Completed",
      href: "/tasks/completed",
      icon: CheckSquare,
    },
  ],
  defaultExpanded: false, // Starts collapsed
}
```

**Behavior:**

- Items without children navigate on click
- Items with children toggle expansion on click
- Chevron icon shows expand/collapse state
- Animated height transitions

### Role-Based Permissions

Control visibility of navigation items based on user roles and permissions.

**Key Features:**

- Items hidden if user lacks permission
- Groups hidden if all items are hidden
- Seamless integration with future RBAC system
- Type-safe permission checking

**Current Implementation:**

The permission system is a mock/TODO ready for future RBAC integration. Currently uses a mock role (default: "admin") defined in `src/lib/permissions.ts`.

**Supported Roles:**

- `admin` - Full access to all features
- `moderator` - Moderation and content management
- `user` - Basic user features
- `guest` - Public/limited access

**Configuration:**

```typescript
// src/config/navigation.ts
{
  title: "Admin Panel",
  href: "/admin",
  icon: Shield,
  permission: "view:admin", // Only visible if user has permission
  children: [
    {
      title: "User Management",
      href: "/admin/users",
      icon: Users,
      permission: "manage:users",
    },
  ],
}
```

**Permission Checking:**

```typescript
// src/lib/permissions.ts
import { hasPermission } from "@/lib/permissions";

// Check single permission
if (hasPermission("view:tasks")) {
  // Show tasks
}

// Check multiple permissions (any)
if (hasAnyPermission(["create:tasks", "edit:tasks"])) {
  // Show task actions
}

// Check multiple permissions (all)
if (hasAllPermissions(["view:admin", "manage:users"])) {
  // Show admin features
}
```

**Future Integration:**

When implementing full RBAC, update `getUserRole()` in `src/lib/permissions.ts` to fetch from your auth system:

```typescript
export function getUserRole(): UserRole {
  // TODO: Replace with actual auth integration
  // Example:
  // const session = await getServerSession();
  // return session.user.role;
  return "admin"; // Current mock
}
```

### Framer Motion Animations

All sidebar interactions are animated using Framer Motion for smooth, polished UX.

**Animated Elements:**

1. **Group Collapse/Expand**
   - Height animates from 0 to auto
   - Duration: 200ms with ease-in-out easing
   - Content fades in/out during transition

2. **Item Expand/Collapse**
   - Same as groups but for nested items
   - Synchronized chevron rotation

3. **Badge Pulse**
   - Badge scales 1 → 1.2 → 1 when value changes
   - Duration: 300ms
   - Draws attention to updates

4. **Chevron Rotation**
   - Rotates 0° (collapsed) to 90° (expanded)
   - Synchronized with collapse/expand animation

**Implementation Example:**

```typescript
// Animated collapse/expand
<motion.div
  initial={false}
  animate={{ height: isExpanded ? "auto" : 0 }}
  transition={{ duration: 0.2, ease: "easeInOut" }}
  style={{ overflow: "hidden" }}
>
  {children}
</motion.div>

// Animated badge pulse
<motion.span
  key={badgeValue} // Re-mounts on change, triggering animation
  animate={{ scale: [1, 1.2, 1] }}
  transition={{ duration: 0.3 }}
  className="badge"
>
  {badgeValue}
</motion.span>
```

### Real-Time Badge Updates

Badges display dynamic counts that update in real-time without page refresh.

**Key Features:**

- Pub-sub pattern for reactive updates
- Centralized badge registry
- Mock simulator for development
- Animated updates draw user attention
- Support for static and dynamic badges

**Architecture:**

```
┌─────────────────┐
│  Badge Registry │  Global state
│  (Singleton)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Pub-Sub │
    └────┬────┘
         │
    ┌────┴──────────────┐
    │   Subscribers     │
    │ (React Components)│
    └───────────────────┘
```

**Configuration:**

```typescript
// src/config/navigation.ts
{
  title: "Tasks",
  href: "/tasks",
  icon: CheckSquare,
  badge: "dynamic", // Real-time badge from badge registry
}

{
  title: "Settings",
  href: "/settings",
  icon: Settings,
  badge: "3", // Static badge (always shows "3")
}
```

**Updating Badges:**

```typescript
import {
  updateBadge,
  incrementBadge,
  decrementBadge,
  clearBadge,
} from "@/hooks/use-badge-updates";

// Set specific value
updateBadge("/tasks", "5");

// Increment
incrementBadge("/notifications"); // "3" → "4"

// Decrement
decrementBadge("/notifications"); // "4" → "3"

// Clear
clearBadge("/tasks"); // Removes badge
```

**Mock Simulator:**

For development and testing, start the mock badge simulator:

```typescript
import { startMockBadgeUpdates } from "@/hooks/use-badge-updates";

// In development environment
useEffect(() => {
  const stop = startMockBadgeUpdates();
  return stop; // Cleanup on unmount
}, []);
```

The simulator randomly updates badges every 10 seconds to demonstrate real-time updates.

**Production Integration:**

In production, update badges based on real events:

```typescript
// Example: Update task count after creating a task
async function createTask(data: TaskData) {
  const task = await taskService.create(data);

  // Update badge
  const activeCount = await taskService.countActive();
  updateBadge("/tasks", String(activeCount));
  updateBadge("/tasks/active", String(activeCount));

  return task;
}

// Example: WebSocket integration
socket.on("task:created", () => {
  incrementBadge("/tasks");
});

socket.on("task:completed", () => {
  decrementBadge("/tasks/active");
  incrementBadge("/tasks/completed");
});
```

**SSE Integration:**

The assets app includes an SSE endpoint at `/api/sse/task-updates` for real-time updates:

```typescript
// Connect to SSE stream
useEffect(() => {
  const eventSource = new EventSource("/api/sse/task-updates");

  eventSource.addEventListener("task:created", (e) => {
    const task = JSON.parse(e.data);
    incrementBadge("/tasks");
  });

  eventSource.addEventListener("task:completed", (e) => {
    decrementBadge("/tasks/active");
    incrementBadge("/tasks/completed");
  });

  return () => eventSource.close();
}, []);
```

## Configuration

### Navigation Configuration

All navigation is configured in `src/config/navigation.ts`.

**NavItem Interface:**

```typescript
interface NavItem {
  title: string; // Display text
  href: string; // Navigation URL
  icon: LucideIcon; // Icon component
  badge?: string | "dynamic"; // Static value or "dynamic" for real-time
  description?: string; // Tooltip/description
  visible?: boolean; // Manual visibility control
  permission?: Permission; // Required permission to view
  children?: NavItem[]; // Nested items
  defaultExpanded?: boolean; // Default expansion state (session)
}
```

**NavGroup Interface:**

```typescript
interface NavGroup {
  id: string; // Unique identifier (required)
  title: string; // Group header text
  items: NavItem[]; // Navigation items
  visible?: boolean; // Manual visibility control
  collapsible?: boolean; // Can be collapsed by user
  defaultCollapsed?: boolean; // Default state (persisted)
  permission?: Permission; // Required permission to view
}
```

### Helper Functions

```typescript
// Check if item has children
hasChildren(item: NavItem): boolean

// Get group's default collapsed state
getGroupDefaultState(groupId: string): boolean

// Get item's default expanded state
getItemDefaultState(itemHref: string): boolean
```

### Backwards Compatibility

For backwards compatibility, flat navigation is still exported:

```typescript
// Flat array of all nav items (for breadcrumbs, search, etc.)
export const navItems: NavItem[];
```

## Usage Examples

### Example 1: Add New Navigation Item

```typescript
// src/config/navigation.ts
{
  id: "analytics",
  title: "Analytics",
  items: [
    {
      title: "Dashboard",
      href: "/analytics",
      icon: BarChart3,
      badge: "dynamic", // Real-time badge
      permission: "view:analytics",
    },
    {
      title: "Reports",
      href: "/analytics/reports",
      icon: FileText,
      children: [
        {
          title: "Sales Reports",
          href: "/analytics/reports/sales",
          icon: TrendingUp,
          permission: "view:sales-reports",
        },
        {
          title: "User Reports",
          href: "/analytics/reports/users",
          icon: Users,
          permission: "view:user-reports",
        },
      ],
    },
  ],
  collapsible: true,
  defaultCollapsed: false,
}
```

### Example 2: Update Badge on Event

```typescript
// In your component or service
import { updateBadge, incrementBadge } from "@/hooks/use-badge-updates";

// After creating a new item
async function handleCreateItem() {
  await createItem();
  incrementBadge("/dashboard"); // Increment count
}

// After fetching data
async function loadNotifications() {
  const notifications = await fetchNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;
  updateBadge("/notifications", String(unreadCount));
}
```

### Example 3: Conditional Navigation Based on Role

```typescript
// src/config/navigation.ts
{
  id: "admin",
  title: "Administration",
  permission: "view:admin", // Entire group hidden for non-admins
  items: [
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
      permission: "manage:users",
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
      permission: "manage:settings",
    },
  ],
}
```

### Example 4: Deep Nested Navigation

```typescript
// src/config/navigation.ts
{
  title: "Documentation",
  href: "/docs",
  icon: BookOpen,
  children: [
    {
      title: "Getting Started",
      href: "/docs/getting-started",
      icon: Rocket,
      children: [
        {
          title: "Installation",
          href: "/docs/getting-started/installation",
          icon: Download,
        },
        {
          title: "Configuration",
          href: "/docs/getting-started/configuration",
          icon: Settings,
        },
      ],
    },
    {
      title: "API Reference",
      href: "/docs/api",
      icon: Code,
      children: [
        {
          title: "REST API",
          href: "/docs/api/rest",
          icon: Globe,
        },
        {
          title: "GraphQL",
          href: "/docs/api/graphql",
          icon: Layers,
        },
      ],
    },
  ],
  defaultExpanded: true, // Starts expanded
}
```

### Example 5: Real-Time SSE Integration

```typescript
// In a layout or provider component
import { useEffect } from "react";
import { updateBadge, incrementBadge, decrementBadge } from "@/hooks/use-badge-updates";

export function BadgeUpdatesProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Connect to SSE stream
    const eventSource = new EventSource("/api/sse/task-updates");

    // Handle connection
    eventSource.addEventListener("connected", (e) => {
      console.log("Connected to task updates:", e.data);
    });

    // Handle task creation
    eventSource.addEventListener("task:created", (e) => {
      const task = JSON.parse(e.data);
      incrementBadge("/tasks");
      incrementBadge(`/tasks/${task.status.toLowerCase()}`);
    });

    // Handle task updates
    eventSource.addEventListener("task:updated", (e) => {
      const { task, previousStatus } = JSON.parse(e.data);
      if (previousStatus !== task.status) {
        decrementBadge(`/tasks/${previousStatus.toLowerCase()}`);
        incrementBadge(`/tasks/${task.status.toLowerCase()}`);
      }
    });

    // Handle task completion
    eventSource.addEventListener("task:completed", (e) => {
      decrementBadge("/tasks/active");
      incrementBadge("/tasks/completed");
    });

    // Handle task deletion
    eventSource.addEventListener("task:deleted", (e) => {
      const task = JSON.parse(e.data);
      decrementBadge("/tasks");
      decrementBadge(`/tasks/${task.status.toLowerCase()}`);
    });

    // Handle errors
    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return <>{children}</>;
}
```

## API Reference

### Badge Updates Hook

#### `useBadgeUpdates()`

Hook that subscribes to badge updates and returns current badge values.

```typescript
function useBadgeUpdates(): BadgeRegistry;

// Usage
const badges = useBadgeUpdates();
const taskBadge = badges["/tasks"]; // "5" or undefined
```

#### `updateBadge(href, value)`

Update badge value for a specific route.

```typescript
function updateBadge(href: string, value: string | undefined): void;

// Usage
updateBadge("/tasks", "10"); // Set to "10"
updateBadge("/tasks", undefined); // Clear badge
```

#### `incrementBadge(href, amount?)`

Increment badge count by specified amount (default: 1).

```typescript
function incrementBadge(href: string, amount?: number): void;

// Usage
incrementBadge("/notifications"); // "5" → "6"
incrementBadge("/notifications", 3); // "5" → "8"
```

#### `decrementBadge(href, amount?)`

Decrement badge count by specified amount (default: 1). Won't go below 0.

```typescript
function decrementBadge(href: string, amount?: number): void;

// Usage
decrementBadge("/notifications"); // "5" → "4"
decrementBadge("/notifications", 3); // "5" → "2"
```

#### `clearBadge(href)`

Remove badge for a specific route.

```typescript
function clearBadge(href: string): void;

// Usage
clearBadge("/tasks"); // Removes badge
```

#### `getAllBadges()`

Get all current badge values.

```typescript
function getAllBadges(): BadgeRegistry;

// Usage
const allBadges = getAllBadges();
console.log(allBadges); // { "/tasks": "5", "/notifications": "12" }
```

#### `initializeBadges(initial)`

Initialize badge registry with initial values.

```typescript
function initializeBadges(initial: BadgeRegistry): void;

// Usage
initializeBadges({
  "/tasks": "10",
  "/notifications": "3",
  "/messages": "1",
});
```

#### `startMockBadgeUpdates()`

Start mock badge simulator for development (returns cleanup function).

```typescript
function startMockBadgeUpdates(): () => void;

// Usage
const stopSimulator = startMockBadgeUpdates();
// Later...
stopSimulator();
```

### Permission System

#### `hasPermission(permission)`

Check if current user has a specific permission.

```typescript
function hasPermission(permission: Permission): boolean;

// Usage
if (hasPermission("create:tasks")) {
  // Show create button
}
```

#### `hasAnyPermission(permissions)`

Check if current user has any of the specified permissions.

```typescript
function hasAnyPermission(permissions: Permission[]): boolean;

// Usage
if (hasAnyPermission(["edit:tasks", "delete:tasks"])) {
  // Show task management UI
}
```

#### `hasAllPermissions(permissions)`

Check if current user has all of the specified permissions.

```typescript
function hasAllPermissions(permissions: Permission[]): boolean;

// Usage
if (hasAllPermissions(["view:admin", "manage:users"])) {
  // Show admin user management
}
```

#### `hasRole(role)`

Check if current user has a specific role.

```typescript
function hasRole(role: UserRole): boolean;

// Usage
if (hasRole("admin")) {
  // Show admin features
}
```

#### `getUserRole()`

Get current user's role.

```typescript
function getUserRole(): UserRole;

// Usage
const role = getUserRole(); // "admin" | "moderator" | "user" | "guest"
```

### Navigation Helpers

#### `hasChildren(item)`

Check if a navigation item has children.

```typescript
function hasChildren(item: NavItem): boolean;

// Usage
if (hasChildren(item)) {
  // Render expand/collapse control
}
```

#### `getGroupDefaultState(groupId)`

Get default collapsed state for a group.

```typescript
function getGroupDefaultState(groupId: string): boolean;

// Usage
const isCollapsed = getGroupDefaultState("content"); // true/false
```

#### `getItemDefaultState(itemHref)`

Get default expanded state for an item.

```typescript
function getItemDefaultState(itemHref: string): boolean;

// Usage
const isExpanded = getItemDefaultState("/docs"); // true/false
```

## Best Practices

### Performance

1. **Use Memoization**

   ```typescript
   const filteredItems = useMemo(
     () => items.filter((item) => hasPermission(item.permission)),
     [items],
   );
   ```

2. **Lazy Load Badge Updates**
   - Only connect to SSE when sidebar is visible
   - Disconnect when user navigates away

3. **Debounce Badge Updates**
   - Batch multiple updates together
   - Use `updateBadge` once with final value

### Accessibility

1. **ARIA Labels**
   - Groups use `role="navigation"` with `aria-label`
   - Collapsed state indicated with `aria-expanded`

2. **Keyboard Navigation**
   - All interactive elements are keyboard accessible
   - Use Tab/Shift+Tab to navigate
   - Use Enter/Space to activate

3. **Screen Reader Support**
   - Badges announced with `aria-live="polite"`
   - State changes announced

### State Management

1. **Group State** (Persisted)
   - Saved in localStorage: `sidebar-groups-collapsed`
   - Persists across sessions
   - User preference remembered

2. **Item State** (Session)
   - Kept in component state
   - Resets on page reload
   - Prevents overwhelming nested menus

### Configuration

1. **Group Items Logically**

   ```typescript
   // Good: Logical grouping
   { id: "main", title: "Main", items: [dashboard, tasks] }
   { id: "admin", title: "Admin", items: [users, settings] }

   // Bad: Random grouping
   { id: "misc", title: "Other", items: [dashboard, users, settings] }
   ```

2. **Use Meaningful Permissions**

   ```typescript
   // Good: Specific, clear permissions
   permission: "view:analytics-dashboard";
   permission: "create:blog-posts";

   // Bad: Generic permissions
   permission: "analytics";
   permission: "blogs";
   ```

3. **Badge Guidelines**
   - Use for actionable items (tasks, notifications)
   - Don't use for static counts
   - Keep badge text short (prefer "9+" over "1234")

### Security

1. **Permission Checks**
   - Always check permissions on backend too
   - Frontend checks are for UX only
   - Never trust client-side permission checks

2. **Sensitive Routes**
   - Hide admin routes for non-admins
   - Don't reveal route structure in HTML
   - Use proper auth middleware

### Animation

1. **Performance**
   - Use `transform` and `opacity` (GPU accelerated)
   - Avoid animating `width`, `height` for large elements
   - Use `will-change` sparingly

2. **Duration**
   - Fast animations: 150-250ms
   - Medium animations: 250-400ms
   - Don't exceed 400ms for UI feedback

3. **Easing**
   - Use `ease-in-out` for open/close
   - Use `ease-out` for entrances
   - Use `ease-in` for exits

## Troubleshooting

### Badges Not Updating

**Problem**: Badges don't update in real-time.

**Solutions**:

1. Verify `useBadgeUpdates()` hook is called in Sidebar
2. Check `updateBadge()` is being called with correct href
3. Verify badge is set to `"dynamic"` in navigation config
4. Check browser console for errors

### Permissions Not Working

**Problem**: Items visible when they shouldn't be.

**Solutions**:

1. Check `getUserRole()` returns correct role
2. Verify permission string matches exactly
3. Check `ROLE_PERMISSIONS` mapping in `permissions.ts`
4. Clear localStorage and refresh

### Groups Not Collapsing

**Problem**: Group won't collapse when clicked.

**Solutions**:

1. Verify `collapsible: true` in group config
2. Check localStorage quota (may be full)
3. Clear `sidebar-groups-collapsed` from localStorage
4. Check browser console for errors

### Animations Janky

**Problem**: Animations stutter or lag.

**Solutions**:

1. Reduce animation duration
2. Simplify animated elements (remove nested animations)
3. Use `transform` instead of layout properties
4. Check for heavy re-renders during animation

### Nested Items Not Showing

**Problem**: Children items don't appear.

**Solutions**:

1. Verify `children` array is properly formatted
2. Check parent item has `children` property (not `items`)
3. Verify child items aren't filtered by permissions
4. Check browser console for recursion errors

## Migration Guide

If you're upgrading from the basic sidebar, follow these steps:

### Step 1: Update Navigation Config

```typescript
// Before
export const navGroups = [
  {
    title: "Main",
    items: [{ title: "Dashboard", href: "/", icon: Home }],
  },
];

// After
export const navGroups = [
  {
    id: "main", // Add unique ID
    title: "Main",
    items: [{ title: "Dashboard", href: "/", icon: Home }],
    collapsible: false, // Add collapsible config
  },
];
```

### Step 2: Install Dependencies

```bash
npm install framer-motion
```

### Step 3: Add Hooks

Copy the following files to your project:

- `src/hooks/use-badge-updates.ts`
- `src/lib/permissions.ts`

Update `src/hooks/index.ts` to export new hooks.

### Step 4: Update Sidebar Component

Replace your existing Sidebar component with the enhanced version, or merge the new features into your existing component.

### Step 5: Test

1. Verify all navigation works
2. Test collapsible groups
3. Test nested navigation
4. Test badge updates
5. Test permissions (change mock role)
6. Test animations
7. Test mobile responsive

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Theme System](./THEME_SYSTEM.md)
- [SSE Integration](../src/app/api/sse/task-updates/route.ts)

## Support

For issues or questions:

1. Check this documentation
2. Review example implementations in codebase
3. Check browser console for errors
4. Review component source code
