import { describe, expect, it } from "vitest";
import {
  CODEX_LOCAL_DEFAULT_PROVIDER_WIRE_API,
  CODEX_LOCAL_MODELARK_MODEL,
  CODEX_LOCAL_PROVIDER_CUSTOM_OPENAI,
  CODEX_LOCAL_PROVIDER_MODELARK,
} from "../index.js";
import { buildCodexLocalConfig } from "./build-config.js";
import type { CreateConfigValues } from "@paperclipai/adapter-utils";

function makeValues(overrides: Partial<CreateConfigValues> = {}): CreateConfigValues {
  return {
    adapterType: "codex_local",
    cwd: "",
    instructionsFilePath: "",
    promptTemplate: "",
    model: "gpt-5.4",
    thinkingEffort: "",
    chrome: false,
    dangerouslySkipPermissions: true,
    search: false,
    fastMode: false,
    dangerouslyBypassSandbox: true,
    command: "",
    args: "",
    extraArgs: "",
    envVars: "",
    envBindings: {},
    url: "",
    bootstrapPrompt: "",
    payloadTemplateJson: "",
    workspaceStrategyType: "project_primary",
    workspaceBaseRef: "",
    workspaceBranchTemplate: "",
    worktreeParentDir: "",
    runtimeServicesJson: "",
    maxTurnsPerRun: 1000,
    heartbeatEnabled: false,
    intervalSec: 300,
    ...overrides,
  };
}

describe("buildCodexLocalConfig", () => {
  it("persists the fastMode toggle into adapter config", () => {
    const config = buildCodexLocalConfig(
      makeValues({
        search: true,
        fastMode: true,
      }),
    );

    expect(config).toMatchObject({
      model: "gpt-5.4",
      search: true,
      fastMode: true,
      dangerouslyBypassApprovalsAndSandbox: true,
    });
  });

  it("persists the ModelArk provider preset and default model", () => {
    const config = buildCodexLocalConfig(
      makeValues({
        model: "",
        adapterSchemaValues: {
          codexProvider: CODEX_LOCAL_PROVIDER_MODELARK,
        },
        envBindings: {
          ARK_API_KEY: { type: "secret_ref", secretId: "secret-ark", version: "latest" },
        },
      }),
    );

    expect(config).toMatchObject({
      model: CODEX_LOCAL_MODELARK_MODEL,
      codexProvider: CODEX_LOCAL_PROVIDER_MODELARK,
      env: {
        ARK_API_KEY: { type: "secret_ref", secretId: "secret-ark", version: "latest" },
      },
    });
  });

  it("persists custom OpenAI-compatible provider fields", () => {
    const config = buildCodexLocalConfig(
      makeValues({
        adapterSchemaValues: {
          codexProvider: CODEX_LOCAL_PROVIDER_CUSTOM_OPENAI,
          codexProviderId: "proxy",
          codexProviderName: "Proxy",
          codexProviderBaseUrl: "https://proxy.example.com/v1",
          codexProviderEnvKey: "PROXY_API_KEY",
        },
      }),
    );

    expect(config).toMatchObject({
      codexProvider: CODEX_LOCAL_PROVIDER_CUSTOM_OPENAI,
      codexProviderId: "proxy",
      codexProviderName: "Proxy",
      codexProviderBaseUrl: "https://proxy.example.com/v1",
      codexProviderEnvKey: "PROXY_API_KEY",
      codexProviderWireApi: CODEX_LOCAL_DEFAULT_PROVIDER_WIRE_API,
    });
  });
});
