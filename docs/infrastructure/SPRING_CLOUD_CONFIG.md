# Spring Cloud Config Integration

## Overview

TechHub integrates with Spring Cloud Config Server for centralized configuration management. This allows environment-specific configuration to be managed externally and loaded at application startup.

**Key Features:**
- ✅ Zero-breaking-changes integration with existing T3 Env validation
- ✅ Graceful fallback to local `.env` files if config server is unavailable
- ✅ Automatic profile detection from `NODE_ENV` (development→dev, production→prod)
- ✅ Retry logic with exponential backoff (3 attempts, 5-second timeout)
- ✅ Validation of critical environment variables
- ✅ CI/CD support with environment detection

## Architecture

### Configuration Loading Flow

```
Next.js loads .env files
  ↓
instrumentation.ts (runs once at startup)
  ├─ Check if CONFIG_SERVER_URL is set
  ├─ Fetch from Spring Cloud Config Server
  ├─ Merge with process.env (server takes precedence)
  └─ Validate critical env vars
  ↓
T3 Env validates merged config (UNCHANGED)
  ↓
DI Container initializes (UNCHANGED)
  ↓
Application serves requests (UNCHANGED)
```

### Profile Mapping

| NODE_ENV    | Spring Profile |
|-------------|----------------|
| production  | prod           |
| development | dev            |
| test        | dev            |

**Override:** Set `SPRING_PROFILE` environment variable to explicitly specify the profile.

## Setup

### 1. Environment Variables

Add to your `.env.local`:

```bash
# Spring Cloud Config Server (optional)
CONFIG_SERVER_URL=http://config-server.baraq.com:8888

# Optional: Override automatic profile detection
SPRING_PROFILE=dev  # Options: dev, uat, prod
```

**Feature Flag:** If `CONFIG_SERVER_URL` is not set, the integration is disabled and only local `.env` files are used.

### 2. Config Server Setup

The config server should expose configuration for the `techhub` application:

```
GET http://config-server.baraq.com:8888/techhub/dev
GET http://config-server.baraq.com:8888/techhub/uat
GET http://config-server.baraq.com:8888/techhub/prod
```

Configuration format should use either:
- Dot notation: `database.url=postgres://...`
- Environment variable format: `DATABASE_URL=postgres://...`

Both formats are automatically converted to uppercase-with-underscores format.

### 3. Critical Environment Variables

The following variables are validated at startup:
- `DATABASE_URL`
- `REDIS_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`

If any are missing after config loading, warnings/errors will be logged.

## Verification

### Quick Health Check

Run the verification script to test your config server setup:

```bash
npm run config:verify
```

This runs 5 checks:
1. ✅ CONFIG_SERVER_URL is set
2. ✅ CONFIG_SERVER_URL is valid URL
3. ✅ Can connect to config server (health endpoint)
4. ✅ Can load configuration for current profile
5. ✅ Critical environment variables are present

**Test specific profile:**
```bash
dotenv -e .env.local -- tsx scripts/config/verify-cloud-config.ts --profile=prod
```

### Manual Testing

**Test 1: Config server available**
```bash
export CONFIG_SERVER_URL=http://config-server.baraq.com:8888
npm run dev
```

**Test 2: Config server unavailable (graceful fallback)**
```bash
export CONFIG_SERVER_URL=http://localhost:9999  # Non-existent server
npm run dev  # Should fallback to .env.local
```

**Test 3: Config server disabled**
```bash
unset CONFIG_SERVER_URL
npm run dev  # Should use .env.local only
```

## Startup Logs

### Successful Load
```
=== Spring Cloud Config Integration ===
📦 Application: techhub
🏷️  Profile: dev
🌐 Config Server: http://config-server.baraq.com:8888
🔧 Loading config from Spring Cloud Config Server: http://config-server.baraq.com:8888/techhub/dev
   Attempt 1/3...
✅ Config loaded successfully from config server (42 keys)
✅ Config loaded from config-server: 42 keys loaded
   Profile: dev
   Retry attempts: 1
   Loaded at: 2025-01-11T20:00:00.000Z
   Sample keys: DATABASE_URL, REDIS_URL, BETTER_AUTH_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY...
✅ All critical environment variables are present
=======================================
```

