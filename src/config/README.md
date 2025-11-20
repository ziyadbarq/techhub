# Configuration Directory

Centralized application configuration files for easy maintenance and updates.

## 📁 Structure

```
src/config/
├── navigation.ts    # Navigation menu items and groups configuration
├── index.ts         # Barrel export file
└── README.md        # This file
```

## 🧭 Navigation Configuration

The navigation configuration provides a single source of truth for all navigation items and groups in the application.

### Location

[`src/config/navigation.ts`](./navigation.ts)

### Quick Start

```tsx
// Use navigation groups (recommended)
import { getVisibleNavGroups } from "@/config/navigation";
const navGroups = getVisibleNavGroups();

// Or use flat items (legacy)
import { getVisibleNavItems } from "@/config/navigation";
const navItems = getVisibleNavItems();

// Check active state
import { isNavItemActive, isNavItemSection } from "@/config/navigation";
const isActive = isNavItemActive("/tasks", pathname);
const isSection = isNavItemSection("/tasks", pathname); // For nested routes
```

## 📋 Navigation Groups (New!)

Navigation groups organize items into logical sections with headers.

### NavGroup Interface

```typescript
interface NavGroup {
  id?: string; // Group identifier
  title: string; // Group header
  items: NavItem[]; // Navigation items in group
  visible?: boolean; // Visibility flag
  collapsible?: boolean; // Future: collapsible sections
  defaultCollapsed?: boolean; // Future: default state
}
```

### Adding Navigation Groups

Edit [`navigation.ts`](./navigation.ts):

```typescript
import { Home, Settings, Users } from "lucide-react";

export const navGroups: NavGroup[] = [
  {
    id: "main",
    title: "Main",
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: Home,
        description: "Overview and statistics",
      },
    ],
    visible: true,
  },
  {
    id: "settings",
    title: "Settings",
    items: [
      {
        title: "Account",
        href: "/settings",
        icon: Settings,
      },
      {
        title: "Team",
        href: "/team",
        icon: Users,
        badge: "3", // Number of team members
      },
    ],
    visible: true,
  },
];
```

### Group Features

- ✅ **Section Headers**: Automatic group titles in sidebar
- ✅ **Logical Organization**: Group related navigation items
- ✅ **Individual Visibility**: Control group and item visibility independently
- ✅ **Auto-filtering**: Empty groups are automatically hidden
- ✅ **Backward Compatible**: Flat `navItems` array still available

### Usage in Components

```tsx
import { getVisibleNavGroups } from "@/config/navigation";

const navGroups = getVisibleNavGroups();

return (
  <nav>
    {navGroups.map((group) => (
      <div key={group.id}>
        <h3>{group.title}</h3>
        {group.items.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.title}
          </Link>
        ))}
      </div>
    ))}
  </nav>
);
```

## 📦 Navigation Items

### NavItem Interface

```typescript
interface NavItem {
  title: string; // Display title
  href: string; // Route path
  icon: LucideIcon; // Lucide icon component
  badge?: string; // Optional badge text
  description?: string; // Tooltip/accessibility description
  visible?: boolean; // Visibility flag (default: true)
}
```

### Features

- ✅ **Type Safety**: Full TypeScript support
- ✅ **Badge Support**: Add "New", "Beta", or count badges
- ✅ **Active State Tracking**: Automatic route highlighting
- ✅ **Section Highlighting**: Highlight parent routes in nested navigation
- ✅ **Icon Integration**: Full Lucide React icon support
- ✅ **Accessibility**: Descriptions for screen readers

## 🎨 Advanced Features

### Section Highlighting

The `isNavItemSection` helper highlights parent routes when viewing nested pages:

```typescript
import { isNavItemSection } from "@/config/navigation";

// On page: /tasks/123
isNavItemActive("/tasks", "/tasks/123"); // false
isNavItemSection("/tasks", "/tasks/123"); // true - highlights Tasks section
```

### Badge Indicators

Badges adapt to sidebar state:

- **Expanded**: Full badge text displayed
- **Collapsed**: Red dot indicator for notifications

```typescript
{
  title: "Messages",
  href: "/messages",
  icon: Mail,
  badge: "5", // Shows "5" when expanded, dot when collapsed
}
```

### Visibility Control

Hide items or entire groups during development:

```typescript
{
  id: "beta-features",
  title: "Beta Features",
  items: [/* ... */],
  visible: false, // Hides entire group
}
```

## 📖 Examples

### Basic Navigation Item

```typescript
{
  title: "Dashboard",
  href: "/",
  icon: Home,
}
```

### With Badge

```typescript
{
  title: "Notifications",
  href: "/notifications",
  icon: Bell,
  badge: "12", // Notification count
  description: "View your notifications",
}
```

