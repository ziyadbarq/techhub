# End-User Documentation System

Technical guide for the in-app documentation system serving TechHub end-users.

> **Important**: This documentation system is for **end-users** (employees using the system), NOT for developers. Developer documentation lives in `docs/`.

## Overview

The documentation system provides in-app help accessible at `/docs/*`. It uses MDX (Markdown + JSX) with:
- Categorized navigation with collapsible groups
- Permission-gated content
- Glossary-aware search with Cmd+K
- Reading time estimates and table of contents
- Mobile-responsive design

## Directory Structure

```
src/content/docs/
├── getting-started/           # Category folder
│   ├── _meta.ts               # Category metadata
│   └── index.mdx              # Doc page
├── user-guides/
│   ├── _meta.ts
│   └── workflows.mdx
├── admin-guides/
│   ├── _meta.ts
│   └── overview.mdx
├── modules/
│   ├── _meta.ts
│   └── service-management.mdx
├── reference/
│   ├── _meta.ts
│   └── entities.mdx
└── troubleshooting/
    ├── _meta.ts
    └── common-issues.mdx
```

## Category Configuration

Each category folder has a `_meta.ts` file defining metadata:

```typescript
// src/content/docs/admin-guides/_meta.ts
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export default {
  title: "Admin Guides",
  description: "System administration and RBAC",
  icon: "ShieldCheck",              // Lucide icon name
  order: 3,                         // Sort order (lower = higher)
  collapsed: false,                 // Start collapsed in nav (default: false)
  requiredPermission: PERMISSIONS.USERS_MANAGE,  // Gate entire category
  featureFlag: "ADMIN_DOCS",        // Optional feature flag check
};
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Display name in navigation |
| `description` | string | No | Category description |
| `icon` | string | No | Lucide icon name |
| `order` | number | No | Sort order (default: 999) |
| `collapsed` | boolean | No | Start collapsed (default: false) |
| `requiredPermission` | PermissionKey | No | Permission to view category |
| `featureFlag` | string | No | Feature flag to show category |

## Document Frontmatter

Each MDX file requires YAML frontmatter:

```yaml
---
title: "Getting Started"
description: "Foundation layer and data management basics"
icon: "Lightbulb"
order: 1
taskType: "concept"
estimatedTime: "10 minutes"
keywords: ["foundation", "setup", "basics"]
searchBoost: 10
relatedDocs: ["reference/entities", "user-guides/workflows"]
requiredPermission: "USERS_MANAGE"
---
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | **Yes** | Page title |
| `description` | string | **Yes** | Page description (shown in nav and search) |
| `icon` | string | No | Lucide icon name |
| `order` | number | No | Sort within category (default: 999) |
| `taskType` | string | No | `"how-to"` \| `"reference"` \| `"troubleshooting"` \| `"concept"` |
| `estimatedTime` | string | No | e.g., "5 minutes" |
| `keywords` | string[] | No | Additional search terms |
| `searchBoost` | number | No | 1-10, higher = more prominent in search |
| `relatedDocs` | string[] | No | Slugs of related docs |
| `requiredPermission` | PermissionKey | No | Permission required to view |
| `featureFlag` | string | No | Feature flag required |
| `lastReviewedDate` | string | No | ISO date for maintenance tracking |

## MDX Components

Custom components available in MDX files:

### Callout

Highlighted notices for important information:

```mdx
<Callout type="info">
  This is an informational message.
</Callout>

<Callout type="warning">
  Be careful with this action.
</Callout>

<Callout type="error">
  This action cannot be undone!
</Callout>

<Callout type="success">
  Operation completed successfully.
</Callout>
```

### Steps

Sequential step-by-step instructions:

```mdx
<Steps>
  <Step title="Create a vendor">
    Navigate to Vendors and click "Add Vendor".
  </Step>
  <Step title="Fill in details">
    Enter the vendor name, contact information, and category.
  </Step>
  <Step title="Save">
    Click "Save" to create the vendor record.
  </Step>
</Steps>
```

### Tabs

Tabbed content for alternatives or platform-specific info:

```mdx
<Tabs defaultValue="chrome">
  <TabsList>
    <TabsTrigger value="chrome">Chrome</TabsTrigger>
    <TabsTrigger value="firefox">Firefox</TabsTrigger>
    <TabsTrigger value="safari">Safari</TabsTrigger>
  </TabsList>
  <TabsContent value="chrome">
    Instructions for Chrome users...
  </TabsContent>
  <TabsContent value="firefox">
    Instructions for Firefox users...
  </TabsContent>
  <TabsContent value="safari">
    Instructions for Safari users...
  </TabsContent>
</Tabs>
```

