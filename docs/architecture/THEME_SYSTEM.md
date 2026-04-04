# Theme System Documentation

## Overview

The TechHub application uses a centralized, type-safe theme system built on **Next.js 16**, **Tailwind CSS 4**, and **shadcn/ui**. The system provides:

- ✅ **Single Source of Truth** - All colors defined in one place
- ✅ **Type Safety** - TypeScript types for all theme tokens
- ✅ **DRY Principles** - No duplicate color definitions
- ✅ **SOLID Architecture** - Clear separation of concerns
- ✅ **OKLCH Color Space** - Modern, perceptually uniform colors
- ✅ **Dark Mode Support** - Automatic theme switching
- ✅ **Semantic Tokens** - Meaningful color names (primary, destructive, etc.)
- ✅ **Brand Integration** - barq brand colors as Tailwind utilities

---

## Architecture

### Theme System Layers

```
┌─────────────────────────────────────────────────┐
│  Components (Presentation Layer)                 │
│  Use: className="bg-barq-yellow"                 │
├─────────────────────────────────────────────────┤
│  Tailwind Utilities (Integration Layer)          │
│  Defined in: globals.css (@theme block)          │
├─────────────────────────────────────────────────┤
│  Theme Utilities (Business Logic)                │
│  Defined in: src/lib/theme/utils.ts              │
├─────────────────────────────────────────────────┤
│  Design Tokens (Abstraction Layer)               │
│  Defined in: src/lib/theme/tokens.ts             │
├─────────────────────────────────────────────────┤
│  Constants (Single Source of Truth)              │
│  Defined in: src/lib/theme/constants.ts          │
├─────────────────────────────────────────────────┤
│  CSS Variables (Foundation)                      │
│  Defined in: src/app/globals.css                 │
└─────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── app/
│   └── globals.css                   # CSS variables, @theme block, and base styles
├── lib/
│   └── theme/
│       ├── index.ts                  # Barrel export
│       ├── types.ts                  # TypeScript types
│       ├── constants.ts              # Color constants and mappings
│       ├── tokens.ts                 # Design token system
│       └── utils.ts                  # Utility functions
└── components/                       # Use theme in components

postcss.config.js                     # PostCSS configuration with Tailwind CSS 4
```

---

## Usage Guide

### 1. Using Theme Colors in Components

#### ✅ Recommended: Tailwind Utilities

```tsx
// barq Brand Colors
<div className="bg-barq-yellow text-barq-black">
  Yellow background with black text
</div>

<div className="bg-barq-light-blue text-barq-black">
  Light blue background
</div>

// With opacity
<div className="bg-barq-yellow/10 text-barq-yellow">
  10% yellow background
</div>
```

#### ✅ Recommended: Semantic Tokens

```tsx
// Semantic colors (adapt to dark mode automatically)
<Button className="bg-primary text-primary-foreground">
  Primary Button
</Button>

<div className="bg-destructive/10 text-destructive">
  Error Message
</div>

<div className="bg-success/10 text-success">
  Success Message
</div>
```

#### ❌ Avoid: Hardcoded Colors

```tsx
// DON'T DO THIS
<div className="text-[#FFDA00]">Bad Practice</div>
<div className="bg-[--color-barq-yellow]">Bad Practice</div>
<div className="text-[#1e2024]">Bad Practice</div>
```

### 2. Using Theme Utilities

```tsx
import { getBarqColor, buildBrandClass, brandColorClasses } from "@/lib/theme";

// Get color value
const yellow = getBarqColor("yellow"); // "#ffda00"

// Use pre-built class combinations
<div className={brandColorClasses.primary.bg}>Primary brand background</div>;

// Build custom combinations
const classes = buildBrandClass("primary", ["bg", "text"]);
// Result: "bg-barq-yellow text-barq-black"
```

### 3. Using Design Tokens

```tsx
import { colorTokens, getTokenValue, getTokenCSSValue } from "@/lib/theme";

// Get token value
const yellowValue = getTokenValue(colorTokens.barq.yellow);
// Returns: "#ffda00"

// Get CSS variable expression
const yellowCSS = getTokenCSSValue(colorTokens.barq.yellow);
// Returns: "var(--color-barq-yellow)"

// Access token metadata
console.log(colorTokens.barq.yellow.description);
// "barq brand yellow - primary accent and call-to-action color"
```

---

## Color Reference

### barq Brand Colors

