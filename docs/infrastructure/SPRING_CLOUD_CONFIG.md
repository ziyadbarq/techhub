# Spring Cloud Config Integration

TechHub loads runtime configuration from Spring Cloud Config in Kubernetes. The
Docker entrypoint, `docker-start.mjs`, fetches config before migrations, seed,
and the Next.js standalone server start. The Next.js instrumentation hook also
hydrates restart-required database settings and initializes the DI container, but
Kubernetes runtime config does not depend on instrumentation as the first loader.

## Runtime Flow

```text
Kubernetes injects bootstrap env
  CONFIG_SERVER_URL
  APPLICATION_NAME=techhub
  ENVIRONMENT_NAME=gcpdev|dev|uat|prod
      |
      v
docker-start.mjs fetches GET {CONFIG_SERVER_URL}/{APPLICATION_NAME}/{ENVIRONMENT_NAME}
      |
      v
process.env is populated from Spring Cloud Config
      |
      v
migrations run, production seed runs if needed, Next.js starts
```

Profile resolution matches the deployment path:

1. `ENVIRONMENT_NAME`
2. `SPRING_PROFILE`
3. `NODE_ENV` mapping: `production -> prod`, everything else -> `dev`

## Configuration Source Priority

Two sources supply env vars to the running pod. Understanding their priority prevents
silent config bugs.

| Source | Where it lives | When it applies |
| ------ | -------------- | --------------- |
| `values-gcpdev.yaml` (GitOps repo `values-yaml-npd`) | Applied by ArgoCD at pod start | Always — injects env vars before the app starts |
| `techhub-gcpdev.properties` (Spring Cloud Config, `backend-configs` repo) | Fetched by `docker-start.mjs` at startup | Only for keys the config server actually returns |

**Priority rule**: `docker-start.mjs` sets `process.env[key]` unconditionally for every
key Spring Cloud Config returns, so **Spring Cloud Config wins** when both sources define
the same key. For keys absent from Spring Cloud Config, the `values-gcpdev.yaml` value
persists unchanged.

**Practical split (in progress with DevOps)**:

- Deployment-specific vars (public URLs, trusted origins, bootstrap pointers) live in
  `values-gcpdev.yaml`, maintained by the DevOps team in `values-yaml-npd`
  (`~/techhub/values-gcpdev.yaml` locally).
- App-level vars (database connections, encryption keys, feature flags) live in
  `techhub-gcpdev.properties`, managed in `backend-configs`.

**When a pod has a wrong env var value**, check both:

1. `kubectl exec -n horizontal-services <pod> -- env | grep VAR_NAME` — what the pod has now
2. `backend-configs` → `techhub-gcpdev.properties` — does Spring Cloud Config provide this key?
3. `values-yaml-npd` → `techhub/values-gcpdev.yaml` — does the chart inject it with a stale value?

If the key is absent from Spring Cloud Config but has a wrong value in `values-gcpdev.yaml`,
add the correct value to `techhub-gcpdev.properties` — it will override the chart value on the
next pod start without needing a chart update.

## Dev Profiles

The active dev profiles are:

- `techhub-gcpdev.properties` for GCP dev
- `techhub-dev.properties` for OCI dev

Use `https://techhub.dev.barq.com` as the canonical dev browser origin. Keep
`BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` identical. Set `TRUSTED_ORIGINS`
only for additional browser origins during a transition.

### `techhub-gcpdev.properties`

```properties
# TechHub - GCP Dev Environment
# Spring Cloud Config profile: gcpdev

NODE_ENV=production
LOG_LEVEL=debug
PORT=3000

# --- Redis ---
REDIS_URL=redis://redis.dev.barq.com:6379

# --- Security ---
ENCRYPTION_KEY=0ba0bf6dea177b8442c5fed421d0fbda50eb415e73deefd975e9a5775e8564cc

# --- Auth ---
BETTER_AUTH_URL=https://techhub.dev.barq.com
BETTER_AUTH_SECRET=XmPMOa+T2AUH13vPJqJoAllUC6njO9RwkFdYJpYWdNE=
TRUSTED_ORIGINS=https://techhub.dev.barq.com

# --- Public/UI ---
NEXT_PUBLIC_APP_URL=https://techhub.dev.barq.com
NEXT_PUBLIC_ENABLE_EMAIL_REGISTRATION=true
NEXT_PUBLIC_ENABLE_MS_AUTH=false
NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL=30000
```

### `techhub-dev.properties`

