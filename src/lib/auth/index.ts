export { auth } from "@/interface-adapters/auth/better-auth";
export type { Session, User } from "@/interface-adapters/auth/better-auth";
export { getSession, requireAuth, getCurrentUserId } from "./session";
export { authClient, useSession } from "./client";
export { encrypt, decrypt, encryptTokens, decryptTokens } from "./encryption";
