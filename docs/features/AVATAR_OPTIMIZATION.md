# Avatar Optimization System

User avatar management with automatic image optimization, WebP conversion, and Next.js Image integration.

## Overview

The avatar system provides:
- Automatic multi-size variant generation (32, 64, 128, 256px)
- WebP conversion at 85% quality (60%+ smaller than JPEG)
- EXIF auto-orientation
- Next.js Image optimization with responsive sizing
- SSO avatar support (Microsoft Graph)
- Reusable UserAvatar component with deterministic fallback colors

**Storage**: `/public/uploads/avatars/{userId}/{size}.webp`

## Architecture

### Service Layer

**Interface**: `src/core/services/image-optimization.service.interface.ts`

```typescript
export interface IImageOptimizationService {
  optimizeAvatar(
    buffer: Buffer,
    userId: string,
    originalFileName: string,
  ): Promise<AvatarOptimizationResult>;

  deleteAvatarVariants(userId: string): Promise<void>;
}

export interface AvatarOptimizationResult {
  variants: {
    original: string;
    32: string;
    64: string;
    128: string;
    256: string;
  };
  metadata: {
    uploadedAt: string;
    originalFileName: string;
    originalMimeType: string;
    originalSizeBytes: number;
  };
}
```

**Implementation**: `src/infrastructure/services/image-optimization.service.ts`
- Uses Sharp library for server-side image processing
- Generates 4 size variants on upload
- Stores original for future reprocessing
- Saves metadata.json alongside images

**DI Registration**: `src/di/modules/file-storage.module.ts`

```typescript
container
  .bind<IImageOptimizationService>(DI_TOKENS.IImageOptimizationService)
  .to(ImageOptimizationService)
  .inSingletonScope();
```

### Storage Structure

```
/public/uploads/avatars/
  {userId}/
    ├── original.{ext}     # Preserved for future reprocessing
    ├── 32.webp           # Tiny (tables, dropdowns)
    ├── 64.webp           # Small (cards)
    ├── 128.webp          # Medium (default)
    ├── 256.webp          # Large (profile page)
    └── metadata.json     # Upload metadata
```

**Database**: `User.image` stores default 128px variant URL

## UserAvatar Component

Reusable avatar component with automatic optimization and fallback handling.

**Location**: `src/components/shared/user-avatar.tsx`

### Basic Usage

```tsx
import { UserAvatar } from "@/components/shared/user-avatar";

// With user object
<UserAvatar user={user} size="md" />

// With individual props
<UserAvatar
  name="John Doe"
  email="john@example.com"
  image="/uploads/avatars/user123/128.webp"
  size="lg"
/>

// SSO user (external image)
<UserAvatar
  name="Jane Smith"
  image="https://graph.microsoft.com/v1.0/users/jane@company.com/photo/$value"
  size="sm"
/>

// Fallback only (no image)
<UserAvatar name="John Doe" email="john@example.com" />
```

### Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `user` | `{ name?, email?, image? }` | `undefined` | User object (takes precedence) |
| `name` | `string` | `undefined` | User's display name |
| `email` | `string` | `undefined` | User's email (fallback for initials) |
| `image` | `string` | `undefined` | Avatar image URL |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Size variant |
| `className` | `string` | `undefined` | Additional CSS classes |
| `showTooltip` | `boolean` | `false` | Show tooltip on hover |
| `priority` | `boolean` | `false` | Next.js Image priority loading |

### Size Variants

| Size | Pixels | Use Cases |
|------|--------|-----------|
| `xs` | 24px | Very small icons |
| `sm` | 32px | Tables, dropdowns, compact lists |
| `md` | 48px | Cards, widgets (default) |
| `lg` | 64px | Profile headers, detail pages |
| `xl` | 128px | Full profile view, settings |

### Features

**Smart URL Rewriting**:
```typescript
// Input:  /uploads/avatars/user123/128.webp + size="sm"
// Output: /uploads/avatars/user123/32.webp

// SSO images passed through unchanged
// Input:  https://graph.microsoft.com/... + size="sm"
// Output: https://graph.microsoft.com/... (no change)
```

**Deterministic Fallback Colors**:
- Same name → same color (hash-based)
- 10 color variants (red, blue, green, yellow, purple, pink, indigo, teal, orange, cyan)
- Theme-aware (light/dark mode)

**Initials Generation**:
```typescript
"John Doe" → "JD"
"Alice" → "A"
"John Robert Doe" → "JR" (first 2 words)
"john@example.com" → "J" (email fallback)
```

## Upload Integration

Avatar upload is handled in `src/interface-adapters/controllers/my-dashboard.controller.ts`:

```typescript
// In uploadProfilePhotoAction
const optimizationService = container.get<IImageOptimizationService>(
  DI_TOKENS.IImageOptimizationService,
);

// Delete old variants
await optimizationService.deleteAvatarVariants(userId);

// Generate new variants
const result = await optimizationService.optimizeAvatar(
  buffer,
  userId,
  file.name,
);

// Store 128px variant as default
const imageUrl = result.variants[128];
await prisma.user.update({
  where: { id: userId },
  data: { image: imageUrl },
});
```

**Validation**:
- Max file size: 5MB
- Allowed formats: JPEG, PNG, WebP
- Magic number validation (not just extension)