### Graceful Fallback
```
=== Spring Cloud Config Integration ===
📦 Application: techhub
🏷️  Profile: dev
🌐 Config Server: http://config-server.baraq.com:8888
🔧 Loading config from Spring Cloud Config Server: http://config-server.baraq.com:8888/techhub/dev
   Attempt 1/3...
   ⚠️  Attempt 1/3 failed: connect ECONNREFUSED
   ⏳ Retrying in 100ms...
   Attempt 2/3...
   ⚠️  Attempt 2/3 failed: connect ECONNREFUSED
   ⏳ Retrying in 200ms...
   Attempt 3/3...
   ⚠️  Attempt 3/3 failed: connect ECONNREFUSED
❌ Failed to load config from server after 3 attempts. Using local .env fallback.
   Last error: connect ECONNREFUSED
⚠️  Config server unavailable, using local .env files as fallback
   Error: connect ECONNREFUSED
   Retry attempts: 3
✅ All critical environment variables found in local .env
=======================================
```

### Disabled
```
ℹ️  CONFIG_SERVER_URL not set, using local .env files only
```

## Error Handling

| Scenario                      | Behavior                                  |
|-------------------------------|-------------------------------------------|
| Config server unavailable     | Retry 3x, then fallback to .env          |
| Network timeout (5s)          | Retry with exponential backoff           |
| Invalid config values         | T3 Env validation fails → Stop startup   |
| CONFIG_SERVER_URL not set     | Skip config server, use .env only        |
| Missing critical env vars     | Log error, may fail T3 Env validation    |

**Principle:** Graceful degradation for config server connectivity, strict validation for configuration values.

## CI/CD Integration

### Current Status

**⚠️ Spring Cloud Config is NOT YET ACTIVE in CI/CD pipeline**

The application code supports Spring Cloud Config (via `instrumentation.ts`), but the CI/CD pipeline currently uses direct GitLab CI/CD variables. This is intentional to allow gradual migration.

### Migration Path

**Phase 1: Current (Direct Variables)**
```yaml
# GitLab CI/CD Variables (current setup)
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
BETTER_AUTH_URL=https://app.example.com
BETTER_AUTH_SECRET=xxx
```

**Phase 2: Hybrid (Both Sources)**
```yaml
# Add CONFIG_SERVER_URL alongside existing variables
CONFIG_SERVER_URL=http://config-server.baraq.com:8888

# Keep direct variables as fallback
DATABASE_URL=postgresql://user:pass@host:5432/db
...
```

**Phase 3: Config Server Only (Future)**
```yaml
# Only CONFIG_SERVER_URL needed
CONFIG_SERVER_URL=http://config-server.baraq.com:8888

# All other variables loaded from config server
```

### Setup Instructions

#### Option 1: Use Direct Environment Variables (Current)

**Recommended for now** until config server is deployed and tested.

1. Go to GitLab UI > Project > Settings > CI/CD > Variables
2. Add required variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `REDIS_URL` - Redis connection string
   - `BETTER_AUTH_URL` - Application URL
   - `BETTER_AUTH_SECRET` - Auth secret
   - Other app-specific variables

#### Option 2: Use Spring Cloud Config Server (Future)

**Prerequisites:**
- Config server deployed and reachable from GitLab runners
- Config server configured for `techhub` application
- Config server provides all required environment variables

**Steps:**

1. **Deploy Config Server**
   - Set up Spring Cloud Config Server at `http://config-server.baraq.com:8888`
   - Configure server to serve `techhub` application
   - Add profiles: `dev`, `uat`, `prod`

2. **Configure Application in Config Server**

   Create config files in your Git repo (or use Vault/etc.):
   ```
   techhub-dev.yml
   techhub-uat.yml
   techhub-prod.yml
   ```

   Example `techhub-dev.yml`:
   ```yaml
   database:
     url: postgresql://user:pass@dev-db:5432/techhub_dev
   redis:
     url: redis://dev-redis:6379
   better_auth:
     url: https://dev.techhub.baraq.com
     secret: dev_secret_here
   ```

3. **Test Config Server Manually**
   ```bash
   # Test from GitLab runner network
   curl http://config-server.baraq.com:8888/techhub/dev
   curl http://config-server.baraq.com:8888/actuator/health
   ```

4. **Add CONFIG_SERVER_URL to GitLab CI/CD**
   - Go to GitLab UI > Project > Settings > CI/CD > Variables
   - Add variable:
     - Name: `CONFIG_SERVER_URL`
     - Value: `http://config-server.baraq.com:8888`
     - Protected: Yes (optional)
     - Masked: No

