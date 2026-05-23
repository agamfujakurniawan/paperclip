---
title: Codex Local
summary: OpenAI Codex local adapter setup and configuration
---

The `codex_local` adapter runs OpenAI's Codex CLI locally. It supports session persistence via `previous_response_id` chaining and skills injection through the global Codex skills directory.

## Prerequisites

- Codex CLI installed (`codex` command available)
- For default OpenAI: `OPENAI_API_KEY` set in the environment or agent config, or a native Codex login in `CODEX_HOME`
- For BytePlus ModelArk/custom OpenAI-compatible providers: the provider API key env var set in the environment or agent config, for example `ARK_API_KEY`

## Configuration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `cwd` | string | Yes | Working directory for the agent process (absolute path; created automatically if missing when permissions allow) |
| `model` | string | No | Model to use |
| `promptTemplate` | string | No | Prompt used for all runs |
| `env` | object | No | Environment variables (supports secret refs) |
| `codexProvider` | string | No | Provider mode: omitted/`openai` uses Codex's default OpenAI provider, `modelark` configures BytePlus ModelArk, `custom_openai` uses the custom provider fields below |
| `codexProviderId` | string | No | Custom provider id for `custom_openai`, used in Codex `model_providers.<id>` overrides |
| `codexProviderName` | string | No | Custom provider display name |
| `codexProviderBaseUrl` | string | No | Custom OpenAI-compatible API base URL |
| `codexProviderEnvKey` | string | No | Environment variable Codex should read for the provider API key |
| `codexProviderWireApi` | string | No | Codex wire API override; current Codex releases only support `responses`, which Paperclip applies by default |
| `timeoutSec` | number | No | Process timeout (0 = no timeout) |
| `graceSec` | number | No | Grace period before force-kill |
| `fastMode` | boolean | No | Enables Codex Fast mode. Currently supported on `gpt-5.4` only and burns credits faster |
| `dangerouslyBypassApprovalsAndSandbox` | boolean | No | Skip safety checks (dev only) |

## Session Persistence

Codex uses `previous_response_id` for session continuity. The adapter serializes and restores this across heartbeats, allowing the agent to maintain conversation context.

## Skills Injection

The adapter symlinks Paperclip skills into the global Codex skills directory (`~/.codex/skills`). Existing user skills are not overwritten.

## Fast Mode

When `fastMode` is enabled, Paperclip adds Codex config overrides equivalent to:

```sh
-c 'service_tier="fast"' -c 'features.fast_mode=true'
```

Paperclip currently applies that only when the selected model is `gpt-5.4`. On other models, the toggle is preserved in config but ignored at execution time to avoid unsupported runs.

## OpenAI-Compatible Providers

By default, Paperclip does not add any provider overrides and Codex uses its built-in OpenAI configuration. To use BytePlus ModelArk, set:

```json
{
  "codexProvider": "modelark",
  "model": "deepseek-v3-2-251201",
  "env": {
    "ARK_API_KEY": { "type": "secret_ref", "secretId": "...", "version": "latest" }
  }
}
```

Paperclip then runs Codex with overrides equivalent to:

```sh
--ignore-user-config \
--ignore-rules \
--ephemeral \
-c 'model_provider="modelark"' \
-c 'model_providers.modelark.name="BytePlus ModelArk"' \
-c 'model_providers.modelark.base_url="https://ark.ap-southeast.bytepluses.com/api/v3"' \
-c 'model_providers.modelark.env_key="ARK_API_KEY"' \
-c 'model_providers.modelark.wire_api="responses"' \
-c 'model_providers.modelark.supports_websockets=false' \
-c 'web_search="disabled"' \
-c 'features.multi_agent=false' \
-c 'features.multi_agent_v2=false' \
-c 'features.apps=false' \
-c 'features.enable_mcp_apps=false' \
-c 'features.plugins=false' \
-c 'features.tool_suggest=false' \
-c 'features.image_generation=false' \
-c 'features.shell_tool=false' \
-c 'features.unified_exec=false'
```

ModelArk is intentionally run in text-only compatibility mode because Codex custom providers default to namespace-capable tools, while ModelArk currently rejects `tool.type="namespace"`. Paperclip disables Codex MCP/app/subagent/shell tool features for this preset and captures the final response directly. Use the default OpenAI provider when you need full Codex tool execution.

For another OpenAI-compatible endpoint, use `codexProvider: "custom_openai"` with `codexProviderId`, `codexProviderBaseUrl`, `codexProviderEnvKey`, and optionally `codexProviderName`. Paperclip defaults `codexProviderWireApi` to `responses`, which is the only custom-provider wire API currently documented by Codex.

## Managed `CODEX_HOME`

When Paperclip is running inside a managed worktree instance (`PAPERCLIP_IN_WORKTREE=true`), the adapter instead uses a worktree-isolated `CODEX_HOME` under the Paperclip instance so Codex skills, sessions, logs, and other runtime state do not leak across checkouts. It seeds that isolated home from the user's main Codex home for shared auth/config continuity.

## Manual Local CLI

For manual local CLI usage outside heartbeat runs (for example running as `codexcoder` directly), use:

```sh
pnpm paperclipai agent local-cli codexcoder --company-id <company-id>
```

This installs any missing skills, creates an agent API key, and prints shell exports to run as that agent.

## Instructions Resolution

If `instructionsFilePath` is configured, Paperclip reads that file and prepends it to the stdin prompt sent to `codex exec` on every run.

This is separate from any workspace-level instruction discovery that Codex itself performs in the run `cwd`. Paperclip does not disable Codex-native repo instruction files, so a repo-local `AGENTS.md` may still be loaded by Codex in addition to the Paperclip-managed agent instructions.

## Environment Test

The environment test checks:

- Codex CLI is installed and accessible
- Working directory is absolute and available (auto-created if missing and permitted)
- Authentication signal (`OPENAI_API_KEY` presence)
- A live hello probe (`codex exec --json -` with prompt `Respond with hello.`) to verify the CLI can actually run
