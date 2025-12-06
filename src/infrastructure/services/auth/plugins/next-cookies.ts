import { createAuthMiddleware } from "@better-auth/core/api";
import { parseSetCookieHeader } from "better-auth/cookies";
import { cookies as getCookies } from "next/headers";

type ParsedCookie =
  ReturnType<typeof parseSetCookieHeader> extends Map<string, infer V>
    ? V
    : never;

/**
 * Custom Next.js cookie bridge for Better Auth.
 *
 * Mirrors the upstream plugin but uses a direct import of `next/headers.js`
 * through the Next bundler so Node doesn't need to resolve the bare specifier
 * at runtime (which broke on Next 16).
 */
export const nextCookies = () => {
  return {
    id: "next-cookies",
    hooks: {
      after: [
        {
          matcher() {
            return true;
          },
          handler: createAuthMiddleware(async (ctx) => {
            const returned = ctx.context.responseHeaders;
            if ("_flag" in ctx && ctx._flag === "router") return;
            if (!(returned instanceof Headers)) return;

            const setCookies = returned.get("set-cookie");
            if (!setCookies) return;

            const parsed = parseSetCookieHeader(setCookies);
            let cookieHelper;
            try {
              cookieHelper = await getCookies();
            } catch (error) {
              if (
                error instanceof Error &&
                error.message.startsWith(
                  "`cookies` was called outside a request scope.",
                )
              ) {
                return;
              }
              throw error;
            }

            parsed.forEach((value: ParsedCookie, key: string) => {
              if (!key) return;
              const opts = {
                sameSite: value.samesite,
                secure: value.secure,
                maxAge: value["max-age"],
                httpOnly: value.httponly,
                domain: value.domain,
                path: value.path,
              };
              try {
                cookieHelper.set(key, decodeURIComponent(value.value), opts);
              } catch {
                // Ignore invalid cookie writes; this mirrors Better Auth's behavior.
              }
            });
          }),
        },
      ],
    },
  };
};
