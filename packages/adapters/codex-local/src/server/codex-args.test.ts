import { describe, expect, it } from "vitest";
import {
  CODEX_LOCAL_MODELARK_BASE_URL,
  CODEX_LOCAL_MODELARK_ENV_KEY,
  CODEX_LOCAL_MODELARK_MODEL,
  CODEX_LOCAL_MODELARK_PROVIDER_ID,
  CODEX_LOCAL_MODELARK_PROVIDER_NAME,
  CODEX_LOCAL_PROVIDER_CUSTOM_OPENAI,
  CODEX_LOCAL_PROVIDER_MODELARK,
  DEFAULT_CODEX_LOCAL_CHEAP_MODEL,
} from "../index.js";
import { buildCodexExecArgs } from "./codex-args.js";

const modelArkTextOnlyArgs = [
  "--ignore-user-config",
  "--ignore-rules",
  "--ephemeral",
  "-c",
  'web_search="disabled"',
  "-c",
  "features.multi_agent=false",
  "-c",
  "features.multi_agent_v2=false",
  "-c",
  "features.apps=false",
  "-c",
  "features.enable_mcp_apps=false",
  "-c",
  "features.plugins=false",
  "-c",
  "features.tool_suggest=false",
  "-c",
  "features.image_generation=false",
  "-c",
  "features.shell_tool=false",
  "-c",
  "features.unified_exec=false",
];

