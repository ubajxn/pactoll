# CRM Dashboard

## Scope and limitations

A single-company CRM with accounts, contacts, USD opportunities, tasks, shared record lists, notes, team invitations and AI chat with inline `@` record mentions. Next.js serves the UI and chat; a Bun API persists data in PostgreSQL and authenticates email links with Better Auth.

There is no demo identity or sample data. The first verified signup claims the installation and becomes its owner; later new accounts need an email-matching invitation. CRM records are shared with company members. Conversations are private to their creator, who can grant teammates view-only access. AI record changes require explicit approval.

Buyers supply production PostgreSQL, SMTP delivery, HTTPS hosting and an optional AI provider. This release has no workspace switching, account deletion, email changes, outbound CRM messaging or deployment pipeline. Active chat streams use one Next.js process: serverless execution and multiple frontend instances are unsupported without replacing the in-process stream registry.

## Requirements and setup

Use Bun 1.3.8 or newer, Node.js 20.9 or newer, and Docker with Compose on macOS or Linux. Bun is the supported package manager; retain `bun.lock`. Font loading through `next/font/google` requires Google Fonts access during a build; fonts are served locally at runtime.

```sh
bun install --frozen-lockfile
bun dev
```

The launcher starts PostgreSQL and Mailpit, applies migrations and runs the API (3001) and frontend (3000). Open [the CRM](http://localhost:3000) and follow your email link in [Mailpit](http://localhost:8025). Mailpit captures mail locally; it does not deliver to real inboxes. Invite additional accounts from **Settings → Team**.

Defaults need no `.env`. Copy [.env.example](.env.example) to `.env` for overrides, including occupied service ports. Always use the configured `BETTER_AUTH_URL`: `localhost` and `127.0.0.1` have different cookie origins. Ctrl-C stops the app processes; `bun run services:down` stops containers and preserves volumes. See [the backend guide](docs/BACKEND.md) for separate-process commands, configuration and migration/backup precautions.

## Customization

- Branding: [platform identity](src/components/crm/platform-identity.tsx), [page metadata and font](src/app/layout.tsx), [favicon](src/app/icon.svg) and [email templates](backend/email.ts). There are no supplied stock photos or portfolio assets.
- Visuals: [theme tokens](src/app/globals.css) and [UI primitives](src/components/ui). Keep the light/dark palettes, control sizes and responsive detail-panel geometry together. Static variants use Tailwind utilities with the existing CVA and class-merging helpers.
- Records: [validated contracts](src/lib/data/contracts.ts), [domain service](src/lib/data/service.ts), [database read paths](backend/read-service.ts) and [record fields](src/components/crm/inline-record-fields.tsx). Schema changes may also require a **new** [SQL migration](backend/migrations); never edit an applied migration.
- AI: [model factory](src/lib/chat/model.ts) and [tools](src/lib/chat/tools.ts). Configure `AI_BASE_URL`, `AI_MODEL` and optional `AI_API_KEY` on the server. The default points to a local OpenAI-compatible endpoint at `http://localhost:1234/v1`; it supplies no model. Choose a model with tool-calling support. `AI_ENABLED=false` disables generation and keeps saved history readable.

## Validation

Start the database first (`bun run services:up`). The test database account must be able to create and drop temporary databases; set `CRM_TEST_DATABASE_URL` if different from the local default. Tests do not reset the developer database. Chat/provider tests use injected callbacks and do not establish live-provider readiness.

```sh
bun run lint
bun run typecheck
bun test
bun run build
```

`bun test` includes backend, chat, CRM interaction, utility, packaging and development-process tests. Focused commands remain available as `bun run test:data`, `bun run test:chat` and `bun run test:dev`. Run the development tests without another Next.js development process using this checkout.

Validate the extracted customer archive with a locked install and these checks, then smoke-test the production processes below. Verify email signup/invitations, CRUD/lists/notes, persisted reloads, revoked access, chat mentions/approvals/stop/reconnect, disabled AI and provider failures. Check desktop/mobile layouts, the 768px sidebar and 1024px detail-panel breakpoints, keyboard/focus, reduced motion and console/network failures. Verify real SMTP delivery and your chosen AI provider separately.

## Production and deployment

Run one Next.js process and one Bun API on the same host or shared network namespace; the API binds to `127.0.0.1`. Use persistent PostgreSQL and real SMTP. The development Compose file and Mailpit are not a production deployment.

Set these **server-only** variables in both process environments:

| Variable | Required value |
| --- | --- |
| `DATABASE_URL` | Production PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Unique secret of at least 32 characters, stable across restarts |
| `BETTER_AUTH_URL` | Exact public HTTPS origin, such as `https://crm.example.com` |
| `CRM_BACKEND_URL` | Internal API origin, such as `http://127.0.0.1:3001`; identical at build and runtime |
| `SMTP_HOST`, `SMTP_PORT`, `EMAIL_FROM` | Delivering SMTP service and sender |

Set `SMTP_USER`, `SMTP_PASSWORD` and `SMTP_SECURE` as required by the mail service. Configure AI separately or set `AI_ENABLED=false`. Keep credentials out of browser variables and Git.

```sh
bun install --frozen-lockfile
bun run build
NODE_ENV=production bun backend/server.ts
```

Start the frontend in a second supervised process with the same environment:

```sh
bun run start --hostname 127.0.0.1 --port 3000
```

The API applies immutable, versioned migrations at startup; `bun run db:init` applies them separately if needed. Back up PostgreSQL before upgrades. Put an HTTPS reverse proxy in front of Next.js, preserve the public Host/protocol, disable response buffering for chat, and configure request limits and client rate limiting. Keep the API/database private. Allow in-flight responses to drain on shutdown. See [operating details](docs/BACKEND.md) for the shared internal auth rate-limit bucket and stream-recovery limits.

Before public access, claim the first account and confirm real sign-in/invitation delivery. Test through the public HTTPS URL, including chat response control.

`bun run package:release` writes `release/crm-dashboard.tar.gz` from an explicit source allowlist. It includes tests, configuration, migrations and any supplied notices; it excludes dependencies, caches, secrets, local databases/backups and verification output. It requires `tar`. Update [the packager](tools/release/package.ts) when adding a new source root or root configuration file, and inspect the archive before sale. Do not zip the working directory.
