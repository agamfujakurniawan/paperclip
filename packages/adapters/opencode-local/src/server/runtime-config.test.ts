import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  OPENCODE_LOCAL_MODELARK_BASE_URL,
  OPENCODE_LOCAL_MODELARK_ENV_KEY,
  OPENCODE_LOCAL_MODELARK_MODEL,
  OPENCODE_LOCAL_MODELARK_MODEL_ID,
  OPENCODE_LOCAL_MODELARK_PROVIDER_ID,
  OPENCODE_LOCAL_MODELARK_PROVIDER_NAME,
  OPENCODE_LOCAL_OPENAI_COMPATIBLE_NPM,
  OPENCODE_LOCAL_PROVIDER_CUSTOM_OPENAI,
  OPENCODE_LOCAL_PROVIDER_MODELARK,
} from "../index.js";
import { prepareOpenCodeRuntimeConfig } from "./runtime-config.js";

const cleanupPaths = new Set<string>();

afterEach(async () => {
  await Promise.all(
    [...cleanupPaths].map(async (filepath) => {
      await fs.rm(filepath, { recursive: true, force: true });
      cleanupPaths.delete(filepath);
    }),
  );
});

async function makeConfigHome(initialConfig?: Record<string, unknown>) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "paperclip-opencode-test-"));
  cleanupPaths.add(root);
  const configDir = path.join(root, "opencode");
  await fs.mkdir(configDir, { recursive: true });
  if (initialConfig) {
    await fs.writeFile(
      path.join(configDir, "opencode.json"),
      `${JSON.stringify(initialConfig, null, 2)}\n`,
      "utf8",
    );
  }
  return root;
}

describe("prepareOpenCodeRuntimeConfig", () => {
  it("injects an external_directory allow rule by default", async () => {
    const configHome = await makeConfigHome({
      permission: {
        read: "allow",
      },
      theme: "system",
    });

    const prepared = await prepareOpenCodeRuntimeConfig({
      env: { XDG_CONFIG_HOME: configHome },
      config: {},
    });
    cleanupPaths.add(prepared.env.XDG_CONFIG_HOME);

    expect(prepared.env.XDG_CONFIG_HOME).not.toBe(configHome);
    const runtimeConfig = JSON.parse(
      await fs.readFile(
        path.join(prepared.env.XDG_CONFIG_HOME, "opencode", "opencode.json"),
        "utf8",
      ),
    ) as Record<string, unknown>;
    expect(runtimeConfig).toMatchObject({
      theme: "system",
      permission: {
        read: "allow",
        external_directory: "allow",
      },
    });

    await prepared.cleanup();
    cleanupPaths.delete(prepared.env.XDG_CONFIG_HOME);
    await expect(fs.access(prepared.env.XDG_CONFIG_HOME)).rejects.toThrow();
  });

  it("respects explicit opt-out", async () => {
    const configHome = await makeConfigHome();
    const prepared = await prepareOpenCodeRuntimeConfig({
      env: { XDG_CONFIG_HOME: configHome },
      config: { dangerouslySkipPermissions: false },
    });

    expect(prepared.env).toEqual({ XDG_CONFIG_HOME: configHome });
    expect(prepared.notes).toEqual([]);
    await prepared.cleanup();
  });

  it("injects a runtime ModelArk provider config", async () => {
    const configHome = await makeConfigHome();
    const prepared = await prepareOpenCodeRuntimeConfig({
      env: { XDG_CONFIG_HOME: configHome },
      config: {
        openCodeProvider: OPENCODE_LOCAL_PROVIDER_MODELARK,
        model: OPENCODE_LOCAL_MODELARK_MODEL,
      },
    });
    cleanupPaths.add(prepared.env.XDG_CONFIG_HOME);

    const runtimeConfig = JSON.parse(
      await fs.readFile(
        path.join(prepared.env.XDG_CONFIG_HOME, "opencode", "opencode.json"),
        "utf8",
      ),
    ) as Record<string, unknown>;
    expect(runtimeConfig).toMatchObject({
      provider: {
        [OPENCODE_LOCAL_MODELARK_PROVIDER_ID]: {
          npm: OPENCODE_LOCAL_OPENAI_COMPATIBLE_NPM,
          name: OPENCODE_LOCAL_MODELARK_PROVIDER_NAME,
          options: {
            baseURL: OPENCODE_LOCAL_MODELARK_BASE_URL,
            apiKey: `{env:${OPENCODE_LOCAL_MODELARK_ENV_KEY}}`,
          },
          models: {
            [OPENCODE_LOCAL_MODELARK_MODEL_ID]: {
              name: OPENCODE_LOCAL_MODELARK_MODEL_ID,
            },
          },
        },
      },
    });
    expect(prepared.notes).toContain(`Injected runtime OpenCode provider config for ${OPENCODE_LOCAL_MODELARK_PROVIDER_NAME}.`);

    await prepared.cleanup();
    cleanupPaths.delete(prepared.env.XDG_CONFIG_HOME);
  });

  it("injects custom OpenAI-compatible providers even when skip permissions is disabled", async () => {
    const configHome = await makeConfigHome();
    const prepared = await prepareOpenCodeRuntimeConfig({
      env: { XDG_CONFIG_HOME: configHome },
      config: {
        dangerouslySkipPermissions: false,
        openCodeProvider: OPENCODE_LOCAL_PROVIDER_CUSTOM_OPENAI,
        openCodeProviderId: "proxy",
        openCodeProviderName: "Proxy",
        openCodeProviderBaseUrl: "https://proxy.example.com/v1",
        openCodeProviderEnvKey: "PROXY_API_KEY",
        openCodeProviderModelId: "model-a",
      },
    });
    cleanupPaths.add(prepared.env.XDG_CONFIG_HOME);

    const runtimeConfig = JSON.parse(
      await fs.readFile(
        path.join(prepared.env.XDG_CONFIG_HOME, "opencode", "opencode.json"),
        "utf8",
      ),
    ) as Record<string, unknown>;
    expect(runtimeConfig).toMatchObject({
      provider: {
        proxy: {
          npm: OPENCODE_LOCAL_OPENAI_COMPATIBLE_NPM,
          name: "Proxy",
          options: {
            baseURL: "https://proxy.example.com/v1",
            apiKey: "{env:PROXY_API_KEY}",
          },
          models: {
            "model-a": {
              name: "model-a",
            },
          },
        },
      },
    });
    expect(runtimeConfig.permission).toBeUndefined();

    await prepared.cleanup();
    cleanupPaths.delete(prepared.env.XDG_CONFIG_HOME);
  });
});
