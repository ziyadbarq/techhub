# GitLab CI/CD Variables Setup Checklist

## Current Status

The hardcoded credentials have been removed from `.gitlab-ci.yml`.
Two build-time variables must now be set in **GitLab CI/CD project variables** (Settings > CI/CD > Variables):

| Variable | Purpose | Protected | Masked |
|---|---|---|---|
| `DATABASE_URL` | Prisma validate during build | Optional | Yes |
| `ENCRYPTION_KEY` | Validate stage check and image build | Optional | Yes |

Runtime variables (REDIS_URL, BETTER_AUTH_*, etc.) are served by Spring Cloud Config.
`CONFIG_SERVER_URL` must be exposed to the application runtime environment before Spring Cloud Config can load.

---

## Required Variables (Add Now)

Go to: **GitLab UI > Project > Settings > CI/CD > Variables > Add variable**

### Option A: Build-Only (Docker Image Creation)

**Use this if you only need to build the Docker image without running migrations/seeds:**

| Variable Name         | Description                          | Example Value                              | Protected | Masked |
|-----------------------|--------------------------------------|--------------------------------------------|-----------|--------|
| `DATABASE_URL`        | Dummy PostgreSQL URL (build only)   | `postgresql://dummy:dummy@localhost:5432/dummy` | No    | No |
| `ENCRYPTION_KEY`      | Required by env validation and image build | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` | No | Yes |

**Why this works:**
- Prisma `generate` validates URL format but doesn't connect
- `ENCRYPTION_KEY` is validated for format only during CI
- TypeScript compilation uses generated types, no connection needed
- Next.js build bundles code, no database access during build

### Option B: Full CI/CD (Build + Deploy + Migrations)

**Use this if you need to run migrations, seeds, or deploy to environments with real databases:**

| Variable Name         | Description                          | Example Value                              | Protected | Masked |
|-----------------------|--------------------------------------|--------------------------------------------|-----------|--------|
| `DATABASE_URL`        | Real PostgreSQL connection string    | `postgresql://user:pass@host:5432/techhub` | Optional  | ✅ Yes |
| `ENCRYPTION_KEY`      | AES-256-GCM key for auth encryption  | `[64-char lowercase hex string]`           | Optional  | ✅ Yes |
| `REDIS_URL`           | Redis connection string              | `redis://redis-host:6379`                  | Optional  | ✅ Yes |
| `BETTER_AUTH_URL`     | Application URL                      | `https://techhub.baraq.com`                | No        | No     |
| `BETTER_AUTH_SECRET`  | Auth secret key (generate random)    | `[64-char random string]`                  | Optional  | ✅ Yes |

### Authentication Variables

| Variable Name             | Description                    | Example Value                          | Protected | Masked |
|---------------------------|--------------------------------|----------------------------------------|-----------|--------|
| `MICROSOFT_CLIENT_ID`     | Azure AD app client ID         | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | No        | ✅ Yes |
| `MICROSOFT_CLIENT_SECRET` | Azure AD app client secret     | `[secret value]`                       | Optional  | ✅ Yes |
| `MICROSOFT_TENANT_ID`     | Azure AD tenant ID             | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | No        | No     |

### Optional Variables

| Variable Name            | Description                     | Example Value               | Protected | Masked |
|--------------------------|---------------------------------|-----------------------------|-----------|--------|
| `OPENAI_API_KEY`         | OpenAI API key (if using AI)    | `sk-...`                    | Optional  | ✅ Yes |
| `LOG_LEVEL`              | Logging level                   | `info` or `debug`           | No        | No     |
| `NODE_ENV`               | Node environment                | `production`                | No        | No     |

## Quick Add Commands (CLI)

If you have GitLab CLI configured:

```bash
# Critical variables
glab variable create DATABASE_URL --value "postgresql://user:pass@host:5432/techhub" --masked
glab variable create ENCRYPTION_KEY --value "$(openssl rand -hex 32)" --masked
glab variable create REDIS_URL --value "redis://redis-host:6379" --masked
glab variable create BETTER_AUTH_URL --value "https://techhub.baraq.com"
glab variable create BETTER_AUTH_SECRET --value "$(openssl rand -hex 32)" --masked

# Auth variables
glab variable create MICROSOFT_CLIENT_ID --value "your-client-id" --masked
glab variable create MICROSOFT_CLIENT_SECRET --value "your-client-secret" --masked
glab variable create MICROSOFT_TENANT_ID --value "your-tenant-id"

# Optional
glab variable create OPENAI_API_KEY --value "sk-your-key" --masked
glab variable create LOG_LEVEL --value "info"
glab variable create NODE_ENV --value "production"
```

## Generate BETTER_AUTH_SECRET

```bash
# Generate a secure random secret (64 characters)
openssl rand -hex 32
```

## Verify Setup

After adding variables, trigger a pipeline and check for:

```
✅ Critical environment variables are set
```

If you see this error instead:
```
❌ ERROR: DATABASE_URL not set in CI environment
```

Then `DATABASE_URL` is missing from GitLab CI/CD variables.

## Future: Spring Cloud Config

Once Spring Cloud Config Server is deployed:

1. **Make `CONFIG_SERVER_URL` available to the running app container**
   ```bash
   glab variable create CONFIG_SERVER_URL --value "http://config-server.baraq.com:8888"
   ```
   This only helps if your deployment wiring passes the variable through to the pod.

2. **Keep existing variables as fallback** (hybrid approach)

3. **Monitor pipeline logs** for config loading:
   ```
   === Spring Cloud Config Integration ===
   🌐 Config Server: http://config-server.baraq.com:8888
   ✅ Config loaded from config-server: 42 keys loaded
   ```

4. **Remove direct variables** once config server is stable

## Troubleshooting

### Pipeline fails with "DATABASE_URL not set"

**Cause:** Variable not added to GitLab CI/CD settings

**Fix:** Add `DATABASE_URL` variable in GitLab UI > Settings > CI/CD > Variables

### Pipeline fails with connection errors

**Cause:** Wrong database URL format or credentials

**Fix:** Verify connection string format:
```
postgresql://username:password@hostname:5432/database_name
```

Test connection:
```bash
psql "postgresql://username:password@hostname:5432/database_name"
```

### Variables not picked up in pipeline

**Cause:** Variable name mismatch, masked value rejected by GitLab, or the variable was added at the wrong scope

**Fix:**
- Confirm the variable exists on the project used by this pipeline
- For the `dev` branch, keep required build variables non-protected
- Re-run the pipeline after saving the variable

## See Also

- [Spring Cloud Config Documentation](./SPRING_CLOUD_CONFIG.md) - Full config server setup guide
- [GitLab CI Setup](../deployment/GITLAB_CI_SETUP.md) - Complete CI/CD configuration
- [Environment Variables Guide](../../.env.example) - All available environment variables
