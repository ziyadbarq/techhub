#!/usr/bin/env tsx
/**
 * Fix Routes Manifest Permissions
 *
 * Extracts correct permission constant names from old protected-routes.ts
 * and applies them to routes-manifest.ts
 *
 * Usage:
 *   npx tsx scripts/fix-manifest-permissions.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface PermissionMapping {
  path: string;
  permissions: string[];
  allPermissions?: string[];
  roles?: string[];
}

/**
 * Extract permission constant name from PERMISSIONS.X syntax
 * e.g., "PERMISSIONS['roles:create']" → "roles:create"
 * e.g., "PERMISSIONS.roles:create" → "roles:create"
 */
function extractPermissionValue(permStr: string): string {
  // Handle PERMISSIONS['key'] or PERMISSIONS["key"]
  const bracketMatch = permStr.match(/PERMISSIONS\[['"]([^'"]+)['"]\]/);
  if (bracketMatch) {
    return bracketMatch[1];
  }

  // Handle PERMISSIONS.key
  const dotMatch = permStr.match(/PERMISSIONS\.([^\s,\]]+)/);
  if (dotMatch) {
    return dotMatch[1];
  }

  return permStr.trim();
}

/**
 * Convert permission value to constant name
 * e.g., "dashboard:view" → "DASHBOARD_VIEW"
 * e.g., "roles:create" → "ROLES_CREATE"
 */
function valueToConstantName(value: string): string {
  return value.replace(/:/g, "_").replace(/-/g, "_").toUpperCase();
}

/**
 * Parse old protected-routes.ts to extract permission mappings
 */
function parseOldProtectedRoutes(
  filePath: string,
): Map<string, PermissionMapping> {
  const content = readFileSync(filePath, "utf-8");
  const mappings = new Map<string, PermissionMapping>();

  // Match route entries like:
  // "/dashboard": {
  //   requiredPermissions: [PERMISSIONS['dashboard:view']],
  //   description: "...",
  // },

  const routePattern = /"([^"]+)":\s*\{([^}]+)\}/g;
  let match;

  while ((match = routePattern.exec(content)) !== null) {
    const path = match[1];
    const routeBody = match[2];

    const mapping: PermissionMapping = {
      path,
      permissions: [],
    };

    // Extract requiredPermissions
    const permsMatch = routeBody.match(/requiredPermissions:\s*\[([^\]]+)\]/);
    if (permsMatch) {
      const permsStr = permsMatch[1];
      const permValues = permsStr
        .split(",")
        .map((p) => extractPermissionValue(p))
        .filter(Boolean);

      mapping.permissions = permValues.map(valueToConstantName);
    }

    // Extract requiredAllPermissions
    const allPermsMatch = routeBody.match(
      /requiredAllPermissions:\s*\[([^\]]+)\]/,
    );
    if (allPermsMatch) {
      const permsStr = allPermsMatch[1];
      const permValues = permsStr
        .split(",")
        .map((p) => extractPermissionValue(p))
        .filter(Boolean);

      mapping.allPermissions = permValues.map(valueToConstantName);
    }

    // Extract requiredRoles
    const rolesMatch = routeBody.match(/requiredRoles:\s*\[([^\]]+)\]/);
    if (rolesMatch) {
      const rolesStr = rolesMatch[1];
      mapping.roles = rolesStr
        .split(",")
        .map((r) => r.trim().replace(/['"]/g, ""))
        .filter(Boolean);
    }

    mappings.set(path, mapping);
  }

  return mappings;
}

/**
 * Update routes-manifest.ts with correct permissions
 */
function updateRoutesManifest(
  manifestPath: string,
  mappings: Map<string, PermissionMapping>,
): void {
  let content = readFileSync(manifestPath, "utf-8");

  // Find each route definition and update its permissions
  const routePattern =
    /(\{\s*path:\s*"([^"]+)",[\s\S]*?requiredPermissions:\s*)\[([^\]]*)\]/g;

  content = content.replace(
    routePattern,
    (
      fullMatch: string,
      prefix: string,
      path: string,
      _currentPerms: string,
    ) => {
      const mapping = mappings.get(path);

      if (!mapping || mapping.permissions.length === 0) {
        // No mapping found or no permissions - keep original (might be intentional)
        return fullMatch;
      }

      // Replace with correct permission constant names
      const permsList = mapping.permissions.map((p) => `"${p}"`).join(", ");
      return `${prefix}[${permsList}]`;
    },
  );

  // Handle requiredAllPermissions
  const allPermsPattern =
    /(\{\s*path:\s*"([^"]+)",[\s\S]*?requiredAllPermissions:\s*)\[([^\]]*)\]/g;

  content = content.replace(
    allPermsPattern,
    (
      fullMatch: string,
      prefix: string,
      path: string,
      _currentPerms: string,
    ) => {
      const mapping = mappings.get(path);

      if (
        !mapping ||
        !mapping.allPermissions ||
        mapping.allPermissions.length === 0
      ) {
        return fullMatch;
      }

      const permsList = mapping.allPermissions.map((p) => `"${p}"`).join(", ");
      return `${prefix}[${permsList}]`;
    },
  );

  // Handle requiredRoles
  const rolesPattern =
    /(\{\s*path:\s*"([^"]+)",[\s\S]*?requiredRoles:\s*)\[([^\]]*)\]/g;

  content = content.replace(
    rolesPattern,
    (
      fullMatch: string,
      prefix: string,
      path: string,
      _currentRoles: string,
    ) => {
      const mapping = mappings.get(path);

      if (!mapping || !mapping.roles || mapping.roles.length === 0) {
        return fullMatch;
      }

      const rolesList = mapping.roles.map((r) => `"${r}"`).join(", ");
      return `${prefix}[${rolesList}]`;
    },
  );

  writeFileSync(manifestPath, content, "utf-8");
}

/**
 * Main execution
 */
function main() {
  console.log("🔧 Starting permission mapping fix...\n");

  const oldProtectedRoutesPath = join(
    process.cwd(),
    "src",
    "config",
    "protected-routes.ts",
  );
  const manifestPath = join(
    process.cwd(),
    "src",
    "config",
    "routes-manifest.ts",
  );

  console.log("📖 Reading old protected-routes.ts...");
  const mappings = parseOldProtectedRoutes(oldProtectedRoutesPath);
  console.log(`  ✅ Extracted ${mappings.size} route permission mappings\n`);

  console.log("🔄 Updating routes-manifest.ts...");
  updateRoutesManifest(manifestPath, mappings);
  console.log("  ✅ Manifest updated with correct permissions\n");

  console.log("✨ Fix complete!");
  console.log("\n📝 Next steps:");
  console.log("  1. Review routes-manifest.ts to verify permissions");
  console.log("  2. Run: npm run generate:routes");
  console.log("  3. Verify generated files have proper PERMISSIONS.X syntax");
}

try {
  main();
  process.exit(0);
} catch (error) {
  console.error("\n❌ Fix failed:", error);
  process.exit(1);
}
