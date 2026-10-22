<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project constraints

This project is a CRM with a Bun/PostgreSQL backend and Better Auth email-link
accounts. Docker Compose supplies Postgres and Mailpit for
local development. Components use frontend-owned contracts and the authenticated
same-origin HTTP adapter; never import backend modules into UI code. The memory
adapter exists only for isolated tests.
There is no runtime demo identity, seeded team, or unauthenticated data fallback.
Each installation has one company: the first verified signup atomically creates
its workspace and owner; later signups require an email-matching invitation link.
Do not expose workspace creation or switching. CRM records belong to that workspace;
conversations belong to a user within it. The owner can grant selected teammates view-only chat access;
all chat writes, sharing changes and response control remain owner-only.
Enforce sessions, membership and the relevant read/owner permission on every server data path,
including chat generation/resume/stop. Verify provider-dependent states with
injected callbacks; never present simulations as real provider outcomes.

The active scope is CRM essentials plus AI chat with inline record mentions.
Inspect the current implementation and the relevant operational documentation
before making changes. Verify behavior with focused tests and checks.

## Customization and release checks

README.md owns setup, customization, validation and deployment; docs/BACKEND.md
owns origin/cookie hazards, permissions, migration/backup and stream-recovery limits.
Use Bun and bun.lock. Run `bun run lint`, `bun run typecheck`, `bun test` and
`bun run build`; tests require PostgreSQL with temporary-database permissions.
Provider tests use injected callbacks; verify live SMTP/AI separately.

Use Tailwind utilities and complete static variant strings for ordinary styling.
Preserve the neutral light/dark tokens in src/app/globals.css, Inter typography,
control proportions, the 768px sidebar and 1024px detail-panel breakpoints, focus
states and reduced motion. Keep the scoped CSS that reserves collection space for
intercepted record panels; its geometry is coupled across the shell and collection.
Retain Base UI accessibility, existing CVA variants and caller class overrides.

Never edit an applied SQL migration. Keep credentials and local backend/data out
of customer packages, and preserve backups. tools/release/package.ts owns the
source archive allowlist; update it for new source roots/root configuration.
