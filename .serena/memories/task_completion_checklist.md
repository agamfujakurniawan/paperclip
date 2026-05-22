# Task Completion Checklist

Before claiming code work is done:
- Confirm behavior matches `doc/SPEC-implementation.md` and any more specific issue/user instruction.
- Preserve company scoping, auth/permission boundaries, checkout semantics, approval gates, budget hard-stop behavior, and activity logging for mutations.
- Keep data/API/UI contracts synchronized across `packages/db`, `packages/shared`, `server`, and `ui` when touching behavior or schema.
- Update docs when behavior, commands, adapter/plugin contracts, or deployment expectations change.
- Prefer targeted verification first. Use the smallest test/typecheck/build command that proves the change.
- For PR-ready/broad changes, run `pnpm -r typecheck`, `pnpm test:run`, and `pnpm build` unless impossible; explicitly report skipped commands and why.
- Browser suites (`pnpm test:e2e`, `pnpm test:release-smoke`) are opt-in unless the change touches browser flows/CI/release flows.

DB/schema completion:
- Edit `packages/db/src/schema/*.ts`.
- Export new tables from `packages/db/src/schema/index.ts`.
- Update shared validators/types and server/UI usage as needed.
- Run `pnpm db:generate`.
- Validate with at least relevant typecheck/tests; broad schema changes usually need `pnpm -r typecheck`.

UI completion:
- Use established design tokens/components and company selection context.
- Surface API errors clearly; do not silently ignore failures.
- Update `/design-guide` and component index if adding/changing reusable components.
- Include screenshots/visual notes for PRs when visible UI changes are made.

Adapter/plugin completion:
- External adapters should use dynamic plugin loading, config schema, and optional `ui-parser.js`; avoid hardcoded imports for fork-external adapters.
- Include optional server adapter fields where relevant, especially `detectModel`.
- Keep adapter-utils root exports browser-safe.
- Treat plugin UI/worker trust model honestly; do not claim sandboxing where code is trusted same-origin.

PR completion:
- Read `.github/PULL_REQUEST_TEMPLATE.md` and `CONTRIBUTING.md` before creating PRs.
- Fill every template section, especially Thinking Path and Model Used.
- Current model to report when this assistant contributes: provider OpenAI, exact model ID `openai/gpt-5.5`, tool use enabled.
- Include verification commands and risks.

Serena usage:
- Use Serena for project exploration and symbolic code understanding before edits.
- Prefer `serena_get_symbols_overview`, `serena_find_symbol`, and `serena_find_referencing_symbols` for code navigation.
- Use `serena_write_memory` for durable project context updates when learning important repo-specific facts.