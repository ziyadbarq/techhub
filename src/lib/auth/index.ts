// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- legacy re-export for app layer; see docs/architecture/IMPORT_RULES.md
export { auth } from "@/interface-adapters/auth/better-auth";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- legacy re-export for app layer; see docs/architecture/IMPORT_RULES.md
export type { Session, User } from "@/interface-adapters/auth/better-auth";
export { getSession, requireAuth, getCurrentUserId } from "./session";
export { authClient, useSession } from "./client";
export { encrypt, decrypt, encryptTokens, decryptTokens } from "./encryption";
