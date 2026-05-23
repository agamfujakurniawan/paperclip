# OpenCode Local Adapter

The `opencode_local` adapter runs the OpenCode CLI as a local agent runtime.

Use it when you want a Codex-like CLI agent with provider/model routing in `provider/model` format.

## Prerequisites

- OpenCode CLI installed (`opencode` command available)
- Provider credentials configured in OpenCode, in adapter env, or through a runtime provider preset

## Key Config

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | Yes | OpenCode model id in `provider/model` format |
| `openCodeProvider` | string | No | Provider preset: omitted/`default` uses existing OpenCode config, `modelark` injects BytePlus ModelArk, `custom_openai` uses custom provider fields |
| `openCodeProviderId` | string | No | Custom provider id for `custom_openai` |
| `openCodeProviderName` | string | No | Custom provider display name |
| `openCodeProviderBaseUrl` | string | No | Custom OpenAI-compatible API base URL |
| `openCodeProviderEnvKey` | string | No | Environment variable OpenCode should read for the provider API key |
| `openCodeProviderModelId` | string | No | Model id inside the custom provider |
| `openCodeProviderNpm` | string | No | OpenCode AI SDK provider package; defaults to `@ai-sdk/openai-compatible` |
| `variant` | string | No | Provider-specific OpenCode variant/reasoning profile |
| `env` | object | No | Environment variables, including secret refs |

## BytePlus ModelArk

For ModelArk, set:

```json
{
  "openCodeProvider": "modelark",
  "model": "modelark/deepseek-v3-2-251201",
  "env": {
    "ARK_API_KEY": { "type": "secret_ref", "secretId": "...", "version": "latest" }
  }
}
```

Paperclip writes a temporary OpenCode config equivalent to:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "modelark": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "BytePlus ModelArk",
      "options": {
        "baseURL": "https://ark.ap-southeast.bytepluses.com/api/v3",
        "apiKey": "{env:ARK_API_KEY}"
      },
      "models": {
        "deepseek-v3-2-251201": {
          "name": "deepseek-v3-2-251201",
          "limit": {
            "context": 128000,
            "output": 16384
          }
        }
      }
    }
  }
}
```

The run command stays normal OpenCode:

```sh
opencode run --format json --model modelark/deepseek-v3-2-251201
```

This is the recommended experiment path for ModelArk because OpenCode uses AI SDK provider routing instead of Codex's OpenAI Responses namespace tools.

## Custom OpenAI-Compatible Provider

Use `openCodeProvider: "custom_openai"` with:

```json
{
  "openCodeProvider": "custom_openai",
  "openCodeProviderId": "proxy",
  "openCodeProviderName": "OpenAI-compatible proxy",
  "openCodeProviderBaseUrl": "https://proxy.example.com/v1",
  "openCodeProviderEnvKey": "PROXY_API_KEY",
  "openCodeProviderModelId": "model-a",
  "model": "proxy/model-a"
}
```

## Notes

- Paperclip sets `OPENCODE_DISABLE_PROJECT_CONFIG=true` so OpenCode does not write config into the workspace repo.
- Paperclip injects provider config into a temporary OpenCode config home for each run.
- If `dangerouslySkipPermissions` is enabled, Paperclip also injects `permission.external_directory=allow` to avoid headless approval prompts.
- Run `opencode models` with the same environment if you need to debug provider discovery manually.
