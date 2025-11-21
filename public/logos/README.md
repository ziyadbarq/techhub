# Barq Logos

Official barq branding assets for the Barq Assets.

## Files

- `logo-black.svg` - Official barq logo (black) for light backgrounds
- `logo-white.svg` - Official barq logo (white) for dark backgrounds

## Source

Downloaded from the official barq website:

- **Original**: https://barq.com/wp-content/uploads/logo-black-barq-no-margins1.svg
- **White version**: Modified from original with `fill="white"`

## Usage in Next.js

### Static Image Import

```tsx
import Image from "next/image";
import logoBlack from "@/public/logos/logo-black.svg";
import logoWhite from "@/public/logos/logo-white.svg";

export function Logo() {
  return (
    <Image src={logoBlack} alt="barq logo" width={120} height={40} priority />
  );
}
```

### Public Path (Recommended)

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

### Dark Mode Support

```tsx
import Image from "next/image";
import { useTheme } from "next-themes";

export function Logo() {
  const { theme } = useTheme();

  return (
    <Image
      src={theme === "dark" ? "/logos/logo-white.svg" : "/logos/logo-black.svg"}
      alt="barq logo"
      width={120}
      height={40}
      priority
    />
  );
}
```

### With Theme System

```tsx
import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  const { theme } = useTheme();

  return (
    <div className={cn("relative", className)}>
      <Image
        src="/logos/logo-black.svg"
        alt="barq logo"
        width={120}
        height={40}
        className="dark:hidden"
        priority
      />
      <Image
        src="/logos/logo-white.svg"
        alt="barq logo"
        width={120}
        height={40}
        className="hidden dark:block"
        priority
      />
    </div>
  );
}
```

### With Fallback (External URL)

```tsx
"use client";

import Image from "next/image";
import { useState } from "react";

export function Logo() {
  const [error, setError] = useState(false);

  return (
    <Image
      src={
        error
          ? "https://barq.com/wp-content/uploads/logo-black-barq-no-margins1.svg"
          : "/logos/logo-black.svg"
      }
      alt="barq logo"
      width={120}
      height={40}
      onError={() => setError(true)}
      priority
    />
  );
}
```

## Benefits

1. ✅ **Faster loading** - Local files served from your domain
2. ✅ **Offline support** - Works without internet connection
3. ✅ **Type safety** - Next.js Image optimization
4. ✅ **Automatic fallback** - Can fall back to external URL if needed
5. ✅ **Dark mode ready** - Both black and white variants included

## File Locations

- **Next.js Public Directory**: `/public/logos/`
- **Accessible at**: `/logos/logo-black.svg` and `/logos/logo-white.svg`

## Customization

These SVG files can be customized for your brand:

1. Open in a text editor or vector graphics software (Figma, Illustrator, etc.)
2. Modify colors, sizes, or paths as needed
3. Keep the same filename or update imports across your app

## License

Check with barq.com for official licensing terms for logo usage.
