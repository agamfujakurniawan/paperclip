# Skills and Agent Instructions Summary

Read first for repo changes per `AGENTS.md`:
1. `doc/GOAL.md`
2. `doc/PRODUCT.md`
3. `doc/SPEC-implementation.md`
4. `doc/DEVELOPING.md`
5. `doc/DATABASE.md`

Top-level project skills:
- `skills/paperclip/SKILL.md`: Paperclip heartbeat/control-plane coordination. Covers auth env vars, checkout-first issue work, status updates, comments, child issues, blockers, approvals, planning documents, and API endpoints.
- `skills/paperclip-dev/SKILL.md`: local Paperclip dev/ops. Requires reading `doc/DEVELOPING.md` before CLI/build/test/worktree commands. Emphasizes CLI-only worktree/DB operations and public repo hygiene.
- `skills/paperclip-create-agent/SKILL.md`: governance-aware agent hiring, adapter config discovery, instructions bundle drafting, approval flow.
- `skills/paperclip-create-plugin/SKILL.md`: external plugin scaffolding and local plugin install loop; default is outside Paperclip core unless explicitly asked.
- `skills/paperclip-converting-plans-to-tasks/SKILL.md`: converting plans into Paperclip issues with specialty assignments, blockers, and parallelization.
- `skills/diagnose-why-work-stopped/SKILL.md`: forensic/product-design workflow for stalled/looping issue trees; read `doc/execution-semantics.md`, write plan only, request confirmation before code.
- `skills/terminal-bench-loop/SKILL.md`: bounded Terminal-Bench loop coordination through Paperclip, with worktree continuity and board-gated product fixes.

`.claude` instructions:
- `.claude/skills/paperclip` is a pointer to `../../skills/paperclip`.
- `.claude/skills/company-creator` is a pointer to `../../.agents/skills/company-creator`.
- `.claude/skills/design-guide/SKILL.md` is the Paperclip UI design system guide. Use for frontend component/page work and pair with frontend/web design review skills when available.

`.agents/skills` highlights:
- `company-creator`: creates Agent Companies packages conforming to `agentcompanies/v1`; must read `docs/companies/companies-spec.md`; interviews user before writing files; writes package structure with `COMPANY.md`, `agents/*/AGENTS.md`, optional teams/projects/tasks/skills, `.paperclip.yaml`, README, LICENSE.
- `create-agent-adapter`: detailed technical guide for built-in adapter packages and conventions. Note: for the fork/external-adapter story, prefer external adapter plugin architecture when applicable rather than adding core built-ins.
- `deal-with-security-advisory`: confidential GitHub Security Advisory response. Avoid public branches/messages; use private advisory fork; coordinate CVE/release carefully.
- `doc-maintenance`: audits top-level docs against recent git history with minimal factual edits.
- `pr-report`: creates maintainer-grade PR/contribution reports, often as HTML/Markdown artifacts.
- `prcheckloop`: iteratively gets GitHub PR checks green for latest PR head SHA.
- `release`: full Paperclip release coordination; uses canary/stable calver model.
- `release-changelog`: writes stable release changelog at `releases/vYYYY.MDD.P.md`.
- `release-changelog-discord-message`: writes Discord announcement artifact from the stable changelog.

Important Paperclip skill rules:
- Never retry checkout `409`.
- Never look for unassigned work as an agent; no assignments means exit.
- Use first-class blockers and child issues, not polling/prose-only blockers.
- Plans belong in issue document key `plan` unless the user explicitly asks for repo plan docs.
- If creating repo plan docs, AGENTS.md says use `doc/plans/YYYY-MM-DD-slug.md`.
- For commits made by Paperclip agents, `Co-Authored-By: Paperclip <noreply@paperclip.ing>` is required in their workflow. For this Kilo session, follow user/developer git instructions and only commit when explicitly asked.