| Color      | Value     | Tailwind Utility     | CSS Variable              |
| ---------- | --------- | -------------------- | ------------------------- |
| Yellow     | `#ffda00` | `bg-barq-yellow`     | `--color-barq-yellow`     |
| Light Blue | `#dff5f7` | `bg-barq-light-blue` | `--color-barq-light-blue` |
| Black      | `#1e2024` | `bg-barq-black`      | `--color-barq-black`      |
| White      | `#ffffff` | `bg-barq-white`      | `--color-barq-white`      |

### Semantic Colors

| Token         | Use Case               | Tailwind Utility |
| ------------- | ---------------------- | ---------------- |
| `primary`     | Main brand color       | `bg-primary`     |
| `secondary`   | Secondary actions      | `bg-secondary`   |
| `destructive` | Errors, delete actions | `bg-destructive` |
| `success`     | Success messages       | `bg-success`     |
| `warning`     | Warnings, cautions     | `bg-warning`     |
| `info`        | Informational messages | `bg-info`        |
| `muted`       | Subdued backgrounds    | `bg-muted`       |
| `accent`      | Highlights, focus      | `bg-accent`      |
| `border`      | Borders                | `border-border`  |

### Foreground Pairs

Each background color has a matching foreground color:

```tsx
<div className="bg-primary text-primary-foreground">
  Automatically readable text
</div>

<div className="bg-destructive text-destructive-foreground">
  Error with proper contrast
</div>
```

---

## Common Patterns

### 1. Buttons

```tsx
// Primary action button
<Button className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90">
  Create Presentation
</Button>

// Destructive action
<Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
  Delete
</Button>

// Secondary action
<Button className="bg-secondary text-secondary-foreground">
  Cancel
</Button>
```

### 2. Cards with Brand Accents

```tsx
<Card className="hover:border-barq-yellow/50">
  <CardHeader>
    <div className="bg-barq-yellow/10 rounded-lg p-2">
      <Icon className="text-barq-yellow h-5 w-5" />
    </div>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

### 3. Badges

```tsx
// Info badge
<div className="bg-info/10 text-info px-2 py-1 rounded-md">
  Information
</div>

// Warning badge
<div className="bg-warning/10 text-warning px-2 py-1 rounded-md">
  Warning
</div>

// Success badge
<div className="bg-success/10 text-success px-2 py-1 rounded-md">
  Success
</div>
```

### 4. Dark Mode Support

```tsx
// Automatically adapts to dark mode
<div className="bg-background text-foreground">
  Content (automatic dark mode)
</div>

// Custom dark mode styles
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Custom dark mode
</div>

// Using theme utilities
import { isDarkMode, getCurrentThemeMode } from "@/lib/theme";

if (isDarkMode()) {
  console.log("Dark mode is active");
}
```

---

## Best Practices

### DO ✅

1. **Use Tailwind Utilities**

   ```tsx
   <div className="bg-barq-yellow text-barq-black" />
   ```

2. **Use Semantic Tokens**

   ```tsx
   <div className="bg-destructive text-destructive-foreground" />
   ```

3. **Use Opacity Modifiers**

   ```tsx
   <div className="bg-barq-yellow/10 border-barq-yellow/30" />
   ```

4. **Group Related Styles**

   ```tsx
   import { brandColorClasses } from "@/lib/theme";
   <div className={brandColorClasses.primary.bg} />;
   ```

5. **Use Theme Utilities for Logic**
   ```tsx
   import { getBarqColor, getContrastColor } from "@/lib/theme";
   const bgColor = getBarqColor("yellow");
   const textColor = getContrastColor(bgColor); // "dark" or "light"
   ```

### DON'T ❌

1. **Hardcode Hex Colors**

   ```tsx
   // BAD
   <div className="text-[#FFDA00]" />
   ```

2. **Use Arbitrary CSS Variables**

   ```tsx
   // BAD
   <div className="bg-[--color-barq-yellow]" />
   ```

3. **Use Color-Specific Classes**

   ```tsx
   // BAD (not semantic)
   <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700" />

   // GOOD (semantic)
   <div className="bg-info/10 text-info" />
   ```

4. **Mix Color Spaces**

   ```tsx
   // BAD (inconsistent)
   <div style={{ color: "hsl(var(--primary))" }} />

   // GOOD
   <div className="text-primary" />
   ```

---

## Migration Guide

### Migrating from Hardcoded Colors

**Before:**

```tsx
<div className="bg-[#FFDA00]/10 text-[#FFDA00]">Yellow accent</div>
```

**After:**

```tsx
<div className="text-barq-yellow bg-barq-yellow/10">Yellow accent</div>
```

### Migrating from CSS Variables

**Before:**

```tsx
<div className="bg-[--color-barq-yellow] text-[--color-barq-black]">
  Brand colors
