import type { Metadata } from "next";
import { PermissionDenied } from "@/components/auth/PermissionDenied";

export const metadata: Metadata = {
  title: "Unauthorized",
  description: "You don't have permission to access this resource",
};

interface UnauthorizedPageProps {
  searchParams: Promise<{
    required?: string;
    path?: string;
  }>;
}

/**
 * Unauthorized page - shown when users lack required permissions
 * Query params:
 * - required: The permission key that was required (e.g., "tasks:create" or "admin")
 * - path: The path the user attempted to access (e.g., "/admin/users")
 */
export default async function UnauthorizedPage({
  searchParams,
}: UnauthorizedPageProps) {
  const params = await searchParams;
  const requiredPermission = params.required;
  const attemptedPath = params.path;

  // Customize description based on attempted path or permission
  let description =
    "You don't have the necessary permissions to access this resource.";

  if (attemptedPath) {
    description = `You don't have permission to access ${attemptedPath}.`;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <PermissionDenied
        requiredPermission={requiredPermission}
        description={description}
        showBackButton={true}
      />
    </div>
  );
}
