import { auth } from "@/interface-adapters/auth/better-auth";
import { logger } from "@/lib/logger";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

const handleAuthRequest = async (request: Request) => {
  const log = logger.scope("AuthRoute");
  const container = getContainer();
  const idGenerator = container.get<IIdGenerator>(DI_TOKENS.IIdGenerator);
  const requestId = idGenerator.generateId();
  const url = new URL(request.url);
  const clientIp =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const startedAt = Date.now();

  log.info("request", "Incoming auth request", {
    method: request.method,
    path: url.pathname,
    requestId,
    clientIp,
    userAgent,
  });

  try {
    const response = await auth.handler(request);
    const duration = Date.now() - startedAt;

    log.info("response", "Auth response", {
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
      log.warn("response", "Auth response not ok", {
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
    log.error("handler", "Auth handler error", error, {
      method: request.method,
      path: url.pathname,
      requestId,
      durationMs: duration,
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
