import { describe, expect, it } from "vitest";
import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import {
  OPENCODE_LOCAL_MODELARK_MODEL,
  OPENCODE_LOCAL_OPENAI_COMPATIBLE_NPM,
  OPENCODE_LOCAL_PROVIDER_CUSTOM_OPENAI,
  OPENCODE_LOCAL_PROVIDER_MODELARK,
} from "../index.js";
import { buildOpenCodeLocalConfig } from "./build-config.js";

function makeValues(overrides: Partial<CreateConfigValues> = {}): CreateConfigValues {
  return {
    adapterType: "opencode_local",
    cwd: "",
    instructionsFilePath: "",
    promptTemplate: "",
    model: "openai/gpt-5.2-codex",
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

describe("buildOpenCodeLocalConfig", () => {
  it("persists the ModelArk provider preset and default model", () => {
    const config = buildOpenCodeLocalConfig(
      makeValues({
        model: "",
        adapterSchemaValues: {
          openCodeProvider: OPENCODE_LOCAL_PROVIDER_MODELARK,
        },
        envBindings: {
          ARK_API_KEY: { type: "secret_ref", secretId: "secret-ark", version: "latest" },
        },
      }),
    );

    expect(config).toMatchObject({
      model: OPENCODE_LOCAL_MODELARK_MODEL,
      openCodeProvider: OPENCODE_LOCAL_PROVIDER_MODELARK,
      env: {
        ARK_API_KEY: { type: "secret_ref", secretId: "secret-ark", version: "latest" },
      },
    });
  });

  it("persists custom OpenAI-compatible provider fields", () => {
    const config = buildOpenCodeLocalConfig(
      makeValues({
        model: "proxy/model-a",
        adapterSchemaValues: {
          openCodeProvider: OPENCODE_LOCAL_PROVIDER_CUSTOM_OPENAI,
          openCodeProviderId: "proxy",
          openCodeProviderName: "Proxy",
          openCodeProviderBaseUrl: "https://proxy.example.com/v1",
          openCodeProviderEnvKey: "PROXY_API_KEY",
          openCodeProviderModelId: "model-a",
        },
      }),
    );

    expect(config).toMatchObject({
      model: "proxy/model-a",
      openCodeProvider: OPENCODE_LOCAL_PROVIDER_CUSTOM_OPENAI,
      openCodeProviderId: "proxy",
      openCodeProviderName: "Proxy",
      openCodeProviderBaseUrl: "https://proxy.example.com/v1",
      openCodeProviderEnvKey: "PROXY_API_KEY",
      openCodeProviderModelId: "model-a",
      openCodeProviderNpm: OPENCODE_LOCAL_OPENAI_COMPATIBLE_NPM,
    });
  });
});
