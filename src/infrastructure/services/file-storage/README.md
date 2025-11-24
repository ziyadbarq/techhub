# File Storage Infrastructure

This directory contains the enhanced file storage service implementation for secure file system operations.

## Overview

The file storage infrastructure layer provides:

- **FileStorageService**: Secure file system operations with validation and error handling
- **Markdown utilities**: Validation and frontmatter manipulation for markdown files
- **Security features**: Path traversal protection, content validation, size limits
- **Binary file support**: Handle both text and binary files

## Architecture

**Clean Architecture Pattern:**

- **Interface** (core layer): `src/core/services/file-storage.service.interface.ts`
- **Implementation** (infrastructure layer): `src/infrastructure/services/file-storage/file-storage.service.ts`
- **Utilities**: `src/infrastructure/services/file-storage/markdown-file.handler.ts`
- **DI Registration**: `src/di/modules/ai-services.module.ts`

## Components

### FileStorageService

The main service implementing `IFileStorageService` interface. Handles all file system operations with security and validation.

**Features:**

- ✅ **Path Validation**: Prevents directory traversal attacks
- ✅ **Content Validation**: Null byte detection, UTF-8 validation
- ✅ **Size Limits**: 10MB maximum file size
- ✅ **Binary Support**: Handle both text (string) and binary (Buffer) files
- ✅ **Error Handling**: Descriptive errors with context
- ✅ **Safe Paths**: All paths resolved relative to project root

**Usage:**

```typescript
import { container } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IFileStorageService } from "@/core/services";

// Resolve from DI container
const fileStorage = container.get<IFileStorageService>(
  DI_TOKENS.IFileStorageService,
);

// Write text file
await fileStorage.writeFile(".ai-debug/prompt.txt", "System prompt content");

// Write binary file
const imageBuffer = await fetchImage();
await fileStorage.writeFile("uploads/logo.png", imageBuffer);

// Read text file
const content = await fileStorage.readFile(".ai-debug/prompt.txt");

// Read binary file
const buffer = await fileStorage.readFile("uploads/logo.png", "binary");

// Check if file exists
if (await fileStorage.fileExists(".ai-debug/session.json")) {
  const session = await fileStorage.readFile(".ai-debug/session.json");
}

// Get file size
const size = await fileStorage.getFileSize(".ai-debug/trace.json");
console.log(`File size: ${size} bytes`);

// Validate path before use
if (!fileStorage.validatePath(userProvidedPath)) {
  throw new Error("Invalid path: security violation detected");
}

// Delete file
await fileStorage.deleteFile(".ai-debug/old-trace.json");
```

### Markdown File Handler

Utility functions for markdown validation and frontmatter manipulation.

**Functions:**

- `validateMarkdown(content: string): boolean` - Validates markdown content
- `extractFrontmatter(content: string): Frontmatter` - Parses YAML frontmatter
- `updateFrontmatter(content: string, updates: Record<string, any>): string` - Updates frontmatter
- `extractBody(content: string): string` - Gets body without frontmatter
- `hasFrontmatter(content: string): boolean` - Checks for frontmatter
- `removeFrontmatter(content: string): string` - Removes frontmatter
- `addFrontmatter(content: string, frontmatter: Record<string, any>): string` - Adds frontmatter

**Usage:**

```typescript
import {
  validateMarkdown,
  extractFrontmatter,
  updateFrontmatter,
  addFrontmatter,
} from "@/infrastructure/services/file-storage";

// Validate markdown
const isValid = validateMarkdown("# Title\n\nContent");
if (!isValid) {
  throw new Error("Invalid markdown content");
}

// Extract frontmatter
const content = `---
title: My Document
author: Name
tags: [ai, markdown]
---

# Slide 1`;

const frontmatter = extractFrontmatter(content);
// { title: 'My Document', author: 'Name', tags: ['ai', 'markdown'] }

// Update frontmatter
const updated = updateFrontmatter(content, {
  layout: "cover",
  theme: "default",
});

