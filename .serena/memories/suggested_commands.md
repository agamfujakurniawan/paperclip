# Suggested Commands

Install and dev:
- `pnpm install`
- `pnpm dev` or `pnpm dev:watch`: start managed dev server with watch.
- `pnpm dev:once`: run dev server without watch; auto-applies pending local migrations by default.
- `pnpm dev:list`: inspect managed dev runner.
- `pnpm dev:stop`: stop managed dev runner.
- `pnpm dev:server`: server-only dev.
- `pnpm dev:ui`: UI-only dev.

Local URLs and health checks:
- Default upstream docs say API/UI use `http://localhost:3100`.
- Fork notes say this fork may auto-detect `3101+` if `3100` is already taken.
- `curl http://localhost:3100/api/health`
- `curl http://localhost:3100/api/companies`

Testing and verification:
- Cheap default: `pnpm test` (`pnpm test:run`).
- Watch: `pnpm test:watch`.
- Browser suites only when relevant: `pnpm test:e2e`, `pnpm test:release-smoke`.
- PR-ready broad gate: `pnpm -r typecheck`, `pnpm test:run`, `pnpm build`.
- UI targeted: `pnpm --filter @paperclipai/ui typecheck`; build with fork note `node node_modules/vite/bin/vite.js build` rather than `npx vite build` on NTFS.
- Adapter targeted examples: `pnpm --filter @paperclipai/adapter-utils typecheck`, `pnpm --filter @paperclipai/adapter-claude-local typecheck`, `pnpm --filter @paperclipai/adapter-codex-local typecheck`.
- Plugin SDK targeted: `pnpm --filter @paperclipai/plugin-sdk typecheck`, `pnpm --filter @paperclipai/plugin-sdk build`.

DB and migrations:
- Leave `DATABASE_URL` unset for embedded Postgres.
- `pnpm db:generate`: generate Drizzle migration after schema changes.
- `pnpm db:migrate`: apply migrations.
- `pnpm issue-references:backfill`: backfill historical issue references after relevant migration.
- `pnpm db:backup` or `pnpm paperclipai db:backup`: run logical DB backup.
- `pnpm secrets:migrate-inline-env` and `pnpm secrets:migrate-inline-env --apply`: migrate inline env secrets to secret refs.

CLI operations:
- `pnpm paperclipai run`: one-command local run/onboard/doctor/server.
- `pnpm paperclipai configure --section storage|database|secrets`
- `pnpm paperclipai doctor --repair`
- `pnpm paperclipai issue list --company-id <company-id>`
- `pnpm paperclipai issue create --company-id <company-id> --title "..."`
- `pnpm paperclipai issue update <issue-id> --status in_progress --comment "..."`
- `pnpm paperclipai context set --api-base http://localhost:3100 --company-id <company-id>`
- `pnpm paperclipai allowed-hostname <hostname>`

Worktree-local instances:
- `pnpm paperclipai worktree init`
- `pnpm paperclipai worktree:make <name>`
- `pnpm paperclipai worktree repair`
- `pnpm paperclipai worktree reseed --from current --to <worktree> --seed-mode full --yes`
- `pnpm paperclipai worktree env` or `pnpm paperclipai worktree env --json`
- Important: use Paperclip CLI for worktree/DB operations; do not manually copy DBs or run raw postgres commands.

Storybook/docs/smoke:
- `pnpm storybook`
- `pnpm build-storybook`
- `pnpm docs:dev`
- `pnpm smoke:openclaw-join`
- `pnpm smoke:openclaw-docker-ui`
- `pnpm smoke:terminal-bench-loop-skill`

Fork-specific local dev notes:
- Server startup from NTFS can take 30-60s; do not assume immediate failure.
- Kill all Paperclip processes before starting if needed: fork doc uses Unix commands `pkill -f "paperclip"; pkill -f "tsx.*index.ts"`, but on Windows use appropriate process tooling.
- Vite cache may survive dist deletion; delete both `ui/dist` and `ui/node_modules/.vite` when needed.

Git:
- `git status --short --branch`
- `git remote -v`
- Push feature branches to user fork when a fork remote exists; current observed `origin` is user fork `agamfujakurniawan/paperclip`.
- Do not commit/push secrets or local config.