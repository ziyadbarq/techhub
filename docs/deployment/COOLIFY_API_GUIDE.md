# Coolify API Guide

**Version**: 4.0.0-beta.473 (self-hosted)
**Base URL**: `http://localhost:8000/api/v1` (from the host) or `http://10.100.1.247:8000/api/v1` (from LAN)
**Auth**: `Authorization: Bearer <token>` header on every request

API token is stored in memory. See `MEMORY.md` → Coolify API Access.

---

## Key Gotchas (Learned the Hard Way)

- **Deploy trigger is NOT** `POST /applications/{uuid}/deploy` → returns 404
- **Correct deploy trigger**: `GET /api/v1/deploy?uuid={uuid}&force=true`
- **Env var upsert**: `PATCH /applications/{uuid}/envs` works for both create and update (not POST for create)
- **Container hostname** for internal services is the **UUID** (e.g. `ipl8ium6pqthcsxwwvn87yn2`), not the service name you give it in the UI
- All state-change calls (start/stop/restart/deploy) return immediately — the action is **queued**
- `POST /applications/{uuid}/restart` triggers a **full rebuild**, not just a container bounce, if config changed
- `PATCH /applications/{uuid}` returns `{"uuid": "..."}` on success (not the full object)

---

## Our Resources

| Resource | UUID | Type |
|---|---|---|
| techhub app (prod) | `g4t9w9azoiibhq4nujaboowh` | Application — port 3001 |
| techhub app (dev) | `h1ovgdnmsjtw340pxcusaku8` | Application — port 3002 |
| techhub-postgres (prod) | `ipl8ium6pqthcsxwwvn87yn2` | PostgreSQL — db: techhub |
| techhub-postgres-dev | `vbgziksy9u9bm2tmspvvv8dx` | PostgreSQL — db: techhub_dev |
| techhub-redis (shared) | `ye2jffyu0owimrg871c0pus5` | Redis — prod: db 0, dev: db 1 |
| TechHub project | `h1uc6qz1wipfmm3v6zo7xxiv` | Project |
| production environment | `lydzrwda7bdr8ld90yk3l7er` | Environment (id: 2) |
| localhost server | `nee4he53z66rk2auwk8fh0if` | Server |
| coolify network | `roycht0q740tq5l8unc0hdz0` | Destination (Docker network) |
| gitlab-techhub key | `zvsyjx0m15cpf0e8p7g5gmv4` | Private SSH key |

## Bulk env var creation (for new apps)
```bash
# PATCH /envs only updates existing vars — use /envs/bulk to CREATE
curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": [{"key":"K","value":"V","is_buildtime":false,"is_runtime":true}]}' \
  http://localhost:8000/api/v1/applications/{uuid}/envs/bulk | jq '[.[] | {key,value}]'
```

---

## Applications

```bash
# List all applications
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/applications | jq .

# Get specific application
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/applications/{uuid} | jq .

# Update application config (ports, settings, etc.)
curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ports_mappings": "3001:3000"}' \
  http://localhost:8000/api/v1/applications/{uuid} | jq .
```

---

## Deployments

```bash
# Trigger a new deployment (CORRECT endpoint)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/deploy?uuid={app_uuid}&force=true" | jq .
# Returns: {"deployments": [{"deployment_uuid": "...", "message": "..."}]}

# Get deployment status + logs
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/deployments/{deployment_uuid} | jq '{status, logs}'

# List recent deployments for an app
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/deployments/applications/{app_uuid}?skip=0&take=5" | jq .
```

---

## Environment Variables

```bash
# List env vars
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/applications/{uuid}/envs | jq .

# Create or update a single env var (PATCH works for both)
curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"MY_VAR","value":"my_value","is_buildtime":false,"is_runtime":true}' \
  http://localhost:8000/api/v1/applications/{uuid}/envs | jq '{key,value,is_buildtime,is_runtime}'

# Delete an env var
curl -s -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/applications/{uuid}/envs/{env_uuid}
```

**Buildtime vs Runtime rules:**
- `NEXT_PUBLIC_APP_URL`: `is_buildtime: true, is_runtime: true` (embedded in client bundle)
- All secrets (`BETTER_AUTH_SECRET`, `ENCRYPTION_KEY`, `DATABASE_URL`, `REDIS_URL`, etc.): `is_buildtime: false, is_runtime: true`

---

## Application Lifecycle

```bash
# Start
curl -s -X GET -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/applications/{uuid}/start | jq .

# Stop
curl -s -X GET -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/applications/{uuid}/stop | jq .

# Restart (triggers full rebuild if config changed — use deploy endpoint instead for code deploys)
curl -s -X GET -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/applications/{uuid}/restart | jq .
```

---

## Databases

```bash
# List all databases
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/databases | jq '[.[] | {uuid,name,status,image}]'

# Get specific database (internal_db_url contains the correct connection string)
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/databases/{uuid} | jq '{uuid,name,status,internal_db_url}'

# Create PostgreSQL under a project
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-postgres",
    "project_uuid": "{project_uuid}",
    "environment_name": "production",
    "server_uuid": "{server_uuid}",
    "destination_uuid": "{destination_uuid}",
    "postgres_user": "myuser",
    "postgres_db": "mydb",
    "instant_deploy": true
  }' \
  http://localhost:8000/api/v1/databases/postgresql | jq .
# Returns: {"uuid": "...", "internal_db_url": "postgres://...@{uuid}:5432/mydb"}

# Create Redis under a project
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-redis",
    "project_uuid": "{project_uuid}",
    "environment_name": "production",
    "server_uuid": "{server_uuid}",
    "destination_uuid": "{destination_uuid}",
    "instant_deploy": true
  }' \
  http://localhost:8000/api/v1/databases/redis | jq .
# Returns: {"uuid": "...", "internal_db_url": "redis://default:{password}@{uuid}:6379/0"}

# Start / Stop database
curl -s -X GET -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/databases/{uuid}/start | jq .
curl -s -X GET -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/databases/{uuid}/stop | jq .

# Delete database
curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/databases/{uuid} | jq .
```

> **Important**: The `internal_db_url` returned at creation uses the container **UUID** as hostname (e.g. `@ipl8ium6pqthcsxwwvn87yn2:5432`). Always use this URL — not a name-based hostname — for `DATABASE_URL` / `REDIS_URL` env vars.

---

## Projects & Environments

```bash
# List projects
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/projects | jq '[.[] | {id,uuid,name}]'

# Get project with environments
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/projects/{uuid} | jq '{uuid,name,environments}'
```

---

## Services (One-Click)

```bash
# List services
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/services | jq '[.[] | {uuid,name,status}]'
```

---

## Networking Notes

- All Coolify-managed resources are on the `coolify` Docker bridge network
- Internal hostnames are container UUIDs — resolvable only from within the `coolify` network
- The app, postgres, and redis are all on `coolify` network → they can reach each other by UUID hostname
- Port mappings (`ports_mappings: "3001:3000"`) bind to `0.0.0.0` on the host, bypassing Traefik
- Traefik is configured but currently `exited` (port 80 conflict with server-landing-page nginx)
