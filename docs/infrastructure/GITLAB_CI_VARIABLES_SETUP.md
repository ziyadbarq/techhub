# GitLab CI/CD Variables Setup

## What Lives Where

| Variable              | Where it lives                                              | Why                                                                      |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `GITLAB_UN`           | GitLab CI/CD project variables                              | Pipeline writes updated image tags to the values repo                    |
| `GITLAB_TOKEN`        | GitLab CI/CD project variables                              | Pipeline writes updated image tags to the values repo                    |
| `DATABASE_URL`        | GitLab CI/CD project variables if needed                    | Prisma generation/validation may need a database URL shape at build time |
| `ENCRYPTION_KEY`      | GitLab CI/CD project variables if needed                    | Validation may need the encryption key format                            |
| `NEXT_PUBLIC_APP_URL` | GitLab CI/CD project variables for dev builds               | Next.js can inline public variables into the client bundle at build time |
| Runtime app config    | Spring Cloud Config plus current K8s Secret/ConfigMap split | Loaded by the pod at startup through `docker-start.mjs`                  |

For dev builds, set:

```text
NEXT_PUBLIC_APP_URL=https://techhub.dev.barq.com
```

`BETTER_AUTH_URL` and runtime `NEXT_PUBLIC_APP_URL` must also be
`https://techhub.dev.barq.com` in Spring Cloud Config for the dev profiles.

## Required Pipeline Variables

Go to **GitLab UI > Project > Settings > CI/CD > Variables > Add variable**.

| Variable              | Masked |           Protected | Notes                                            |
| --------------------- | -----: | ------------------: | ------------------------------------------------ |
| `GITLAB_UN`           |    Yes |         Usually yes | Needs values repo write access                   |
| `GITLAB_TOKEN`        |    Yes |         Usually yes | Needs `read_repository` and `write_repository`   |
| `DATABASE_URL`        |    Yes | No for `dev` branch | Keep if Prisma generation/validation requires it |
| `ENCRYPTION_KEY`      |    Yes | No for `dev` branch | Keep if validation requires it                   |
| `NEXT_PUBLIC_APP_URL` |     No | No for `dev` branch | Set to `https://techhub.dev.barq.com`            |

Keep **Protected = No** for variables needed by the non-protected `dev` branch.

## Runtime Config Activation

`CONFIG_SERVER_URL` must be in the running pod environment, not only in GitLab
CI/CD variables. For GCP dev, the values repo should inject:

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

Once the pod restarts, logs from `docker-start.mjs` should show config loading
before migrations:

```text
[config] Fetching: GET http://config-server-svc.horizontal-services.svc.cluster.local:8083/techhub/gcpdev
[config] Loaded ...
[migrate] Running database migrations...
```

## Verify

From a VPN-enabled machine:

```bash
dotenv -e .env.local -- tsx scripts/config/verify-cloud-config.ts --profiles=gcpdev,dev --app-url=https://techhub.dev.barq.com
kubectl exec -n horizontal-services deploy/techhub -c techhub -- env | grep -E 'CONFIG_SERVER_URL|APPLICATION_NAME|ENVIRONMENT_NAME|DATABASE_URL|REDIS_URL|ENCRYPTION_KEY|BETTER_AUTH_URL|BETTER_AUTH_SECRET|NEXT_PUBLIC_APP_URL'
curl -fsS https://techhub.dev.barq.com/api/debug/env
```

## Troubleshooting

### Variables Not Picked Up In Pipeline

- Confirm the variable exists on the TechHub project, not only a different project.
- Keep variables needed by `dev` as non-protected unless the branch is protected.
- Re-run the pipeline after saving variables.

### Runtime Config Missing In Pod

- Check the rendered ArgoCD manifest or live Deployment/Pod, not just GitLab CI/CD variables.
- Confirm `CONFIG_SERVER_URL` includes `http://` or `https://`.
- Confirm `APPLICATION_NAME=techhub`.
- Confirm `ENVIRONMENT_NAME=gcpdev` for GCP dev and `ENVIRONMENT_NAME=dev` for OCI dev.

### `DATABASE_URL` Errors During CI

The CI value only needs to satisfy the tools that run during build/generation.
Runtime database connectivity is verified in the deployed pod.

## See Also

- [SPRING_CLOUD_CONFIG.md](./SPRING_CLOUD_CONFIG.md) - runtime config setup and cleaned dev profile templates
- [GITLAB_CI_SETUP.md](../deployment/GITLAB_CI_SETUP.md) - full CI/CD pipeline docs
