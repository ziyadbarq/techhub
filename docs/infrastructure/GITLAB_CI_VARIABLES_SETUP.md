# GitLab CI/CD Variables Setup Checklist

## Current Status

❌ **Spring Cloud Config Server is NOT YET DEPLOYED**

For now, you must use direct GitLab CI/CD variables.

## Required Variables (Add Now)

Go to: **GitLab UI > Project > Settings > CI/CD > Variables > Add variable**

### Option A: Build-Only (Docker Image Creation)

**Use this if you only need to build the Docker image without running migrations/seeds:**

| Variable Name         | Description                          | Example Value                              | Protected | Masked |
|-----------------------|--------------------------------------|--------------------------------------------|-----------|--------|
| `DATABASE_URL`        | Dummy PostgreSQL URL (build only)   | `postgresql://dummy:dummy@localhost:5432/dummy` | No    | No |

**Why this works:**
- Prisma `generate` validates URL format but doesn't connect
- TypeScript compilation uses generated types, no connection needed
- Next.js build bundles code, no database access during build

### Option B: Full CI/CD (Build + Deploy + Migrations)

**Use this if you need to run migrations, seeds, or deploy to environments with real databases:**

| Variable Name         | Description                          | Example Value                              | Protected | Masked |
|-----------------------|--------------------------------------|--------------------------------------------|-----------|--------|
| `DATABASE_URL`        | Real PostgreSQL connection string    | `postgresql://user:pass@host:5432/techhub` | ✅ Yes    | ✅ Yes |
| `REDIS_URL`           | Redis connection string              | `redis://redis-host:6379`                  | ✅ Yes    | ✅ Yes |
| `BETTER_AUTH_URL`     | Application URL                      | `https://techhub.baraq.com`                | No        | No     |
| `BETTER_AUTH_SECRET`  | Auth secret key (generate random)    | `[64-char random string]`                  | ✅ Yes    | ✅ Yes |

### Authentication Variables

| Variable Name             | Description                    | Example Value                          | Protected | Masked |
|---------------------------|--------------------------------|----------------------------------------|-----------|--------|
| `MICROSOFT_CLIENT_ID`     | Azure AD app client ID         | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | No        | ✅ Yes |
| `MICROSOFT_CLIENT_SECRET` | Azure AD app client secret     | `[secret value]`                       | ✅ Yes    | ✅ Yes |
| `MICROSOFT_TENANT_ID`     | Azure AD tenant ID             | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | No        | No     |

### Optional Variables

| Variable Name            | Description                     | Example Value               | Protected | Masked |
|--------------------------|---------------------------------|-----------------------------|-----------|--------|
| `OPENAI_API_KEY`         | OpenAI API key (if using AI)    | `sk-...`                    | ✅ Yes    | ✅ Yes |
| `LOG_LEVEL`              | Logging level                   | `info` or `debug`           | No        | No     |
| `NODE_ENV`               | Node environment                | `production`                | No        | No     |

## Quick Add Commands (CLI)

If you have GitLab CLI configured:

```bash
# Critical variables
glab variable create DATABASE_URL --value "postgresql://user:pass@host:5432/techhub" --masked --protected
glab variable create REDIS_URL --value "redis://redis-host:6379" --masked --protected
glab variable create BETTER_AUTH_URL --value "https://techhub.baraq.com"
glab variable create BETTER_AUTH_SECRET --value "$(openssl rand -hex 32)" --masked --protected

# Auth variables
glab variable create MICROSOFT_CLIENT_ID --value "your-client-id" --masked
glab variable create MICROSOFT_CLIENT_SECRET --value "your-client-secret" --masked --protected
glab variable create MICROSOFT_TENANT_ID --value "your-tenant-id"

# Optional
glab variable create OPENAI_API_KEY --value "sk-your-key" --masked --protected
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
✅ Created .env with DATABASE_URL from GitLab CI variables
```

If you see this error instead:
```
❌ ERROR: DATABASE_URL not set in CI environment
```

Then `DATABASE_URL` is missing from GitLab CI/CD variables.

## Future: Spring Cloud Config

Once Spring Cloud Config Server is deployed:

1. **Add CONFIG_SERVER_URL variable:**
   ```bash
   glab variable create CONFIG_SERVER_URL --value "http://config-server.baraq.com:8888"
   ```

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

**Cause:** Variables might be protected and branch is not protected

**Fix:** Either:
- Make variables non-protected (if not sensitive)
- Protect the branch (Settings > Repository > Protected branches)

## See Also

- [Spring Cloud Config Documentation](./SPRING_CLOUD_CONFIG.md) - Full config server setup guide
- [GitLab CI Setup](../deployment/GITLAB_CI_SETUP.md) - Complete CI/CD configuration
- [Environment Variables Guide](../../.env.example) - All available environment variables
