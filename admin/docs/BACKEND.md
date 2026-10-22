# Backend operations

[README](../README.md) owns setup, customization, validation and deployment. This guide covers operational constraints for the Bun API, PostgreSQL and Better Auth.

## Services and configuration

| Command | Purpose |
| --- | --- |
| `bun run services:up` | Start PostgreSQL and Mailpit only |
| `bun run services:down` | Stop containers, retain named volumes |
| `bun run dev:backend` | Run the API watcher against already-running services |
| `bun run dev:frontend` | Run Next.js against an already-running API |
| `bun run db:init` | Apply migrations without seeding |

Bun loads `.env`; the combined development launcher forwards its environment to Next.js. For separate production processes, supply the same deployment environment to both.

| Configuration | Behavior |
| --- | --- |
| `DATABASE_URL` | Server-only PostgreSQL URL; development defaults to `postgres://crm:crm_local@127.0.0.1:5432/crm` |
| `POSTGRES_PORT` | Local Compose port and default database URL port |
| `MAILPIT_SMTP_PORT`, `MAILPIT_UI_PORT` | Local SMTP/UI ports, default 1025/8025 |
| `PORT`, `CRM_BACKEND_PORT` | Frontend/API ports, default 3000/3001 |
| `CRM_BACKEND_URL` | Next.js internal API URL; keep build/runtime values identical |
| `BETTER_AUTH_URL` | Exact canonical browser origin; defaults to `http://localhost:3000` (or `PORT`); HTTPS is required in production |
| `BETTER_AUTH_SECRET` | At least 32 characters; production requires it explicitly |
| `SMTP_HOST`, `SMTP_PORT`, `EMAIL_FROM` | Production requires host/sender; set the provider's port explicitly |
| `SMTP_SECURE` | `true` selects implicit TLS; otherwise the SMTP transport can negotiate STARTTLS |
| `SMTP_USER`, `SMTP_PASSWORD` | Optional SMTP credentials |
| `CRM_MANAGE_SERVICES=false` | Skip automatic Compose startup; required services must already be reachable |
| `CRM_TEST_DATABASE_URL` | Test administrator URL with create/drop database permission; defaults to the local database URL |

Development generates a persistent random secret at ignored `backend/data/auth-secret` with owner-only permissions. Local email defaults to Mailpit on loopback without credentials or encryption. Anyone with access to Mailpit can read its sign-in links. Compose publishes only to loopback and uses persistent named volumes. `docker compose down -v` deletes the local database and captured mail; ordinary shutdown never does.

The frontend proxies `/api/auth/*` and `/api/crm/*` to the internal service through [Next.js rewrites](../next.config.ts). The API rejects foreign origins. Its auth limiter uses the loopback connection address, ignoring client-supplied IP headers, so proxied traffic shares a per-path bucket (magic-link requests: five per minute). Configure public client rate limiting at the trusted reverse proxy; IP-aware backend limits require an explicitly designed trusted-proxy boundary.

## Accounts and permissions

Each installation has one company. The first verified signup creates its company and owner atomically. Later new accounts require the invitation link and matching email; existing accounts can sign in directly. Invitation signup permission is bound to a hashed magic-link token and checked again at account creation. Canceled/expired invitations and edited callback URLs cannot authorize signup. Membership still requires explicit invitation acceptance.

Sign-in links are hashed, expire after 15 minutes and are consumed once. Persisted sessions last seven days. Sign-out invalidates them; cookie caching is disabled so permissions use current database state. Protected deep links survive login. Nonmembers see an invitation-required screen, and browser account changes clear the previous user's shell/chat state.

All members share CRM records and lists. Lists support accounts, contacts and opportunities; their record type is immutable. Deleting a list preserves its records. Record references in relationships or private chats can prevent deletion without exposing private chat content.

Owners/admins manage invitations and membership; owners can grant ownership. Invitations expire after seven days and can be resent/canceled. Delivery failures are reported; a pending invitation saved before SMTP failure can be resent. The database prevents removing/demoting the final owner. Membership removal revokes access and clears owner/assignee foreign keys; accounts and company records remain. Workspace creation, switching and deletion are unavailable.

Conversations are private to their creator. Explicit shares grant selected current members read-only access. Only the creator can write messages, manage shares, approve mutations or generate/resume/stop responses. Membership removal revokes shares. Every CRM and chat server path checks current session, membership and the relevant access permission. Detached generation saves forward the initiating session and fail after access is revoked.

Profile names/photos come from current accounts. Photos are cropped in the browser to 72×72 WebP, validated with a 24 KB server limit and stored in `user.image`; removing a photo restores initials. Profile email changes and account deletion are not exposed.

## Persistence, upgrades and recovery

[Ordered SQL migrations](../backend/migrations) apply under a transaction/advisory lock. Checksums reject edits to applied migrations: add a new migration instead. Startup never seeds or resets data. Use `pg_dump`/`pg_restore` against the configured database and test restoration before an upgrade.

The single-company migration preserves a valid existing company and its records. It completes a legacy installation with no company for the earliest verified account. Multiple legacy companies or a genuinely ownerless company stop the upgrade without merging/deleting data; back up and explicitly repair the installation first. The durable installation row and unique organization index serialize first signup across processes/restarts.

JSONB payloads hold record data while relational columns/foreign keys enforce company, member, record and message boundaries. Per-company transaction locks prevent lost updates; read snapshots are consistent. [Frontend contracts](../src/lib/data/contracts.ts) validate inputs; [the domain service](../src/lib/data/service.ts), [database adapter](../backend/db.ts) and [scoped reads](../backend/read-service.ts) enforce persistence and permissions. UI code must never import backend modules; the memory adapter is for isolated tests only.

AI configuration is in [.env.example](../.env.example) and [the model factory](../src/lib/chat/model.ts). [Stream recovery](../src/lib/chat/stream-store.ts) lives in one Next.js process. Browser disconnection can reconnect while that process survives; a process restart loses its active replay/recovery registry. PostgreSQL retains saved messages and partial checkpoints, but provider work is not resumed across restarts. Supervise one frontend process and drain active work before restarting. There is no distributed stream store or serverless deployment mode.