### PropertyTable and Property

Document object properties or field definitions:

```mdx
<PropertyTable>
  <Property name="name" type="string" required>
    The vendor's display name.
  </Property>
  <Property name="email" type="string">
    Primary contact email address.
  </Property>
  <Property name="status" type="enum" default="active">
    Current status: `active`, `inactive`, or `pending`.
  </Property>
</PropertyTable>
```

### LinkCard and CardGrid

Navigation cards for linking to related pages:

```mdx
<CardGrid>
  <LinkCard
    title="Asset Management"
    description="Track and manage your hardware assets"
    href="/assets"
    icon="Package"
  />
  <LinkCard
    title="License Management"
    description="Manage software licenses and entitlements"
    href="/license-products"
    icon="Key"
  />
</CardGrid>
```

### DocsAccordion

Collapsible FAQ or expandable sections:

```mdx
<DocsAccordion>
  <DocsAccordionItem title="How do I reset my password?">
    Navigate to the login page and click "Forgot Password". Follow the email instructions.
  </DocsAccordionItem>
  <DocsAccordionItem title="Can I export data to Excel?">
    Yes, most list views include an "Export" button that downloads data as CSV or XLSX.
  </DocsAccordionItem>
</DocsAccordion>
```

### ZoomableImage

Images that can be clicked to zoom:

```mdx
<ZoomableImage
  src="/images/docs/dashboard-overview.png"
  alt="Dashboard overview"
  caption="The main dashboard showing key metrics"
/>
```

### Card

Simple info cards:

```mdx
<Card title="Pro Tip" description="Time-saving hint">
  Use keyboard shortcuts to navigate faster. Press `?` to see all shortcuts.
</Card>
```

## Permission Gating

### Category-Level Gating

Gate an entire category in its `_meta.ts`:

```typescript
export default {
  title: "Admin Guides",
  requiredPermission: PERMISSIONS.USERS_MANAGE,
};
```

Users without the permission won't see the category in navigation.

### Document-Level Gating

Gate a specific document in its frontmatter:

```yaml
---
title: "RBAC Configuration"
requiredPermission: "ROLES_MANAGE"
---
```

### How Gating Works

1. **Navigation filtering**: Categories/docs requiring permissions the user lacks are hidden from nav
2. **Page access**: Direct URL access to gated docs returns 404 for unauthorized users
3. **Search filtering**: Gated docs don't appear in search results for unauthorized users

## Search System

### Cmd+K Global Search

The search modal is accessible via:
- Clicking the search button in the header
- Pressing `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux)

### Glossary-Aware Search

The glossary (`src/lib/docs/glossary.ts`) maps canonical terms to synonyms:

```typescript
export const DOCS_GLOSSARY: Record<string, string[]> = {
  asset: ["device", "equipment", "hardware", "machine", "item"],
  person: ["employee", "staff", "user", "team member", "worker"],
  vendor: ["supplier", "provider", "partner", "contractor"],
  // ...
};
```

When a user searches for "employee", results for "person" are also included.

### Boosting Search Results

Use `searchBoost` in frontmatter (1-10) to prioritize important docs:

```yaml
---
searchBoost: 10  # Most important, appears first
---
```

## Reading Experience Features

### Table of Contents

Automatically generated from `##`, `###`, and `####` headings. Displayed in a sticky right sidebar on desktop.

### Reading Time

Calculated from content word count. Override with frontmatter:

```yaml
estimatedTime: "15 minutes"
```

### Related Documents

Link to related docs for cross-navigation:

```yaml
relatedDocs: ["reference/entities", "user-guides/workflows"]
```

### Previous/Next Navigation

Automatic pagination based on category order.

### Scroll to Top

Floating button appears when scrolled down.

### Feedback Component

Users can rate docs as helpful/unhelpful (optional implementation).

## Core Library

Location: `src/lib/docs/`

| File | Purpose |
|------|---------|
| `types.ts` | TypeScript interfaces for docs system |
| `content-loader.ts` | Load and parse MDX files |
| `navigation-builder.ts` | Build navigation structure |
| `glossary.ts` | Search term expansion |
| `reading-time.ts` | Reading time calculation |
| `permissions.ts` | Permission checking utilities |
| `index.ts` | Re-exports all utilities |

## UI Components

Location: `src/components/docs/`