// Add frontmatter to content without it
const withFrontmatter = addFrontmatter("# Content", {
  title: "My Doc",
  author: "AI",
});
```

## Implementation Details

### File Encoding

- **Text files**: UTF-8 encoding
- **Binary files**: Raw binary (Buffer)

### Validation

**Path validation checks:**

- Empty paths (rejected)
- Absolute paths (rejected - must be relative)
- Path traversal attempts (`../` patterns)
- Null bytes and control characters
- Path escapes project root boundary

**Content validation checks:**

- Non-empty content
- Maximum size: 10MB
- No null bytes (`\x00`)
- Valid UTF-8 encoding (for text)
- No invalid control characters

### Error Handling

All methods throw descriptive errors:

```typescript
// Invalid path
Error: "Invalid file path: ../../../etc/passwd";

// File doesn't exist
Error: "File does not exist: missing.txt";

// Content exceeds size
Error: "File exceeds maximum size limit (10485760 bytes)";

// Write/read failure
Error: "Failed to write file: EACCES: permission denied";
```

### Security Considerations

1. **Path Traversal Protection**: All paths validated to prevent escaping project root
2. **File Size Limits**: 10MB maximum to prevent DoS attacks
3. **Null Byte Detection**: Rejected to prevent injection attacks
4. **UTF-8 Enforcement**: Text files validated for proper encoding
5. **Relative Paths Only**: Absolute paths rejected

### Performance

- **Async I/O**: All operations use `fs/promises` for non-blocking I/O
- **Efficient Validation**: Fast regex-based checks
- **Singleton Service**: Shared instance reduces memory overhead
- **Buffer Support**: Native binary handling without encoding overhead

## Dependency Injection

The service is registered in the DI container:

```typescript
// src/di/modules/ai-services.module.ts
container
  .bind<IFileStorageService>(DI_TOKENS.IFileStorageService)
  .to(FileStorageService)
  .inSingletonScope();
```

**Lifecycle**: Singleton (shared instance)

**Dependencies**: None (uses Node.js `fs/promises` directly)

## API Reference

### IFileStorageService Methods

#### `writeFile(filePath: string, content: string | Buffer): Promise<void>`

Writes content to a file. Creates parent directories if needed.

- **Throws**: If path invalid, content exceeds size limit, or write fails

#### `readFile(filePath: string, encoding?: 'utf-8'): Promise<string>`

#### `readFile(filePath: string, encoding: 'binary'): Promise<Buffer>`

Reads content from a file with specified encoding.

- **Default encoding**: 'utf-8'
- **Throws**: If file doesn't exist or read fails

#### `deleteFile(filePath: string): Promise<void>`

Deletes a file.

- **Throws**: If file doesn't exist or deletion fails

#### `ensureDir(dirPath: string): Promise<void>`

Ensures a directory exists, creating it if necessary.

- **Recursive**: Creates all parent directories
- **Throws**: If directory creation fails

#### `fileExists(filePath: string): Promise<boolean>`

Checks if a file or directory exists.

#### `getFileSize(filePath: string): Promise<number>`

Gets the size of a file in bytes.

- **Throws**: If file doesn't exist

#### `validatePath(filePath: string): boolean`

Validates a file path for security and correctness.

- **Checks**: Traversal attempts, absolute paths, invalid characters, root boundary

#### `validateContent(content: string): boolean`

Validates text content for safety.

- **Checks**: Size limits, null bytes, UTF-8 validity

## Testing

Create test files in `__tests__/` directory:

```bash
# Run file storage tests
npm test src/infrastructure/services/file-storage/__tests__

# Example test structure
src/infrastructure/services/file-storage/
├── __tests__/
│   ├── file-storage.service.test.ts
│   └── markdown-file.handler.test.ts
```

**Test coverage should include:**

- Path validation (traversal attacks, absolute paths, boundary tests)
- Content validation (size limits, null bytes, encoding)
- File operations (read, write, delete)
- Binary file handling
- Error cases (non-existent files, permission errors)
- Markdown utilities (frontmatter parsing, validation)

## Examples

### AI Debug Artifacts

```typescript
const debugService = container.get<IAIDebugTraceService>(
  DI_TOKENS.IAIDebugTraceService,
);

