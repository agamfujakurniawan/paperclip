# Fork and External Adapter Notes

This checkout is a fork of `paperclipai/paperclip`. Current observed remote during onboarding: `origin https://github.com/agamfujakurniawan/paperclip.git`.

Authoritative fork guidance is in root `AGENTS.md` section `Fork-Specific: HenkDz/paperclip`:
- Target branch/story: `feat/externalize-hermes-adapter`.
- Hermes should be external-only: core must have no `hermes-paperclip-adapter` dependency and no built-in `hermes_local` registration.
- Hermes should be installed through Board -> Adapter manager as `@henkey/hermes-paperclip-adapter` or a `file:` package. Type remains `hermes_local` once loaded.
- UI should use generic `config-schema` plus package `ui-parser.js`; no Hermes imports in `server/` or `ui/` source.
- External adapters live via `~/.paperclip/adapter-plugins.json` and managed package dir `~/.paperclip/adapter-plugins`.
- Plugin loader should have zero hardcoded adapter imports; pure dynamic loading.
- `createServerAdapter()` must include all optional fields where applicable, especially `detectModel`.
- Built-in UI adapters can shadow external plugin parsers; remove built-in when fully externalizing.
- Reference external adapters include Hermes and Droid.

Important discrepancy found during onboarding:
- The current tree still contains built-in Hermes references despite the external-only fork guidance.
- `server/src/adapters/registry.ts` imports from `hermes-paperclip-adapter`, defines `hermesLocalAdapter`, and registers it as built-in.
- `ui/src/adapters/hermes-local/index.ts` imports `hermes-paperclip-adapter/ui` and registers `hermesLocalUIAdapter` in `ui/src/adapters/registry.ts`.
- `ui/package.json` depends on `hermes-paperclip-adapter`.
- `server/src/adapters/builtin-adapter-types.ts` includes `hermes_local`.
- `tsconfig.json` still references `./packages/adapters/droid-local`, but no such directory was found in the repo during onboarding.
- Docs under `docs/adapters/*` and `docs/agents-runtime.md` still mention `hermes_local` as built-in/local in places, while `AGENTS.md` says root fork guidance is authoritative.

External adapter architecture locations:
- Store: `server/src/services/adapter-plugin-store.ts`.
- Loader: `server/src/adapters/plugin-loader.ts`; external adapter packages export `createServerAdapter()` and optional `./ui-parser` / `paperclip.adapterUiParser` contract.
- Server registry: `server/src/adapters/registry.ts`; supports overrides and built-in fallbacks.
- Routes: `server/src/routes/adapters.ts`; exposes list/install/reload/remove/toggle/config-schema/ui-parser routes.
- UI dynamic parser: `ui/src/adapters/dynamic-loader.ts` fetches `/api/adapters/:type/ui-parser.js` and executes parser code in a Web Worker sandbox.
- UI registry: `ui/src/adapters/registry.ts`; unknown/external adapters use schema config fields and dynamic parser loading.

Fork QoL patches to preserve if re-copying upstream source:
- `stderr_group`: amber accordion for MCP init noise in `RunTranscriptView.tsx`.
- `tool_group`: accordion for consecutive non-terminal tools (write/read/search/browser).
- Dashboard excerpt: `LatestRunCard` strips markdown and shows first 3 lines/280 chars.

Local fork notes:
- Fork may run on port 3101+ if 3100 is taken.
- On NTFS, `npx vite build` can hang; use `node node_modules/vite/bin/vite.js build`.
- Server startup from NTFS can take 30-60s.
- Delete both `ui/dist` and `ui/node_modules/.vite` to clear Vite cache.