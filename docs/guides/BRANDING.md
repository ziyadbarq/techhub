# Barq Branding Assets

Complete guide to barq branding in the boilerplate.

## Logo Files

### Location

All logo files are stored in [`public/logos/`](public/logos/):

```
public/logos/
├── logo-black.svg    # Black logo for light backgrounds
├── logo-white.svg    # White logo for dark backgrounds
└── README.md         # Detailed usage guide
```

### Files

- **`logo-black.svg`** (2.5 KB) - Official barq logo in black
  - Use on light backgrounds
  - Use in light mode

- **`logo-white.svg`** (2.5 KB) - Official barq logo in white
  - Use on dark backgrounds
  - Use in dark mode

### Source

Downloaded from official barq website:

- Original: https://barq.com/wp-content/uploads/logo-black-barq-no-margins1.svg
- White version: Modified with `fill="white"`

## Logo Component

### Reusable React Component

A ready-to-use Logo component is provided at [`src/components/ui/logo.tsx`](src/components/ui/logo.tsx):

```tsx
import { Logo } from "@/components/ui/logo";

export function Header() {
  return (
    <header>
      <Logo width={120} height={40} priority />
    </header>
  );
}
```

### Features

✅ **Automatic dark mode** - Switches between black/white based on theme
✅ **Fallback support** - Falls back to external URL if local file fails
✅ **Next.js Image optimization** - Automatic optimization and lazy loading
✅ **Type-safe props** - Full TypeScript support
✅ **SSR compatible** - No hydration mismatches

### Props

| Prop          | Type      | Default     | Description                         |
| ------------- | --------- | ----------- | ----------------------------------- |
| `className`   | `string`  | `undefined` | CSS class for container             |
| `width`       | `number`  | `120`       | Logo width in pixels                |
| `height`      | `number`  | `40`        | Logo height in pixels               |
| `priority`    | `boolean` | `false`     | Prioritize loading (above-the-fold) |
| `useFallback` | `boolean` | `true`      | Use external URL on error           |

### Usage Examples

#### Basic Logo

```tsx
import { Logo } from "@/components/ui/logo";

<Logo />;
```

#### Custom Size

```tsx
<Logo width={200} height={60} />
```

#### Priority Loading (Above-the-fold)

```tsx
<Logo priority />
```

#### Custom Styling

```tsx
<Logo className="opacity-80 transition-opacity hover:opacity-100" />
```

#### Simple Variants (No Dark Mode)

```tsx
import { SimpleLogoBlack, SimpleLogoWhite } from "@/components/ui/logo";

// Always black
<SimpleLogoBlack width={120} height={40} />

// Always white
<SimpleLogoWhite width={120} height={40} />
```

## Direct Usage (Without Component)

### With Next.js Image

```tsx
import Image from "next/image";

export function Logo() {
  return (
    <Image
      src="/logos/logo-black.svg"
      alt="barq logo"
      width={120}
      height={40}
      priority
    />
  );
}
```

### Manual Dark Mode

```tsx
import Image from "next/image";

<div className="relative">
  <Image
    src="/logos/logo-black.svg"
    alt="barq logo"
    width={120}
    height={40}
    className="dark:hidden"
  />
  <Image
    src="/logos/logo-white.svg"
    alt="barq logo"
    width={120}
    height={40}
    className="hidden dark:block"
  />
</div>;
```

### Plain HTML (Not Recommended)

```html
<img src="/logos/logo-black.svg" alt="barq logo" width="120" height="40" />
```

**Note**: Using Next.js `<Image>` component is strongly recommended for:

- Automatic optimization
- Lazy loading
- Responsive images
- WebP conversion

## Brand Colors

The boilerplate includes barq brand colors in the theme system:

