# GitLab CI/CD Variables Setup

## What lives where

| Variable | Where it lives | Why |
|---|---|---|
| `DATABASE_URL` | GitLab CI/CD project variables | Needed by `npx prisma validate` in the validate stage |
| `ENCRYPTION_KEY` | GitLab CI/CD project variables | Needed by the validate stage format check |
| Everything else | Spring Cloud Config (`techhub-dev.properties`) | Runtime — loaded by the pod at startup via `instrumentation.ts` |

The pipeline only needs 2 variables. All runtime config (Redis, auth, OAuth, AI keys, etc.) is served by Spring Cloud Config and never touches GitLab CI variables.

---

## Add the 2 build-time variables

Go to: **GitLab UI > Project > Settings > CI/CD > Variables > Add variable**

| Variable | Value | Masked | Protected |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://techhub:...@172.17.19.3:5432/techhub` | ✅ Yes | No |
| `ENCRYPTION_KEY` | `0ba0bf6dea177b8442c5fed421d0fbda50eb415e73deefd975e9a5775e8564cc` | ✅ Yes | No |

> Keep **Protected = No** so the variable is available on the `dev` branch (non-protected branches are blocked from protected variables).

---

## Activate Spring Cloud Config (runtime)

`CONFIG_SERVER_URL` must be in the **running pod's environment**, not in GitLab CI variables.

Add it to `manifests/techhub/values-gcpdev.yaml` in the `deployment-configs` repo:

```yaml
CONFIG_SERVER_URL: "http://config-server.baraq.com:8888"
SPRING_PROFILE: "dev"
```

Once the pod restarts you should see in logs:
```
=== Spring Cloud Config Integration ===
✅ Config loaded from config-server: XX keys loaded
✅ All critical environment variables are present
```

See [SPRING_CLOUD_CONFIG.md](./SPRING_CLOUD_CONFIG.md) for full details.

---

## Verify the CI pipeline

After adding the 2 variables, trigger a pipeline and check for:
```
✅ Critical environment variables are set
```

If you see:
```
❌ ERROR DATABASE_URL not set
```
→ The variable is missing from GitLab CI/CD settings, or it's marked Protected but the branch isn't protected.

---

## Troubleshooting

### Variables not picked up in pipeline
- Confirm the variable exists on this project (not a group variable)
- For the `dev` branch, keep variables **non-protected**
- Re-run the pipeline after saving

### DATABASE_URL connection errors during validate
The URL only needs to be a valid format for `prisma validate` — it does not need to be a reachable host. A real DB URL works fine; a dummy one also works.

---

## See Also

- [SPRING_CLOUD_CONFIG.md](./SPRING_CLOUD_CONFIG.md) — config server setup and runtime vars
- [GITLAB_CI_SETUP.md](../deployment/GITLAB_CI_SETUP.md) — full CI/CD pipeline docs