describe("buildCodexExecArgs", () => {
  it("enables Codex fast mode overrides for GPT-5.4", () => {
    const result = buildCodexExecArgs({
      model: "gpt-5.4",
      search: true,
      fastMode: true,
    });

    expect(result.fastModeRequested).toBe(true);
    expect(result.fastModeApplied).toBe(true);
    expect(result.fastModeIgnoredReason).toBeNull();
    expect(result.args).toEqual([
      "--search",
      "exec",
      "--json",
      "--model",
      "gpt-5.4",
      "-c",
      'service_tier="fast"',
      "-c",
      "features.fast_mode=true",
      "-",
    ]);
  });

  it("enables Codex fast mode overrides for manual models", () => {
    const result = buildCodexExecArgs({
      model: "gpt-5.5",
      fastMode: true,
    });

    expect(result.fastModeRequested).toBe(true);
    expect(result.fastModeApplied).toBe(true);
    expect(result.fastModeIgnoredReason).toBeNull();
    expect(result.args).toEqual([
      "exec",
      "--json",
      "--model",
      "gpt-5.5",
      "-c",
      'service_tier="fast"',
      "-c",
      "features.fast_mode=true",
      "-",
    ]);
  });

  it("ignores fast mode for unsupported models", () => {
    const result = buildCodexExecArgs({
      model: "gpt-5.3-codex",
      fastMode: true,
    });

    expect(result.fastModeRequested).toBe(true);
    expect(result.fastModeApplied).toBe(false);
    expect(result.fastModeIgnoredReason).toContain(
      "currently only supported on gpt-5.4 or manually configured model IDs",
    );
    expect(result.args).toEqual([
      "exec",
      "--json",
      "--model",
      "gpt-5.3-codex",
      "-",
    ]);
  });

  it("adds --skip-git-repo-check when requested", () => {
    const result = buildCodexExecArgs(
      {
        model: "gpt-5.3-codex",
      },
      { skipGitRepoCheck: true },
    );

    expect(result.args).toEqual([
      "exec",
      "--json",
      "--skip-git-repo-check",
      "--model",
      "gpt-5.3-codex",
      "-",
    ]);
  });

  it("adds Codex provider overrides for BytePlus ModelArk", () => {
    const result = buildCodexExecArgs({
      codexProvider: CODEX_LOCAL_PROVIDER_MODELARK,
      model: CODEX_LOCAL_MODELARK_MODEL,
    });

    expect(result.args).toEqual([
      "exec",
      "--json",
      ...modelArkTextOnlyArgs,
      "--model",
      CODEX_LOCAL_MODELARK_MODEL,
      "-c",
      `model_provider=${JSON.stringify(CODEX_LOCAL_MODELARK_PROVIDER_ID)}`,
      "-c",
      `model_providers.${CODEX_LOCAL_MODELARK_PROVIDER_ID}.name=${JSON.stringify(CODEX_LOCAL_MODELARK_PROVIDER_NAME)}`,
      "-c",
      `model_providers.${CODEX_LOCAL_MODELARK_PROVIDER_ID}.base_url=${JSON.stringify(CODEX_LOCAL_MODELARK_BASE_URL)}`,
      "-c",
      `model_providers.${CODEX_LOCAL_MODELARK_PROVIDER_ID}.env_key=${JSON.stringify(CODEX_LOCAL_MODELARK_ENV_KEY)}`,
      "-c",
      `model_providers.${CODEX_LOCAL_MODELARK_PROVIDER_ID}.wire_api="responses"`,
      "-c",
      `model_providers.${CODEX_LOCAL_MODELARK_PROVIDER_ID}.supports_websockets=false`,
      "-",
    ]);
  });

  it("normalizes the OpenAI cheap model fallback to the ModelArk preset model", () => {
    const result = buildCodexExecArgs({
      codexProvider: CODEX_LOCAL_PROVIDER_MODELARK,
      model: DEFAULT_CODEX_LOCAL_CHEAP_MODEL,
      modelReasoningEffort: "high",
    });

    expect(result.model).toBe(CODEX_LOCAL_MODELARK_MODEL);
    expect(result.args).toEqual([
      "exec",
      "--json",
      ...modelArkTextOnlyArgs,
      "--model",
      CODEX_LOCAL_MODELARK_MODEL,
      "-c",
      'model_reasoning_effort="high"',
      "-c",
      `model_provider=${JSON.stringify(CODEX_LOCAL_MODELARK_PROVIDER_ID)}`,
      "-c",
      `model_providers.${CODEX_LOCAL_MODELARK_PROVIDER_ID}.name=${JSON.stringify(CODEX_LOCAL_MODELARK_PROVIDER_NAME)}`,
      "-c",
      `model_providers.${CODEX_LOCAL_MODELARK_PROVIDER_ID}.base_url=${JSON.stringify(CODEX_LOCAL_MODELARK_BASE_URL)}`,
      "-c",
      `model_providers.${CODEX_LOCAL_MODELARK_PROVIDER_ID}.env_key=${JSON.stringify(CODEX_LOCAL_MODELARK_ENV_KEY)}`,
      "-c",
      `model_providers.${CODEX_LOCAL_MODELARK_PROVIDER_ID}.wire_api="responses"`,
      "-c",
      `model_providers.${CODEX_LOCAL_MODELARK_PROVIDER_ID}.supports_websockets=false`,
      "-",
    ]);
  });

  it("adds Codex provider overrides for custom OpenAI-compatible providers before extra args", () => {
    const result = buildCodexExecArgs({
      codexProvider: CODEX_LOCAL_PROVIDER_CUSTOM_OPENAI,
      codexProviderId: "proxy",
      codexProviderName: "Proxy",
      codexProviderBaseUrl: "https://proxy.example.com/v1",
      codexProviderEnvKey: "PROXY_API_KEY",
      codexProviderWireApi: "responses",
      extraArgs: ["--verbose"],
    });

    expect(result.args).toEqual([
      "exec",
      "--json",
      "-c",
      'model_provider="proxy"',
      "-c",
      'model_providers.proxy.name="Proxy"',
      "-c",
      'model_providers.proxy.base_url="https://proxy.example.com/v1"',
      "-c",
      'model_providers.proxy.env_key="PROXY_API_KEY"',
      "-c",
      'model_providers.proxy.wire_api="responses"',
      "--verbose",
      "-",
    ]);
  });
});
