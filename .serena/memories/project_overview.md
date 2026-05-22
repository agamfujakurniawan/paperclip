# Paperclip Project Overview

Purpose: Paperclip is a control plane for autonomous AI-agent companies. One deployment can manage multiple companies; every core business entity is company-scoped. The V1 source of truth is `doc/SPEC-implementation.md`, with long-horizon context in `doc/SPEC.md`.

Core product model:
- Companies are first-class objects with goals, agents/employees, org structure, budgets, issues/tasks, approvals, activity, and work products.
- Paperclip is the control plane, not the execution plane. Agent runtimes run externally or through adapters and report back via heartbeats/API.
- Work is issue/comment/document-centric, not general chat-centric.
- V1 invariants: company boundaries, single-assignee issues, atomic checkout for `in_progress`, approval gates, budget hard-stop auto-pause, and activity logging for mutations.

Runtime architecture:
- `server/`: Express REST API, auth, orchestration, heartbeat execution, plugin runtime, adapter registry, Vite/static UI serving.
- `ui/`: React + Vite board UI for companies, dashboard, org/agents, issues, projects, approvals, costs, settings, plugins, and adapter manager.
- `packages/db/`: Drizzle schema, migrations, DB client, embedded Postgres support, backups.
- `packages/shared/`: shared constants, API paths, DTO types, Zod validators, issue reference helpers, workspace command helpers.
- `packages/adapters/`: built-in local/remote adapter packages for Claude, Codex, Cursor, OpenCode, Gemini, Grok, Pi, ACPx, OpenClaw, etc.
- `packages/adapter-utils/`: shared adapter contracts, execution targets, session management, sandbox/remote helpers, redaction utilities.
- `packages/plugins/`: plugin SDK, bundled examples, sandbox provider plugins.
- `cli/`: `paperclipai` CLI commands for run, doctor, worktrees, issue operations, plugin workflows, etc.
- `skills/` and `.agents/skills/`: operational/agent procedures used by Paperclip agents and project workflows.

Important entrypoints:
- Server startup: `server/src/index.ts` (`startServer`) initializes config, DB/migrations, embedded Postgres fallback, auth, backup scheduler, startup reconciliation, and listener.
- App creation: `server/src/app.ts` (`createApp`) mounts middleware, auth, routes, plugin workers/scheduler/tool dispatcher, live events, and UI serving.
- Heartbeat orchestration: `server/src/services/heartbeat.ts` exports `heartbeatService` with queue/claim/invoke/cancel, run logs/events, workspaces/runtime, session state, liveness/recovery, retries, budget cancellation, and productivity review handling.
- Issue lifecycle: `server/src/services/issues.ts` exports `issueService` with CRUD, checkout/release, comments, documents, blockers, labels, read/archive state, attachments, and dependency readiness.
- Adapter server registry: `server/src/adapters/registry.ts` registers built-ins, supports mutable server adapters, external adapter loading, overrides, paused overrides, model/profile listing, and environment tests.
- UI router: `ui/src/App.tsx` defines board routes and redirects.
- UI adapter registry: `ui/src/adapters/registry.ts` registers built-ins and dynamic external adapter UI parsers.

Database/store notes:
- Primary DB is Postgres through Drizzle.
- If `DATABASE_URL` is unset, local dev uses embedded Postgres under `~/.paperclip/instances/default/db`.
- Local storage defaults to `local_disk` under `~/.paperclip/instances/default/data/storage`.
- Schema exports live in `packages/db/src/schema/index.ts`; adding tables requires exporting them there and generating a migration.

Current git context during onboarding:
- Branch: `master`, tracking `origin/master`.
- Remote: `origin` is `https://github.com/agamfujakurniawan/paperclip.git`.
- Latest commit observed: `ad6effa6 [codex] Improve runtime and import reliability (#6549)`.
- Serena onboarding created an untracked `.serena/` directory.