```properties
# TechHub - OCI Dev Environment
# Spring Cloud Config profile: dev

NODE_ENV=production
LOG_LEVEL=info
PORT=3000

# --- Database ---
DATABASE_URL=postgresql://techhub:YG%3C2KH%60r%29I%2CkHjMO@172.17.19.3:5432/techhub

# --- Security ---
ENCRYPTION_KEY=0ba0bf6dea177b8442c5fed421d0fbda50eb415e73deefd975e9a5775e8564cc

# --- Better Auth ---
BETTER_AUTH_URL=https://techhub.dev.barq.com
BETTER_AUTH_SECRET=jpJlqIIKxyT1co5772FbiD+n7QMIlIS+bCjkfFpb970=
TRUSTED_ORIGINS=https://techhub.dev.barq.com

# --- Public/UI ---
NEXT_PUBLIC_APP_URL=https://techhub.dev.barq.com
NEXT_PUBLIC_ENABLE_EMAIL_REGISTRATION=true
NEXT_PUBLIC_ENABLE_MS_AUTH=false
NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL=30000
```

Do not keep commented credentials, old IP URLs, `<from-k8s>` placeholders,
`ALLOW_ENV_DEBUG=true`, or `OPENAI_API_KEY=openai` in these files. The debug env
endpoint is already enabled for `gcpdev` and `dev`, and `OPENAI_API_KEY` is not
currently consumed by application code.

## Deployment Bootstrap

The values repo must inject only the bootstrap config needed to reach Spring
Cloud Config plus any vars intentionally kept in Kubernetes Secret/ConfigMap by
the current hybrid split.

GCP dev:

```yaml
deployment:
  env:
    - name: CONFIG_SERVER_URL
      value: "http://config-server-svc.horizontal-services.svc.cluster.local:8083"
    - name: APPLICATION_NAME
      value: "techhub"
    - name: ENVIRONMENT_NAME
      value: "gcpdev"
```

OCI dev:

```yaml
deployment:
  env:
    - name: CONFIG_SERVER_URL
      value: "http://config-server.baraq.com:8888"
    - name: APPLICATION_NAME
      value: "techhub"
    - name: ENVIRONMENT_NAME
      value: "dev"
```

`CONFIG_SERVER_URL` must include the scheme. If `DATABASE_URL`, `REDIS_URL`, or
another runtime value is absent from backend-configs by design, verify the live
pod receives it from Kubernetes before removing any fallback.

## GitLab CI/CD Variables

GitLab CI/CD variables are for the pipeline and build-time needs, not the final
runtime pod environment unless the chart explicitly injects them.

Keep:

- `GITLAB_UN`
- `GITLAB_TOKEN`
- `ENCRYPTION_KEY` if validation needs it
- `NEXT_PUBLIC_APP_URL=https://techhub.dev.barq.com` for dev builds, because
  Next.js can inline public variables into the client bundle at build time

Do not put runtime `DATABASE_URL` in GitLab CI variables. Prisma client
generation uses a CI placeholder; the live URL comes from Spring Cloud Config.

Runtime values are verified in the rendered Deployment/Pod, not assumed from
GitLab CI/CD variable presence.

## Verification

From a VPN-enabled machine:

```bash
dotenv -e .env.local -- tsx scripts/config/verify-cloud-config.ts --profiles=gcpdev,dev --app-url=https://techhub.dev.barq.com
```

The verifier checks:

- `CONFIG_SERVER_URL` is present and has a valid URL scheme
- config server health endpoint responds
- both dev profiles load
- required config keys are present in backend-configs
- `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` match the canonical dev URL
- junk keys and placeholders are absent

After deployment:

```bash
kubectl exec -n horizontal-services deploy/techhub -c techhub -- env | grep -E 'CONFIG_SERVER_URL|APPLICATION_NAME|ENVIRONMENT_NAME|DATABASE_URL|REDIS_URL|ENCRYPTION_KEY|BETTER_AUTH_URL|BETTER_AUTH_SECRET|NEXT_PUBLIC_APP_URL'
curl -fsS https://techhub.dev.barq.com/api/debug/env
curl -fsS https://techhub.dev.barq.com/api/health
```

Expected debug response highlights:

- `configSource` is `config-server`
- `ENVIRONMENT_NAME` is `gcpdev`
- all critical `has*` fields are `true`

## Files

| File                                                                        | Purpose                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [docker-start.mjs](/docker-start.mjs)                                       | Kubernetes Docker entrypoint and first runtime config loader |
| [instrumentation.ts](/src/instrumentation.ts)                               | Next.js startup hook for config hydration and DI bootstrap   |
| [cloud-config-loader.ts](/src/infrastructure/config/cloud-config-loader.ts) | Spring Cloud Config REST client                              |
| [verify-cloud-config.ts](/scripts/config/verify-cloud-config.ts)            | Dev profile verification script                              |
