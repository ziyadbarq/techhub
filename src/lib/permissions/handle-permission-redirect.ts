import { redirect } from "next/navigation";
import { InsufficientPermissionsError } from "@/core/domain/errors/rbac-errors";

/**
 * Redirect to /unauthorized when a permission check fails.
 * Intended for server components/pages that call requirePermission.
 */
export function handlePermissionRedirect(error: unknown, path: string): void {
  // Redirect unauthenticated users to login
  if (
    error instanceof Error &&
    (error.message?.includes("Not authenticated") ||
      error.name === "NotAuthenticatedError")
  ) {
    redirect("/login");
  }

  if (
    error instanceof InsufficientPermissionsError ||
    (error instanceof Error &&
      (error.name === "InsufficientPermissionsError" ||
        error.message?.includes("Insufficient permissions")))
  ) {
    const params = new URLSearchParams();

    if (
      error instanceof InsufficientPermissionsError &&
      error.requiredPermission
    ) {
      params.set("required", error.requiredPermission);
    }

    params.set("path", path);

    redirect(`/unauthorized?${params.toString()}`);
  }
}