// Service internally uses file storage
await debugService.writeArtifacts(); // Creates .ai-debug/* files
```

### Markdown Content Generation

```typescript
import {
  validateMarkdown,
  addFrontmatter,
} from "@/infrastructure/services/file-storage";

// Generate markdown with frontmatter
let markdown = "# My Presentation\n\nSlide content here";

if (!validateMarkdown(markdown)) {
  throw new Error("Invalid markdown generated");
}

markdown = addFrontmatter(markdown, {
  title: "AI Generated Presentation",
  theme: "default",
  author: "GPT-5",
  date: new Date().toISOString(),
});

await fileStorage.writeFile("presentations/slides.md", markdown);
```

### Binary Asset Management

```typescript
// Save uploaded image
const uploadedImage: Buffer = await request.file.buffer;
await fileStorage.writeFile("uploads/user-avatar.png", uploadedImage);

// Read and serve image
const imageBuffer = await fileStorage.readFile(
  "uploads/user-avatar.png",
  "binary",
);
response.setHeader("Content-Type", "image/png");
response.send(imageBuffer);
```

## Migration from Old API

**Old API (deprecated):**

```typescript
await fileStorage.writeMarkdown(contextId, filePath, content);
const content = await fileStorage.readMarkdown(contextId, filePath);
```

**New API:**

```typescript
await fileStorage.writeFile(filePath, content);
const content = await fileStorage.readFile(filePath);
```

**Changes:**

- ❌ Removed `contextId` parameter (was unused)
- ✅ Added binary file support
- ✅ Added validation methods
- ✅ Added `getFileSize()` utility

## Troubleshooting

### Permission Errors

If you encounter `EACCES` errors:

```bash
# Check directory permissions
ls -la .ai-debug

# Fix permissions (Unix/Mac)
chmod -R 755 .ai-debug

# Fix ownership (Unix/Mac)
chown -R $USER:$USER .ai-debug
```

### Path Validation Failures

Always use relative paths:

```typescript
// ❌ Bad - absolute path
await fileStorage.writeFile("/etc/hosts", content);

// ✅ Good - relative path
await fileStorage.writeFile(".ai-debug/trace.json", content);
```

### Large File Issues

For files exceeding 10MB:

- Split into multiple smaller files
- Use streaming (future enhancement)
- Store in external storage (S3, etc.)
- Compress content before writing

### Cross-Platform Path Issues

Always use `path.join()` for path construction:

```typescript
import path from "path";

// ❌ Bad - platform-specific
const filePath = `.ai-debug/${category}/prompt.txt`;

// ✅ Good - cross-platform
const filePath = path.join(".ai-debug", category, "prompt.txt");
```

## Future Enhancements

Potential improvements:

1. **Cloud Storage Providers**: Abstract interface to support S3/GCS/Azure Blob
2. **Streaming Support**: Handle large files with streams
3. **Compression**: Gzip compression for large text files
4. **Caching**: In-memory cache for frequently accessed files
5. **File Watching**: Monitor file changes
6. **Transactions**: Rollback support for batch operations
7. **Metadata**: Track file modified time, permissions, etc.
8. **Directory Listing**: List files in a directory
9. **Copy/Move**: File management utilities

## Related Documentation

- [IFileStorageService Interface](../../../core/services/file-storage.service.interface.ts)
- [Dependency Injection Setup](../../../di/modules/ai-services.module.ts)
- [AI Debug Trace Service](../ai/debug-trace.service.ts)

## Contributing

When modifying this service:

1. ✅ Update interface if adding new methods
2. ✅ Add comprehensive validation
3. ✅ Add security checks
4. ✅ Write tests for new functionality
5. ✅ Update this README
6. ✅ Ensure cross-platform compatibility
7. ✅ Handle all error cases
8. ✅ Add JSDoc comments

## References

- **Inspired by**: slidev-ai-rag-task-manager file storage implementation
- **Security**: OWASP File Upload Guidelines
- **Best Practices**: Node.js fs/promises patterns