## Next.js Configuration

**Image Optimization** (`next.config.ts`):

```typescript
images: {
  // Allow local avatar optimization
  localPatterns: [
    { pathname: "/uploads/avatars/**" }
  ],

  // SSO providers (Microsoft Graph)
  remotePatterns: [
    {
      protocol: "https",
      hostname: "graph.microsoft.com",
      pathname: "/v1.0/users/*/photo/$value",
    },
    {
      protocol: "https",
      hostname: "**.blob.core.windows.net", // Azure Storage fallback
    }
  ],

  // Optimization settings
  formats: ["image/avif", "image/webp"],
  deviceSizes: [32, 64, 128, 256, 384, 640, 750, 828, 1080, 1200],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

**CSP Headers**:

```typescript
"img-src 'self' data: https: blob: https://graph.microsoft.com https://*.blob.core.windows.net"
```

## Migration Examples

### Before (Manual Avatar)

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }
  return email?.[0]?.toUpperCase() || "U";
}

const initials = getInitials(user.name, user.email);

<Avatar className="h-8 w-8">
  <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
  <AvatarFallback>{initials}</AvatarFallback>
</Avatar>
```

### After (UserAvatar Component)

```tsx
import { UserAvatar } from "@/components/shared/user-avatar";

<UserAvatar user={user} size="sm" />
```

## Backwards Compatibility

**Existing Avatars**:
- Old format: `/uploads/{year}/{month}/{cuid}.{ext}` - still works (Next.js optimizes on-demand)
- New format: `/uploads/avatars/{userId}/128.webp` - uses pre-generated variants
- SSO format: `https://graph.microsoft.com/...` - passed through unchanged

**Migration Strategy**:
- Lazy migration: Optimize on next upload only
- No breaking changes to existing URLs
- Optional batch script: `scripts/users/optimize-existing-avatars.ts` (future)

## Performance

**Optimization Metrics**:
- Upload time: < 3s for 5MB image
- Variant generation: < 2s for all 4 sizes
- 128px variant size: < 10KB (WebP)
- File size reduction: 60%+ vs original JPEG

**Why Pre-generate Instead of Runtime?**
- ✅ Predictable performance (no first-request delay)
- ✅ Lower server load during traffic spikes
- ✅ Works without Next.js server (static export compatible)
- ✅ Original preserved for future formats (AVIF, JPEG XL)

## Security

**Existing Protections** (maintained):
- Magic number validation via `Attachment.validateFileContent`
- MIME type whitelist (JPEG, PNG, WebP)
- File size limit (5MB)
- Path traversal prevention
- SSO users blocked from custom uploads

**New Security Features**:
- EXIF metadata stripped (privacy)
- Sharp re-encodes images (removes malicious payloads)
- Isolated storage (`/uploads/avatars/` separate from code)
- CSP headers prevent JavaScript execution from `/uploads/`

## Testing

**Unit Tests**:
- `tests/unit/image-optimization.test.ts` (17 tests)
  - Variant generation, format conversion, metadata, error handling, cleanup
- `src/components/shared/__tests__/user-avatar.test.tsx` (37 tests)
  - Size variants, initials, images, SSO, deterministic colors, accessibility

**Manual Testing Checklist**:
- [ ] Upload new avatar (JPEG, PNG, WebP)
- [ ] Verify 4 variants generated in `/public/uploads/avatars/{userId}/`
- [ ] Check variants load correctly at different sizes
- [ ] Test SSO avatar (Microsoft user)
- [ ] Test fallback initials (no avatar)
- [ ] Test avatar update (old variants deleted)
- [ ] Inspect Network tab: verify `.webp` extensions
- [ ] Verify 128px variant < 10KB

## Troubleshooting

### Images not displaying

**Check Next.js configuration**:
- Verify `localPatterns` includes `/uploads/avatars/**`
- For SSO, verify `remotePatterns` includes Microsoft Graph

**Check file permissions**:
```bash
ls -la public/uploads/avatars/{userId}/
# Should show 4 .webp files + original + metadata.json
```

### Old variants not deleted

**Check logs**:
```typescript
// ImageOptimizationService logs deletion
logger.debug(`Deleted avatar variants for user ${userId}`, { path });
```

**Manual cleanup**:
```bash
rm -rf public/uploads/avatars/{userId}/
```

### Performance issues

**Sharp not installed**:
```bash
npm install sharp
```

**Large images timing out**:
- Increase `serverActions.bodySizeLimit` in `next.config.ts`
- Currently set to 10MB

## Future Enhancements

Out of scope for current implementation:
- Avatar cropping UI (react-easy-crop)
- Webcam capture
- Avatar templates/defaults
- AI-generated avatars
- CDN integration (Cloudflare Images, Vercel Blob)
- Animated avatar support (GIF, WebP animation)
- Batch migration script for existing avatars

## Related Documentation

- [UI Components Guide](../guides/UI_COMPONENTS.md) - General component patterns
- [File Storage](../../src/infrastructure/services/local-file-storage.service.ts) - File system operations
- [Next.js 16 Guide](../guides/NEXTJS_16_GUIDE.md) - Next.js Image optimization
- [Developer Guide](../guides/DEVELOPER_GUIDE.md) - Adding new features
