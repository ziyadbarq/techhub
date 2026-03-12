# TechHub — Deployment Troubleshooting Report

**Date:** 12 March 2026
**Branch:** dev
**Repos:** webdev/techhub · devops/values-yaml-npd · backend-shared/backend-configs

---

## What happened

TechHub was deployed to GCP Dev (Kubernetes) but showed zero logs, missing environment variables, browser errors on registration, and auth endpoints returning 404. Investigation uncovered four separate root causes.

---

## Root Cause 1 — Instrumentation file in the wrong place

Next.js has a bug where standalone builds only load `instrumentation.ts` from `src/`, not the project root. Our file was at the root, so the `register()` hook never ran in production. That meant the config server was never contacted, environment variables were never loaded, and the Pino logger was never initialized. This is why `kubectl logs` showed nothing beyond the Next.js "Ready" message.

**Bug reports:** [next.js#81050](https://github.com/vercel/next.js/issues/81050), [next.js#49897](https://github.com/vercel/next.js/issues/49897)

**Fix:** Moved the file to `src/instrumentation.ts`. Also created `docker-start.mjs` as the Docker entrypoint, which fetches config and sets env vars before the Next.js server even starts — so we don't depend on instrumentation alone.

> Commits: `5bf4836`, `32fbd32`

---

## Root Cause 2 — Istio sidecar not ready when app starts

The app tried to fetch config from Spring Cloud Config Server immediately on startup, but the Istio sidecar proxy wasn't ready yet. Every HTTP request failed with "aborted" or "fetch failed". From inside the pod, `wget` worked fine (because by then the sidecar was up), which made this very confusing to debug.

**Fix:** Added the `holdApplicationUntilProxyStarts` pod annotation so Kubernetes waits for the Istio proxy before starting the app container.

> Commits: pushed to values-yaml-npd

---

## Root Cause 3 — Client-side env vars baked at build time

`NEXT_PUBLIC_APP_URL` is embedded into the client-side JavaScript bundle during `next build`, not at runtime. Since CI didn't have the correct value, the browser JS was hardcoded to `http://localhost:3000`. This caused Content Security Policy violations when the app was accessed from `172.17.17.251`.

**Fix:** Changed `src/lib/auth/client.ts` to use `window.location.origin` instead of the environment variable for the auth client's base URL.

> Commit: `ae12bd4`

---

## Root Cause 4 — Better Auth returns 404 on all auth routes (OPEN)

This is still under investigation. The request reaches the route handler (logs confirm "Incoming auth request"), but Better Auth's internal router returns 404 with an empty body in ~4ms. This is a route-matching failure, not a database error.

**What we've ruled out:**
- Version regression — `better-auth@1.4.10` supports Next.js 16; downgrading to 1.4.4 breaks peer deps
- `trailingSlash` — not set in `next.config.ts`
- `toNextJsHandler` vs `handler()` — source code shows they're identical
- Missing secret — `BETTER_AUTH_SECRET` is now set in both values and properties

**What still needs testing:**
- Whether `betterAuth()` initialization throws silently (swallowed error leaving a broken instance)
- Whether the custom `nextCookies` plugin interferes with route registration
- Whether a minimal config (no plugins, no hooks, no Prisma extensions) works
- Whether the issue reproduces locally with a standalone build
- Whether calling `auth.api.signUpEmail()` directly (server-side, bypassing HTTP) works

**Related issues:** [better-auth#6671](https://github.com/better-auth/better-auth/issues/6671), [better-auth#6636](https://github.com/better-auth/better-auth/issues/6636), [better-auth#2190](https://github.com/better-auth/better-auth/issues/2190)

---

## All issues found (18 total)

### Startup & Config

| # | Issue | What went wrong |
|---|-------|-----------------|
| 1 | Instrumentation at wrong path | Standalone build only loads from `src/`, file was at root |
| 2 | CJS config client package | Replaced `cloud-config-client` (CJS) with plain `fetch()` |
| 3 | Config profile mismatch | `getSpringProfile()` used `NODE_ENV` instead of `ENVIRONMENT_NAME`, requested "prod" instead of "gcpdev" |
| 4 | Missing properties file | Only `techhub-dev.properties` existed; created `techhub-gcpdev.properties` |
| 5 | Istio sidecar timing | Config fetches failed because the proxy wasn't ready at startup |
| 6 | `NODE_ENV` not in values | Defaulted to `development` in `docker-start.mjs`; now explicitly `production` |
| 7 | Silent `register()` failures | Import errors in instrumentation were swallowed with no output |

### Logging

| # | Issue | What went wrong |
|---|-------|-----------------|
| 8 | Logger coupled to T3 Env | Pino crashed if env validation failed, so it couldn't even report the failure |
| 9 | No production init log | Logger only confirmed initialization in development mode |
| 10 | No startup banner | Zero output at boot — impossible to tell what config was loaded |
| 11 | `LOG_LEVEL` missing from values | Relied entirely on config server, which wasn't loading |

### Auth

| # | Issue | What went wrong |
|---|-------|-----------------|
| 12 | Auth secrets missing | `BETTER_AUTH_URL` and `BETTER_AUTH_SECRET` not in values or properties |
| 13 | `NEXT_PUBLIC_APP_URL` baked as localhost | Client JS called `localhost:3000`, blocked by CSP |
| 14 | Better Auth 404 on all routes | Internal router doesn't match any path (still open) |

### Infrastructure

| # | Issue | What went wrong |
|---|-------|-----------------|
| 15 | No `/api/health` endpoint | Dockerfile HEALTHCHECK target didn't exist |
| 16 | No debug endpoint | No way to inspect env vars in a running pod |
| 17 | All env vars in Helm values | Should be in Spring Cloud Config properties with values as fallback only |
| 18 | Wrong network policy selector | Referenced `customer-identity` instead of `techhub` |

---

## Fixes applied

| What was fixed | Files changed | Commit |
|----------------|---------------|--------|
| Move instrumentation to `src/` | `src/instrumentation.ts` | `5bf4836` |
| Add `docker-start.mjs` as Docker entrypoint | `docker-start.mjs`, `Dockerfile` | `5bf4836` |
| Replace CJS config client with `fetch()` | `cloud-config-loader.ts` | `976dae9` |
| Use `ENVIRONMENT_NAME` for config profile | `cloud-config-init.ts` | `db328f4` |
| Add `/api/health` endpoint | `src/app/api/health/route.ts` | `db328f4` |
| Add `/api/debug/env` diagnostic endpoint | `src/app/api/debug/env/route.ts` | `db328f4` |
| Decouple Pino from T3 Env validation | `pino-logger.service.ts` | `32fbd32` |
| Bootstrap DI container at startup | `src/instrumentation.ts` | `32fbd32` |
| Log Pino init in production | `pino-logger.service.ts` | `db328f4` |
| Add startup banner to stdout | `cloud-config-init.ts` | `db328f4` |
| Create gcpdev properties file | `backend-configs/techhub/techhub-gcpdev.properties` | `568e136d` |
| Move env vars to properties, keep fallbacks in values | `values-gcpdev.yaml` | `2e4ee95` |
| Add Istio `holdApplicationUntilProxyStarts` annotation | `values-gcpdev.yaml` | pushed |
| Set `NODE_ENV=production` in values | `values-gcpdev.yaml` | pushed |
| Fix `NEXT_PUBLIC_APP_URL` to correct IP | `values-gcpdev.yaml`, `techhub-gcpdev.properties` | pushed |
| Use `window.location.origin` for auth client | `src/lib/auth/client.ts` | `ae12bd4` |
| Add `BETTER_AUTH_URL` and `BETTER_AUTH_SECRET` | `values-gcpdev.yaml`, `techhub-gcpdev.properties` | pushed |
| Fix network policy selector | `values-gcpdev.yaml` | pushed |
| Enable Next.js fetch logging + disable memory cache | `next.config.ts` | pushed |

---

## Still to do

- [ ] **Resolve Better Auth 404** — the last blocking issue for registration/login
- [ ] Remove `cloud-config-client` and `@types/cloud-config-client` from `package.json`
- [ ] Revert `better-auth` pin in `package.json` from `1.4.4` back to `^1.4.10` (pin was wrong fix)
- [ ] Test full registration and login flow end-to-end
- [ ] Once config server is confirmed stable, remove fallback env vars from `values-gcpdev.yaml`
