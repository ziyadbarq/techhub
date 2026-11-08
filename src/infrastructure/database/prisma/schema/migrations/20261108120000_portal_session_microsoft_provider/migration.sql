-- Track the authentication provider of each Better Auth session.
-- Existing sessions remain untrusted for the standalone request portal;
-- they must reauthenticate via Microsoft.
ALTER TABLE "sessions" ADD COLUMN "authProvider" TEXT;