</div>
```

**After:**

```tsx
<div className="bg-barq-yellow text-barq-black">Brand colors</div>
```

### Migrating from Color-Specific Classes

**Before:**

```tsx
<Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
  Info
</Badge>
```

**After:**

```tsx
<Badge className="bg-info/10 text-info">Info</Badge>
```

---

## Extending the Theme

### Adding New Brand Colors

1. **Add to CSS Variables** (`src/app/globals.css` in the `@theme` block):

   ```css
   @theme {
     /* Existing colors... */
     --color-barq-black: #1e2024;
     --color-barq-white: #ffffff;
     --color-barq-light-blue: #dff5f7;
     --color-barq-yellow: #ffda00;

     /* New color */
     --color-barq-green: #00ff00;
   }
   ```

2. **Add to Constants** (`src/lib/theme/constants.ts`):

   ```ts
   export const BARQ_COLORS = {
     // ... existing colors
     green: "#00ff00",
   } as const;
   ```

3. **Add TypeScript Types** (`src/lib/theme/types.ts`):

   ```ts
   export type BarqColorName =
     | "black"
     | "white"
     | "light-blue"
     | "yellow"
     | "green";
   ```

4. **Use in Components**:
   ```tsx
   <div className="bg-barq-green text-white">New green brand color</div>
   ```

**Note**: With Tailwind CSS 4, colors are defined directly in the `@theme` block in `globals.css`. No separate `tailwind.config.ts` file is needed. The `@theme` directive automatically generates Tailwind utility classes like `bg-barq-green`, `text-barq-green`, etc.

---

## Troubleshooting

### Colors Not Showing

**Problem**: Tailwind utilities don't apply colors.

**Solution**:

1. Ensure the color is defined in `tailwind.config.ts`
2. Restart the dev server after config changes
3. Check that CSS variables are defined in `globals.css`

### Dark Mode Not Working

**Problem**: Colors don't change in dark mode.

**Solution**:

1. Use semantic tokens: `bg-background` instead of `bg-white`
2. Ensure `darkMode: "class"` in `tailwind.config.ts`
3. Check `ThemeProvider` is wrapping your app in `layout.tsx`

### TypeScript Errors

**Problem**: Type errors when using theme utilities.

**Solution**:

1. Import types from `@/lib/theme`
2. Ensure constants match TypeScript types
3. Rebuild TypeScript with `npm run type-check`

### Opacity Not Working

**Problem**: Opacity modifiers (`/10`, `/50`) don't work.

**Solution**:

1. Ensure using Tailwind 4 syntax
2. Check color is defined as CSS variable
3. Use format: `bg-barq-yellow/10` not `bg-barq-yellow-10`

---

## Reference

### Import Paths

```tsx
// Everything you need
import {
  // Types
  type BarqColorName,
  type ThemeMode,

  // Constants
  BARQ_COLORS,
  BRAND_CLASSES,

  // Utilities
  getBarqColor,
  buildBrandClass,
  isDarkMode,

  // Tokens
  colorTokens,
  designTokens,
} from "@/lib/theme";
```

### Theme Object

```tsx
import { theme } from "@/lib/theme";

// Access all theme values
theme.colors.barq.yellow; // "#ffda00"
theme.spacing.md; // "1.5rem"
theme.shadows.lg; // "0 8px 32px..."
theme.radius.md; // "8px"
theme.fonts.barq; // "Graphik, ..."
```

---

## Resources

- [Tailwind CSS 4 Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Theming Guide](https://ui.shadcn.com/docs/theming)
- [Next.js Theme Documentation](https://nextjs.org/docs/app/building-your-application/styling/css-variables)
- [OKLCH Color Space](https://oklch.com/)

---

## Summary

The theme system provides a **production-grade**, **type-safe**, and **maintainable** approach to styling:

✅ **Single source of truth** - All colors in one place
✅ **Type safety** - TypeScript catches errors at compile time
✅ **DRY** - No duplicate definitions
✅ **SOLID** - Clear separation of concerns
✅ **Semantic** - Meaningful color names
✅ **Accessible** - Proper contrast with foreground pairs
✅ **Maintainable** - Easy to update and extend

Follow the patterns in this guide to ensure consistency and maintainability across the entire application.