### Hidden Feature Flag

```typescript
{
  title: "Analytics",
  href: "/analytics",
  icon: BarChart,
  badge: "Beta",
  description: "View analytics dashboard",
  visible: false, // Hidden until ready
}
```

### Complete Group Example

```typescript
{
  id: "content",
  title: "Content Management",
  items: [
    {
      title: "Posts",
      href: "/posts",
      icon: FileText,
      badge: "23",
      description: "Manage blog posts",
    },
    {
      title: "Media",
      href: "/media",
      icon: Image,
      description: "Manage media files",
    },
  ],
  visible: true,
}
```

## 🔧 Helper Functions

### `getVisibleNavGroups()`

Returns filtered groups with visible items only.

```typescript
const navGroups = getVisibleNavGroups();
// Returns: NavGroup[] (excludes hidden groups/items, removes empty groups)
```

### `getVisibleNavItems()`

Returns flat array of all visible items (legacy support).

```typescript
const navItems = getVisibleNavItems();
// Returns: NavItem[] (flattens all groups)
```

### `isNavItemActive(href, pathname)`

Checks if navigation item matches current route.

```typescript
isNavItemActive("/tasks", "/tasks"); // true - exact match
isNavItemActive("/tasks", "/tasks/123"); // true - prefix match
isNavItemActive("/", "/tasks"); // false - home needs exact match
```

### `isNavItemSection(href, pathname)`

Checks if in same section but not exact match (for subtle highlighting).

```typescript
isNavItemSection("/tasks", "/tasks/123"); // true
isNavItemSection("/tasks", "/tasks"); // false
isNavItemSection("/", "/tasks"); // false
```

### `getNavItemByHref(href)`

Find specific navigation item by route.

```typescript
const taskNav = getNavItemByHref("/tasks");
// Returns: NavItem | undefined
```

## 🎯 Best Practices

1. **Use Groups for Organization**: Group related items together
2. **Descriptive Group Titles**: Use clear, concise group names
3. **Logical Ordering**: Order groups by importance/frequency of use
4. **Consistent Icons**: Use Lucide React icons exclusively
5. **Meaningful Badges**: Use badges for actionable information
6. **Add Descriptions**: Improve accessibility and UX
7. **Feature Flags**: Use `visible: false` for work-in-progress features

## 🔄 Migration Guide

### From Flat Items to Groups

**Before:**

```typescript
export const navItems: NavItem[] = [
  { title: "Home", href: "/", icon: Home },
  { title: "Settings", href: "/settings", icon: Settings },
];
```

**After:**

```typescript
export const navGroups: NavGroup[] = [
  {
    id: "main",
    title: "Main",
    items: [{ title: "Home", href: "/", icon: Home }],
  },
  {
    id: "settings",
    title: "Settings",
    items: [{ title: "Settings", href: "/settings", icon: Settings }],
  },
];

// Flat array still available for backward compatibility
export const navItems: NavItem[] = navGroups.flatMap((group) => group.items);
```

### Component Migration

**Before:**

```tsx
const navItems = getVisibleNavItems();
{
  navItems.map((item) => <Link href={item.href}>{item.title}</Link>);
}
```

**After:**

```tsx
const navGroups = getVisibleNavGroups();
{
  navGroups.map((group) => (
    <div key={group.id}>
      <h3>{group.title}</h3>
      {group.items.map((item) => (
        <Link href={item.href}>{item.title}</Link>
      ))}
    </div>
  ));
}
```

## 🚀 Future Enhancements

Planned features for navigation system:

- ✅ **Groups** (Implemented)
- ⏳ **Collapsible Groups**: Expand/collapse sections
- ⏳ **Nested Navigation**: Multi-level menus
- ⏳ **Permissions**: Role-based visibility
- ⏳ **External Links**: Support for external URLs
- ⏳ **Dynamic Badges**: Real-time updates
- ⏳ **Custom Renderers**: Custom link components
- ⏳ **Search**: Quick navigation search

## 📚 Related Files

- [Sidebar Component](../components/layout/Sidebar.tsx) - Uses grouped navigation
- [Header Component](../components/layout/Header.tsx) - Breadcrumb generation
- [Navigation Config](./navigation.ts) - Configuration source
- [Hook Utilities](../hooks/) - useLocalStorage, useFocusTrap

## 💡 Tips

- Group headers are hidden in collapsed sidebar view
- Badges show as dots when sidebar is collapsed
- Section highlighting provides visual context in nested routes
- Use keyboard shortcuts: Ctrl/Cmd+B to toggle sidebar
- Focus trap ensures accessibility in mobile menu
- All navigation state is persisted to localStorage
