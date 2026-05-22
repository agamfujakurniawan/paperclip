# Code Style and Conventions

General engineering rules:
- Prefer the smallest correct change.
- Keep contracts synchronized across `packages/db`, `packages/shared`, `server`, and `ui` when behavior/schema/API changes.
- Do not replace strategic docs wholesale unless asked; prefer additive updates and keep `doc/SPEC.md` + `doc/SPEC-implementation.md` aligned.
- Preserve company scoping and route/service access checks for all business entities.
- Mutating server actions should write `activity_log` entries and return consistent HTTP errors (`400/401/403/404/409/422/500`).
- Agent API keys are bearer keys, hashed at rest, and must not cross company boundaries.
- Board access is full-control operator context.

TypeScript/repo conventions:
- Monorepo uses Node 20+, pnpm 9, TypeScript, ESM (`type: module`).
- Use shared constants/types/validators from `packages/shared` instead of duplicating contracts.
- DB schema uses Drizzle in `packages/db/src/schema/*.ts` with a central export file.
- API routes live under `/api` and generally validate request/response shapes with shared Zod validators.
- UI uses React 19 + TypeScript + Vite, Tailwind CSS v4 tokens, shadcn/Radix primitives, Lucide icons, and `cn()` for class merging.

UI design conventions from `.claude/skills/design-guide/SKILL.md`:
- Paperclip UI is dense, scannable, keyboard-first, dark-themed by default, and component-driven.
- Use semantic CSS variables from `ui/src/index.css`; avoid raw hex/rgb values.
- Use established typography: page titles `text-xl font-bold`, section/card titles `text-sm`/`text-lg` patterns, metadata `text-xs text-muted-foreground`, monospaced identifiers/logs.
- Use `StatusBadge`, `StatusIcon`, and `PriorityIcon` rather than hardcoded status/priority colors.
- shadcn primitives live in `ui/src/components/ui/`; do not modify directly, compose around them.
- Custom components use PascalCase under `ui/src/components/`; pages use PascalCase under `ui/src/pages/`; utilities live under `ui/src/lib/`; hooks under `ui/src/hooks/`.
- Add/update `ui/src/pages/DesignGuide.tsx` and `.claude/skills/design-guide/references/component-index.md` when adding reusable UI components or changing component APIs.

Adapter conventions:
- Adapter types use `snake_case`; package dirs use kebab-case.
- Built-in adapter packages typically expose root metadata plus `./server`, `./ui`, `./cli` exports.
- Server adapter modules implement execution, environment test, optional session codec, skills/model capabilities, config schema, and optional model detection.
- UI adapter modules parse stdout lines, render config fields, and build adapter config.
- Treat adapter stdout as untrusted; parse defensively and never evaluate output.
- Secret values must not be placed in prompts/templates; use env/secret references and redaction utilities.
- Skills injection must not contaminate the agent `cwd`; use tmpdir/global tool config/env pattern.

Paperclip issue/agent workflow conventions from `skills/paperclip/SKILL.md`:
- Agents must checkout before work and never retry a `409` checkout conflict.
- Work should end in a valid disposition: terminal, explicit live path, explicit waiting path, or explicit blocker/recovery path.
- Use issue documents for plans (`key=plan`) instead of repo files unless explicitly asked.
- Use child issues and first-class blockers (`blockedByIssueIds`) for delegation/dependencies.
- Comments/descriptions should link ticket refs as markdown links and use company-prefixed URLs.

PR/contribution conventions:
- Use `.github/PULL_REQUEST_TEMPLATE.md` exactly for PR bodies.
- Required PR sections: Thinking Path, What Changed, Verification, Risks, Model Used, Checklist.
- `CONTRIBUTING.md` favors small focused PRs; feature contributions should align with roadmap/discussion.
- PR-ready handoff should have typecheck, tests, and build passing or explicitly state why not run.