```tsx
import { BARQ_COLORS } from "@/lib/theme/constants";

// Available colors (OKLCH format):
BARQ_COLORS.yellow; // oklch(0.95 0.15 100)
BARQ_COLORS.black; // oklch(0.1 0 0)
BARQ_COLORS.blue; // oklch(0.5 0.2 250)
BARQ_COLORS.lightBlue; // oklch(0.8 0.1 240)
BARQ_COLORS.purple; // oklch(0.6 0.2 300)
BARQ_COLORS.orange; // oklch(0.7 0.2 50)
```

### Tailwind Classes

All brand colors are available as Tailwind utilities:

```tsx
// Backgrounds
<div className="bg-barq-yellow">
<div className="bg-barq-blue">
<div className="bg-barq-purple">

// Text
<span className="text-barq-yellow">
<span className="text-barq-light-blue">

// Borders
<div className="border border-barq-yellow">

// With opacity
<div className="bg-barq-yellow/10">
<div className="bg-barq-blue/50">
```

See [`docs/THEME_SYSTEM.md`](docs/THEME_SYSTEM.md) for complete theme documentation.

## Integration Examples

### Landing Page Header

The landing page ([`src/app/page.tsx`](src/app/page.tsx)) uses the logo:

```tsx
<div className="mb-16 text-center">
  <div className="mb-8 flex justify-center">
    <Logo width={200} height={60} priority />
  </div>
  <h1 className="text-5xl font-bold">Barq App Boilerplate</h1>
</div>
```

### Navigation Header

```tsx
export function Header() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Logo width={100} height={32} />
          <span className="font-bold">My App</span>
        </Link>
      </div>
    </header>
  );
}
```

### Footer

```tsx
export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container flex flex-col items-center gap-4">
        <Logo width={120} height={40} />
        <p className="text-muted-foreground text-sm">
          © 2025 barq. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
```

### Authentication Pages

```tsx
export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo width={160} height={48} priority />
        </div>
        <h2 className="text-center text-2xl font-bold">
          Sign in to your account
        </h2>
        {/* Login form */}
      </div>
    </div>
  );
}
```

## Customization

### Modify Logo Colors

Both SVG files can be edited:

1. Open `public/logos/logo-black.svg` or `logo-white.svg` in a text editor
2. Find `fill="black"` or `fill="white"`
3. Replace with your color: `fill="#FFDA00"` (barq yellow)
4. Save and reload

### Create Additional Variants

```bash
# Copy existing logo
cp public/logos/logo-black.svg public/logos/logo-yellow.svg

# Edit logo-yellow.svg
# Change fill="black" to fill="#FFDA00"
```

Then use in components:

```tsx
<Image src="/logos/logo-yellow.svg" alt="barq logo" width={120} height={40} />
```

## Best Practices

### ✅ DO

- Use the `<Logo>` component for automatic dark mode
- Set `priority` for above-the-fold logos
- Use appropriate sizes (120x40 for nav, 200x60 for headers)
- Use Next.js `<Image>` component
- Keep aspect ratio consistent

### ❌ DON'T

- Use plain `<img>` tags (lose Next.js optimization)
- Hardcode logo in multiple places (use component)
- Inline SVG content (use file references)
- Forget `alt` text for accessibility

## Accessibility

Always include proper alt text:

```tsx
// Good
<Logo />  // Default: "barq logo"
<Image src="/logos/logo-black.svg" alt="barq logo" />

// Bad
<Image src="/logos/logo-black.svg" alt="" />  // Missing description
```

## License

Check with [barq.com](https://barq.com) for official licensing terms for logo usage.

## Additional Resources

- **Logo Component**: [`src/components/ui/logo.tsx`](src/components/ui/logo.tsx)
- **Logo Files**: [`public/logos/`](public/logos/)
- **Theme System**: [`docs/THEME_SYSTEM.md`](docs/THEME_SYSTEM.md)
- **Brand Colors**: [`src/lib/theme/constants.ts`](src/lib/theme/constants.ts)

---

**Questions?** See [`public/logos/README.md`](public/logos/README.md) for more usage examples.
