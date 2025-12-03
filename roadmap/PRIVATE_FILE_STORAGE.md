# Private File Storage & Authenticated Downloads

## Overview

Move file uploads from `/public/uploads/` to private storage and implement authenticated download endpoint to prevent unauthorized access to sensitive documents.

## Current State

- Files stored in `public/uploads/{year}/{month}/{cuid}.{ext}`
- Directly accessible via URL without authentication
- CUID-based names provide security through obscurity (2^128 keyspace)
- Risk: Leaked URLs (emails, logs, browser history) expose sensitive documents

## Proposed Solution

### 1. Move Storage Location

**Change**: `src/infrastructure/services/local-file-storage.service.ts`

```typescript
// Before
private readonly uploadsDir = "public/uploads";

// After
private readonly uploadsDir = "private/uploads";
```

**Impact**: Files no longer served directly by Next.js public folder

### 2. Create Authenticated Download Endpoint

**New file**: `src/app/api/files/[id]/download/route.ts`

```typescript
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Permission check
  await requirePermission(PERMISSIONS.ATTACHMENTS_VIEW);

  // Fetch attachment metadata
  const attachment = await getAttachment(id);
  if (!attachment) return new Response('Not found', { status: 404 });

  // Read file from private storage
  const fileBuffer = await fs.readFile(attachment.storagePath);

  // Return with secure headers
  return new Response(fileBuffer, {
    headers: {
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
      'Content-Length': attachment.sizeBytes.toString(),
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
```

### 3. Update File Serving Components

**Files to update**:
- All components that render file download links
- Search for: `href={`/uploads/` patterns
- Replace with: `href={`/api/files/${attachment.id}/download`}`

**Example**:
```typescript
// Before
<a href={`/uploads/2025/12/abc123.pdf`}>Download</a>

// After
<a href={`/api/files/${attachment.id}/download`}>Download</a>
```

## Implementation Steps

1. **Phase 1**: Create download API endpoint
   - Implement `/api/files/[id]/download/route.ts`
   - Add permission checks
   - Add rate limiting

2. **Phase 2**: Update storage service
   - Change `uploadsDir` path
   - Test upload still works

3. **Phase 3**: Update components
   - Find all file link components
   - Replace direct URLs with API endpoint
   - Test downloads work with authentication

4. **Phase 4**: Migration
   - Move existing files from `public/uploads/` to `private/uploads/`
   - Script: `scripts/files/migrate-to-private-storage.ts`

5. **Phase 5**: Testing
   - Test authenticated downloads
   - Test permission enforcement (different roles)
   - Test rate limiting

## Benefits

- **Security**: Files require authentication to access
- **Audit trail**: Log all file downloads
- **Flexibility**: Easy to add time-limited signed URLs later
- **Compliance**: Meets data protection requirements

## Considerations

- **Performance**: API route adds small latency (~50-100ms)
- **Caching**: Can add caching headers for frequently accessed files
- **CDN**: For public files, can still use public folder selectively
