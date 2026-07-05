/**
 * Better Auth Session Cookie Names
 *
 * Better Auth derives the session cookie name from the deployment scheme:
 * - HTTP  (BETTER_AUTH_URL is http://):  "better-auth.session_token"
 * - HTTPS (BETTER_AUTH_URL is https://): "__Secure-better-auth.session_token"
 *   (secure cookies automatically get the "__Secure-" name prefix)
 *
 * Any code doing a lightweight cookie-presence check must handle both names,
 * otherwise switching an environment between http and https silently breaks
 * session detection (redirect loops).
 */
export const SESSION_COOKIE_NAMES = [
  "better-auth.session_token", // HTTP (non-secure) deployments
  "__Secure-better-auth.session_token", // HTTPS deployments (secure cookie prefix)
] as const;
