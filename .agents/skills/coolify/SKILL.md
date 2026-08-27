---
name: coolify
description: Manage, deploy, configure environment variables, and inspect build logs on Coolify v4 instances via API
---

# Coolify Management Skill

This skill provides utilities to interact directly with the Coolify v4 API to create applications, configure SSH deploy keys with GitHub, set/add environment variables, update domains, trigger builds, and monitor deployment logs.

## Quick CLI Usage

Run with `bun`:

```bash
# List all apps
bun run .agents/skills/coolify/scripts/coolify-cli.ts apps

# Get status of a specific application
bun run .agents/skills/coolify/scripts/coolify-cli.ts app <app_uuid>

# List environment variables for an application
bun run .agents/skills/coolify/scripts/coolify-cli.ts envs <app_uuid>

# Update an existing environment variable
bun run .agents/skills/coolify/scripts/coolify-cli.ts set-env <app_uuid> <KEY> <VALUE>

# Register a new environment variable
bun run .agents/skills/coolify/scripts/coolify-cli.ts add-env <app_uuid> <KEY> <VALUE>

# Configure domain and update auth/proxy routes
bun run .agents/skills/coolify/scripts/coolify-cli.ts set-domain <app_uuid> <https://domain.com>

# Trigger deployment
bun run .agents/skills/coolify/scripts/coolify-cli.ts deploy <app_uuid>

# Check recent deployments
bun run .agents/skills/coolify/scripts/coolify-cli.ts deployments

# Inspect deployment logs
bun run .agents/skills/coolify/scripts/coolify-cli.ts logs <deployment_uuid>

# Check live backend health
bun run .agents/skills/coolify/scripts/coolify-cli.ts health <domain_or_url>

# Link a new private GitHub repo with an SSH deploy key
bun run .agents/skills/coolify/scripts/coolify-cli.ts setup-deploy-key <owner/repo>
```

## Environment Configuration

Configure the following environment variables in your shell or `.env` file:
- `COOLIFY_API_URL`: Base API URL
- `COOLIFY_API_TOKEN`: Your Coolify API Bearer token

## Gotchas (learned live)

- **`set-domain` is broken for docker-compose apps.** `fqdn` returns 422 ("not allowed") and `docker_compose_domains` must be an **array of objects**, not a JSON string. Use the API directly:
  ```bash
  PATCH /applications/<uuid>
  {"docker_compose_domains":[{"name":"<service_name>","domain":"https://domain.com:3000"}]}
  ```
  Then set `BETTER_AUTH_URL` and `SERVICE_FQDN_SPACES_3000` via PATCH `/applications/<uuid>/envs`. Service name comes from the compose file (e.g. `spaces`).
- **Repo `.env` gotchas:** values may be wrapped in double quotes (strip with `replace(/^"+|"+$/g,'')`) and the file may use `\r` line endings that break `export $(cat .env)`. Parse line-by-line with a regex instead of shell-sourcing.
- **`envs` CLI output never includes the `value` field** — use it only for key lists, not to read values.
- **503 "no available server"** on a public domain behind Cloudflare usually means Traefik has **no router for that host** (domain not assigned to any app), not a tunnel/Cloudflare problem. Adding a `*.therry.dev` wildcard DNS doesn't create a router.
