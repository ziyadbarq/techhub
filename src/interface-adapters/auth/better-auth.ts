/* eslint-disable @typescript-eslint/no-restricted-imports */
// Adapter re-export for Better Auth to keep presentation layer free of infrastructure imports.
export { auth } from "@/infrastructure/services/auth/better-auth";
export type { Session, User } from "@/infrastructure/services/auth/better-auth";