| Component | Purpose |
|-----------|---------|
| `DocsHeader` | Header with search and mobile nav toggle |
| `DocsSidebar` | Left navigation sidebar (desktop) |
| `DocsMobileNav` | Sheet-based mobile navigation |
| `DocsNavGroup` | Collapsible category in sidebar |
| `DocsRightSidebar` | Table of contents (desktop) |
| `DocsPagination` | Previous/next navigation |
| `Breadcrumb` | Breadcrumb navigation |
| `ReadingProgress` | Top reading progress bar |
| `ScrollToTop` | Floating scroll-to-top button |
| `DocsFeedback` | Helpful/not helpful feedback |
| `RelatedDocs` | Related documents section |

Location: `src/components/mdx/`

| Component | Purpose |
|-----------|---------|
| `mdx-components.tsx` | MDX component mappings |
| `code-block.tsx` | Syntax-highlighted code blocks |
| `zoomable-image.tsx` | Clickable zoomable images |
| `tabs.tsx` | Tabbed content |
| `steps.tsx` | Step-by-step guides |
| `property-table.tsx` | Property documentation tables |
| `link-card.tsx` | Navigation cards |
| `docs-accordion.tsx` | Collapsible sections |

## Adding a New Document

1. **Determine category**: Choose existing category or create new one
2. **Create MDX file**: Add `{slug}.mdx` in category folder
3. **Add frontmatter**: Include required `title` and `description`
4. **Write content**: Use MDX components as needed
5. **Test**: Visit `/docs/{category}/{slug}` to verify

### Example New Document

```mdx
---
title: "Managing Warranties"
description: "Track warranty coverage and expiration dates"
icon: "Shield"
order: 3
taskType: "how-to"
estimatedTime: "5 minutes"
keywords: ["warranty", "coverage", "expiration", "support"]
relatedDocs: ["reference/entities", "user-guides/workflows"]
---

# Managing Warranties

Warranties help you track support coverage for your assets.

## Creating a Warranty

<Steps>
  <Step title="Navigate to Warranties">
    Go to **Assets** → **Warranties** from the main menu.
  </Step>
  <Step title="Click Add Warranty">
    Click the "Add Warranty" button in the top right.
  </Step>
  <Step title="Fill in details">
    Enter the warranty provider, coverage dates, and linked asset.
  </Step>
</Steps>

<Callout type="info">
  Set up email notifications to be alerted before warranties expire.
</Callout>

## Warranty Fields

<PropertyTable>
  <Property name="provider" type="string" required>
    The warranty provider or vendor name.
  </Property>
  <Property name="startDate" type="date" required>
    When coverage begins.
  </Property>
  <Property name="endDate" type="date" required>
    When coverage expires.
  </Property>
  <Property name="asset" type="reference">
    The asset covered by this warranty.
  </Property>
</PropertyTable>
```

## Adding a New Category

1. **Create folder**: `src/content/docs/{category-id}/`
2. **Add `_meta.ts`**:

```typescript
export default {
  title: "Category Name",
  description: "Category description",
  icon: "IconName",
  order: 5,
};
```

3. **Add documents**: Create MDX files in the folder
4. **Test**: Navigation updates automatically

## Best Practices

### Content Guidelines

1. **Write for end-users**: Avoid technical jargon; explain in business terms
2. **Task-oriented**: Focus on "how to" rather than system internals
3. **Use visuals**: Include screenshots with `<ZoomableImage>`
4. **Keep it scannable**: Use headings, lists, and callouts
5. **Link related content**: Use `relatedDocs` and inline links

### Organization

1. **Logical categories**: Group by user workflow, not system structure
2. **Consistent ordering**: Use `order` to arrange docs logically
3. **Descriptive titles**: Clear, action-oriented titles
4. **Good descriptions**: Write descriptions that help users find content

### Maintenance

1. **Review regularly**: Update `lastReviewedDate` when content is verified
2. **Keep glossary current**: Add new terms as features launch
3. **Update related docs**: Maintain cross-references when content changes
4. **Test permissions**: Verify gated content is properly hidden

## Routes

| Route | Purpose |
|-------|---------|
| `/docs` | Documentation index (redirects to first category) |
| `/docs/{category}/{slug}` | Individual doc page |

## Technical Notes

### MDX Processing

- MDX is rendered server-side via `next-mdx-remote/rsc`
- Plugins: `remark-gfm`, `rehype-highlight`, `rehype-slug`, `rehype-autolink-headings`
- Components are passed to MDX at render time (not build time)

### Performance

- Navigation is built on each request (could be cached in production)
- Search operates on loaded frontmatter (no full-text index)
- Images should be optimized before adding to `public/images/docs/`

### Caching

Consider implementing Redis caching for:
- Built navigation structure
- Parsed frontmatter
- Search index