5. **Gradual Migration**
   - Keep direct variables alongside `CONFIG_SERVER_URL` initially
   - Monitor CI pipeline logs for config loading success
   - Once stable, remove direct variables one-by-one

6. **Verify in CI**

   Check pipeline logs for:
   ```
   === Spring Cloud Config Integration ===
   📦 Application: techhub
   🏷️  Profile: dev
   🌐 Config Server: http://config-server.baraq.com:8888
   ✅ Config loaded from config-server: 42 keys loaded
   ✅ All critical environment variables are present
   =======================================
   ```

### Profile Detection in CI

| Branch      | NODE_ENV   | Spring Profile |
|-------------|------------|----------------|
| main        | production | prod           |
| develop     | development| dev            |
| feature/*   | development| dev            |

Override with `SPRING_PROFILE` GitLab CI variable if needed.

### Troubleshooting CI Issues

**Error: "DATABASE_URL not set in CI environment"**

This means neither direct variables nor config server provided `DATABASE_URL`.

**Solutions:**
1. Add `DATABASE_URL` directly to GitLab CI/CD variables (quick fix)
2. Set up config server and add `CONFIG_SERVER_URL` to GitLab variables
3. Verify config server is reachable from GitLab runners
4. Check config server logs for errors

**Config Server Unreachable from CI**

Common causes:
- Config server not running
- Network firewall blocking GitLab runners
- Wrong URL in `CONFIG_SERVER_URL` variable
- DNS resolution issues

**Test from runner:**
```yaml
test-config-server:
  stage: test
  script:
    - curl -v http://config-server.baraq.com:8888/actuator/health
    - curl -v http://config-server.baraq.com:8888/techhub/dev
```

## Troubleshooting

### Config server not loading

1. Verify `CONFIG_SERVER_URL` is set:
   ```bash
   echo $CONFIG_SERVER_URL
   ```

2. Test config server health:
   ```bash
   curl http://config-server.baraq.com:8888/actuator/health
   ```

3. Test config endpoint:
   ```bash
   curl http://config-server.baraq.com:8888/techhub/dev
   ```

4. Run verification script:
   ```bash
   npm run config:verify
   ```

### Critical variables missing

Check both sources:
1. Config server response: `curl http://config-server.baraq.com:8888/techhub/dev`
2. Local .env.local file

Variables from config server override local .env, so ensure critical vars are present in one of these sources.

### Wrong profile loaded

Check profile detection:
```bash
# Explicit override
export SPRING_PROFILE=prod

# Or let it auto-detect from NODE_ENV
export NODE_ENV=production  # → prod
export NODE_ENV=development # → dev
```

## Files

| File | Purpose |
|------|---------|
| [instrumentation.ts](/instrumentation.ts) | Next.js instrumentation hook (entry point) |
| [cloud-config-init.ts](/src/infrastructure/config/cloud-config-init.ts) | Orchestration and auto-execution |
| [cloud-config-loader.ts](/src/infrastructure/config/cloud-config-loader.ts) | Core loading logic with retry |
| [cloud-config.types.ts](/src/infrastructure/config/cloud-config.types.ts) | TypeScript interfaces |
| [verify-cloud-config.ts](/scripts/config/verify-cloud-config.ts) | Verification script |

## Performance

| Scenario | Startup Time Impact |
|----------|---------------------|
| Config server available (same datacenter) | +50-100ms |
| Config server available (network latency) | +100-200ms |
| Config server timeout (3 retries) | +15 seconds |
| Config server disabled | 0ms |

**Typical case:** 100-200ms additional startup time, acceptable for production deployments.

## Security

**Current:** No authentication (config server is internal-only)

**Future:** Add support for HTTP Basic Auth or token-based auth if needed:
```typescript
// In cloud-config-loader.ts
const configData = await load({
  endpoint: options.endpoint,
  name: options.name,
  profiles: options.profiles,
  auth: {
    user: process.env.CONFIG_SERVER_USER,
    pass: process.env.CONFIG_SERVER_PASSWORD,
  },
});
```

## See Also

- [T3 Env Documentation](./env.ts) - Environment variable validation
- [Instrumentation Docs](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation) - Next.js instrumentation hook
- [Spring Cloud Config](https://cloud.spring.io/spring-cloud-config/) - Config server documentation
