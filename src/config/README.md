# Configuration Directory

Centralized application configuration files for easy maintenance and updates.

## 📁 Structure

```
src/config/
├── branding.ts      # Branding, logos, taglines, and company info
├── navigation.ts    # Navigation menu items and groups configuration
├── index.ts         # Barrel export file
└── README.md        # This file
```

## 🎨 Branding Configuration

Centralized branding constants for app identity, logos, taglines, and company information. Single source of truth for all branding-related content across the application.

### Location

[`src/config/branding.ts`](./branding.ts)

### Quick Start

```tsx
// Import branding constants
import { BRANDING } from "@/config/branding";

// Use app name
<h1>{BRANDING.app.name}</h1> // "barq TechHub"

// Use logo (theme-aware)
import { getLogoPath } from "@/config/branding";
const logoPath = getLogoPath(theme);

// Use copyright text
import { getCopyrightText } from "@/config/branding";
<footer>{getCopyrightText()}</footer>

// Use page metadata
import { getPageTitle, getPageDescription } from "@/config/branding";
export const metadata = {
  title: getPageTitle("landing"),
  description: getPageDescription("default"),
};
```

### Branding Object Structure

```typescript
export const BRANDING = {
  app: {
    name: string;           // "barq TechHub"
    shortName: string;      // "TechHub"
    fullTitle: string;      // Full page title
  },
  company: {
    name: string;           // "Barq"
    legalName: string;      // Legal entity name
    website: string;        // Company website URL
  },
  logos: {
    icon: {
      default: string;      // Icon for light theme
      whiteBG: string;      // Icon with white background
    },
    full: {
      light: string;        // Full logo for light theme
      dark: string;         // Full logo for dark theme
      fallback: string;     // External fallback URL
    },
  },
  taglines: {
    main: string;           // Main hero tagline
    short: string;          // Short description
    hero: string;           // Hero subheading
    compliance: string;     // Compliance tagline
    auth: string;           // Auth page tagline
  },
  valueProps: {
    heading: string;        // Value proposition heading
    subheading: string;     // Value proposition subheading
  },
  faq: {
    heading: string;        // FAQ section heading
    subheading: string;     // FAQ section subheading
  },
  sama: {
    compliance: {
      ready: string;        // "SAMA Compliance Ready"
      tagline: string;      // SAMA tagline
      internal: string;     // Internal use notice
      internalApproval: string; // Approval notice
      features: string[];   // Feature list
    },
  },
  contact: {
    support: {
      email: string;        // Support email
      helpText: string;     // Help text
    },
  },
  auth: {
    login: {
      heading: string;      // Login page heading
      subheading: string;   // Login page subheading
    },
    register: {
      heading: string;      // Register page main heading
      subheading: string;   // Register page description
      cta: string;          // Registration CTA
      ctaSubheading: string; // CTA subheading
    },
  },
  footer: {
    description: string;    // Footer description
    builtBy: string;        // "Built by Barq Technology Team"
    builtFor: string;       // "Built for Barq employees"
  },
  copyright: {
    template: (year: number) => string; // Copyright template function
    currentYear: () => number;          // Current year helper
  },
  ai: {
    name: string;           // AI assistant name
    tagline: string;        // AI assistant tagline
  },
} as const;
```

### Features

- ✅ **Type Safety**: All values typed with `as const` for literal types
- ✅ **Single Source of Truth**: No hardcoded branding strings in components
- ✅ **Easy Rebranding**: Update one file to rebrand entire app
- ✅ **Theme-Aware Logos**: Automatic logo selection based on theme
- ✅ **Helper Functions**: Utilities for common patterns (copyright, metadata)
- ✅ **Autocomplete**: Full IDE autocomplete support
- ✅ **SAMA Compliance**: Built-in compliance messaging

### Helper Functions

#### `getLogoPath(theme, variant)`

Returns appropriate logo path based on current theme.

```typescript
import { getLogoPath } from "@/config/branding";
import { useTheme } from "next-themes";

const { theme } = useTheme();
const logoPath = getLogoPath(theme, "full");
// Returns: light theme logo or dark theme logo
```

**Parameters:**
- `theme`: `"light" | "dark" | "system" | undefined`
- `variant`: `"full" | "icon"` (default: `"full"`)

**Returns:** Logo file path string

#### `getCopyrightText(year?)`

Generates copyright text with optional year override.

