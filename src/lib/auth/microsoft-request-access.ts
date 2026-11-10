import "server-only";

import { prisma } from "@/infrastructure/database/prisma/client";
import { getSession } from "@/lib/auth/session";

/**
 * Microsoft provenance for request submission belongs to the current session, NOT to the user account.
 * A linked Microsoft account or lastLoginMethod can also exist on email sessions.
 */
export async function getMicrosoftRequestAccess(): Promise<{
  authenticated: boolean;
  allowed: boolean;
}> {
  const { session, user } = await getSession();
  if (!session || !user) {
    return { authenticated: false, allowed: false };
  }

  if (!session.token) {
    return { authenticated: true, allowed: false };
  }

  const marked = await prisma.session.findUnique({
    where: { sessionToken: session.token },
    select: { userId: true, expires: true, authProvider: true },
  });

  return {
    authenticated: true,
    allowed:
      marked?.userId === user.id &&
      marked.authProvider === "microsoft" &&
      marked.expires > new Date(),
  };
}
