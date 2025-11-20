import { auth } from "@/lib/auth/better-auth";
import { createId } from "@paralleldrive/cuid2";

const handleAuthRequest = async (request: Request) => {
  const requestId = createId();
  const url = new URL(request.url);
  const clientIp =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const startedAt = Date.now();

  console.info("[AuthRoute] incoming request", {
    method: request.method,
    path: url.pathname,
    requestId,
    clientIp,
    userAgent,
  });

  try {
    const response = await auth.handler(request);
    const duration = Date.now() - startedAt;

    console.info("[AuthRoute] response", {
      method: request.method,
      path: url.pathname,
      requestId,
      status: response.status,
      ok: response.ok,
      durationMs: duration,
    });

    if (!response.ok) {
      let preview = "";
      try {
        preview = (await response.clone().text()).slice(0, 200);
      } catch {
        preview = "";
      }
      console.warn("[AuthRoute] non-200 response", {
        method: request.method,
        path: url.pathname,
        requestId,
        status: response.status,
        preview,
      });
    }

    return response;
  } catch (error) {
    const duration = Date.now() - startedAt;
    console.error("[AuthRoute] handler error", {
      method: request.method,
      path: url.pathname,
      requestId,
      durationMs: duration,
      error,
    });
    throw error;
  }
};

// Better Auth route handler for Next.js App Router with verbose logging
export async function GET(request: Request) {
  return handleAuthRequest(request);
}

export async function POST(request: Request) {
  return handleAuthRequest(request);
}