```typescript
import { getCopyrightText } from "@/config/branding";

// Current year
<p>{getCopyrightText()}</p>
// Output: "© 2025 Barq. All rights reserved."

// Specific year
<p>{getCopyrightText(2024)}</p>
// Output: "© 2024 Barq. All rights reserved."
```

**Parameters:**
- `year`: `number` (optional, defaults to current year)

**Returns:** Copyright string

#### `getCopyrightWithTagline(tagline)`

Generates copyright with custom tagline.

```typescript
import { getCopyrightWithTagline } from "@/config/branding";

<p>{getCopyrightWithTagline(BRANDING.footer.builtFor)}</p>
// Output: "© 2025 Barq. All rights reserved. Built for Barq employees."
```

**Parameters:**
- `tagline`: `string`

**Returns:** Copyright string with tagline

#### `getPageTitle(page)`

Generates page title with app name suffix.

```typescript
import { getPageTitle } from "@/config/branding";

export const metadata = {
  title: getPageTitle("home"),
  // Output: "barq TechHub | Enterprise CMDB & ITAM System"
};
```

**Parameters:**
- `page`: `"home" | "landing"` (extensible)

**Returns:** Full page title string

#### `getPageDescription(variant)`

Returns appropriate meta description.

```typescript
import { getPageDescription } from "@/config/branding";

export const metadata = {
  description: getPageDescription("default"),
  // Output: "Track everything. Automate workflows. Pass audits."
};
```

**Parameters:**
- `variant`: `"default" | "landing"` (extensible)

**Returns:** Meta description string

### Usage Examples

#### Basic App Name

```tsx
import { BRANDING } from "@/config/branding";

<h1>{BRANDING.app.name}</h1>
// Output: "barq TechHub"
```

#### Theme-Aware Logo

```tsx
import { BRANDING } from "@/config/branding";
import { getLogoPath } from "@/config/branding";
import { useTheme } from "next-themes";
import Image from "next/image";

const { theme } = useTheme();

<Image
  src={getLogoPath(theme, "full")}
  alt={`${BRANDING.app.name} Logo`}
  width={120}
  height={40}
/>
```

#### Page Metadata

```tsx
import { getPageTitle, getPageDescription } from "@/config/branding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getPageTitle("home"),
  description: getPageDescription("default"),
};
```

#### Footer with Copyright

```tsx
import { BRANDING, getCopyrightText } from "@/config/branding";

<footer>
  <p>{BRANDING.footer.description}</p>
  <p>{getCopyrightText()}</p>
</footer>
```

#### SAMA Compliance Notice

```tsx
import { BRANDING } from "@/config/branding";

<div className="compliance-notice">
  <Shield className="icon" />
  <p>{BRANDING.sama.compliance.internal}</p>
</div>
```

#### Auth Page Headings

```tsx
import { BRANDING } from "@/config/branding";

<div>
  <h1>{BRANDING.auth.login.heading}</h1>
  <p>{BRANDING.auth.login.subheading}</p>
</div>
```

### Best Practices

1. **Always Import from Config**: Never hardcode branding strings in components
2. **Use Helper Functions**: Leverage utilities for common patterns
3. **Theme-Aware Components**: Use `getLogoPath()` for automatic theme handling
4. **Consistent Naming**: Follow brand guidelines (lowercase "b" in "barq TechHub")
5. **Extend, Don't Modify**: Add new properties to BRANDING object as needed
6. **Type Safety**: Maintain `as const` assertion for literal types
7. **Document Changes**: Update this README when adding new branding properties

### Migration Notes

**Before Centralization:**
```tsx
<h1>barq TechHub</h1>
<p>© 2025 Barq. All rights reserved.</p>
<img src="/logos/logo-black.svg" alt="Logo" />
```

**After Centralization:**
```tsx
import { BRANDING, getCopyrightText, getLogoPath } from "@/config/branding";
import { useTheme } from "next-themes";

const { theme } = useTheme();

<h1>{BRANDING.app.name}</h1>
<p>{getCopyrightText()}</p>
<img src={getLogoPath(theme)} alt={`${BRANDING.app.name} Logo`} />
```

### Extending Branding Config

To add new branding properties:

```typescript
// In branding.ts
export const BRANDING = {
  // ... existing properties
  social: {
    twitter: "https://twitter.com/barq",
    linkedin: "https://linkedin.com/company/barq",
  },
} as const;
```

Then use in components:

```tsx
import { BRANDING } from "@/config/branding";

<a href={BRANDING.social.twitter}>Follow us</a>
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
