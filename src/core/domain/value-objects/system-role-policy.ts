/** The only TechHub role that is protected from editing and deletion. */
export const SYSTEM_ADMIN_ROLE_NAME = "system-administrator" as const;

export function isProtectedSystemRoleName(name: string): boolean {
  return name.toLowerCase().trim() === SYSTEM_ADMIN_ROLE_NAME;
}
