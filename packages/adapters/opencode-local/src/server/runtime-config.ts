import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { asBoolean, asString } from "@paperclipai/adapter-utils/server-utils";
import {
  OPENCODE_LOCAL_MODELARK_BASE_URL,
  OPENCODE_LOCAL_MODELARK_ENV_KEY,
  OPENCODE_LOCAL_MODELARK_MODEL_ID,
  OPENCODE_LOCAL_MODELARK_PROVIDER_ID,
  OPENCODE_LOCAL_MODELARK_PROVIDER_NAME,
  OPENCODE_LOCAL_OPENAI_COMPATIBLE_NPM,
  OPENCODE_LOCAL_PROVIDER_CUSTOM_OPENAI,
  OPENCODE_LOCAL_PROVIDER_MODELARK,
} from "../index.js";

type PreparedOpenCodeRuntimeConfig = {
  env: Record<string, string>;
  notes: string[];
  cleanup: () => Promise<void>;
};

type OpenCodeProviderRuntimeConfig = {
  providerId: string;
  provider: Record<string, unknown>;
  note: string;
};

const PROVIDER_ID_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/;
const ENV_KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function resolveXdgConfigHome(env: Record<string, string>): string {
  return (
    (typeof env.XDG_CONFIG_HOME === "string" && env.XDG_CONFIG_HOME.trim()) ||
    (typeof process.env.XDG_CONFIG_HOME === "string" && process.env.XDG_CONFIG_HOME.trim()) ||
    path.join(os.homedir(), ".config")
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string {
  return asString(record[key], "").trim();
}

function readProviderModelId(config: Record<string, unknown>, providerId: string, fallback: string): string {
  const explicitModelId = readString(config, "openCodeProviderModelId");
  if (explicitModelId) return explicitModelId;
  const model = readString(config, "model");
  const prefix = `${providerId}/`;
  return model.startsWith(prefix) && model.length > prefix.length ? model.slice(prefix.length) : fallback;
}

function buildOpenAiCompatibleProvider(input: {
  name: string;
  baseUrl: string;
  envKey: string;
  modelId: string;
  npm?: string;
}): Record<string, unknown> {
  return {
    npm: input.npm || OPENCODE_LOCAL_OPENAI_COMPATIBLE_NPM,
    name: input.name,
    options: {
      baseURL: input.baseUrl,
      apiKey: `{env:${input.envKey}}`,
    },
    models: {
      [input.modelId]: {
        name: input.modelId,
        limit: {
          context: 128000,
          output: 16384,
        },
      },
    },
  };
}

export function resolveOpenCodeProviderRuntimeConfig(
  config: Record<string, unknown>,
): OpenCodeProviderRuntimeConfig | null {
  const provider = readString(config, "openCodeProvider");
  if (provider === OPENCODE_LOCAL_PROVIDER_MODELARK) {
    return {
      providerId: OPENCODE_LOCAL_MODELARK_PROVIDER_ID,
      provider: buildOpenAiCompatibleProvider({
        name: OPENCODE_LOCAL_MODELARK_PROVIDER_NAME,
        baseUrl: OPENCODE_LOCAL_MODELARK_BASE_URL,
        envKey: OPENCODE_LOCAL_MODELARK_ENV_KEY,
        modelId: OPENCODE_LOCAL_MODELARK_MODEL_ID,
      }),
      note: `Injected runtime OpenCode provider config for ${OPENCODE_LOCAL_MODELARK_PROVIDER_NAME}.`,
    };
  }

  if (provider !== OPENCODE_LOCAL_PROVIDER_CUSTOM_OPENAI) return null;

  const id = readString(config, "openCodeProviderId");
  const baseUrl = readString(config, "openCodeProviderBaseUrl");
  const envKey = readString(config, "openCodeProviderEnvKey");
  if (!PROVIDER_ID_RE.test(id) || !baseUrl || !ENV_KEY_RE.test(envKey)) return null;
  const modelId = readProviderModelId(config, id, readString(config, "openCodeProviderModelId"));
  if (!modelId) return null;

  return {
    providerId: id,
    provider: buildOpenAiCompatibleProvider({
      name: readString(config, "openCodeProviderName") || id,
      baseUrl,
      envKey,
      modelId,
      npm: readString(config, "openCodeProviderNpm") || OPENCODE_LOCAL_OPENAI_COMPATIBLE_NPM,
    }),
    note: `Injected runtime OpenCode provider config for ${id}.`,
  };
}

async function readJsonObject(filepath: string): Promise<Record<string, unknown>> {
  try {
    const raw = await fs.readFile(filepath, "utf8");
    const parsed = JSON.parse(raw);
    return isPlainObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export async function prepareOpenCodeRuntimeConfig(input: {
  env: Record<string, string>;
  config: Record<string, unknown>;
  targetIsRemote?: boolean;
}): Promise<PreparedOpenCodeRuntimeConfig> {
  const skipPermissions = asBoolean(input.config.dangerouslySkipPermissions, true);
  const providerConfig = resolveOpenCodeProviderRuntimeConfig(input.config);
  if (!skipPermissions && !providerConfig) {
    return {
      env: input.env,
      notes: [],
      cleanup: async () => {},
    };
  }

  // For remote execution targets the host XDG_CONFIG_HOME path is meaningless
  // (and actively harmful — it leaks a macOS-only path into the remote Linux
  // env). Callers that need to ship a runtime opencode config to the remote
  // box do that via prepareAdapterExecutionTargetRuntime in execute.ts; this
  // host-fs helper is local-only.
  if (input.targetIsRemote && !providerConfig) {
    return {
      env: input.env,
      notes: [],
      cleanup: async () => {},
    };
  }

  const sourceConfigDir = path.join(resolveXdgConfigHome(input.env), "opencode");
  const runtimeConfigHome = await fs.mkdtemp(path.join(os.tmpdir(), "paperclip-opencode-config-"));
  const runtimeConfigDir = path.join(runtimeConfigHome, "opencode");
  const runtimeConfigPath = path.join(runtimeConfigDir, "opencode.json");

  await fs.mkdir(runtimeConfigDir, { recursive: true });
  try {
    await fs.cp(sourceConfigDir, runtimeConfigDir, {
      recursive: true,
      force: true,
      errorOnExist: false,
      dereference: false,
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException | null)?.code !== "ENOENT") {
      throw err;
    }
  }

  const existingConfig = await readJsonObject(runtimeConfigPath);
  const existingPermission = isPlainObject(existingConfig.permission)
    ? existingConfig.permission
    : {};
  const existingProviders = isPlainObject(existingConfig.provider)
    ? existingConfig.provider
    : {};
  const nextConfig = {
    ...existingConfig,
    ...(existingConfig.$schema ? {} : { $schema: "https://opencode.ai/config.json" }),
    ...(skipPermissions
      ? {
          permission: {
            ...existingPermission,
            external_directory: "allow",
          },
        }
      : {}),
    ...(providerConfig
      ? {
          provider: {
            ...existingProviders,
            [providerConfig.providerId]: providerConfig.provider,
          },
        }
      : {}),
  };
  await fs.writeFile(runtimeConfigPath, `${JSON.stringify(nextConfig, null, 2)}\n`, "utf8");

  const notes = [
    ...(skipPermissions
      ? [
          "Injected runtime OpenCode config with permission.external_directory=allow to avoid headless approval prompts.",
        ]
      : []),
    ...(providerConfig ? [providerConfig.note] : []),
  ];

  return {
    env: {
      ...input.env,
      XDG_CONFIG_HOME: runtimeConfigHome,
    },
    notes,
    cleanup: async () => {
      await fs.rm(runtimeConfigHome, { recursive: true, force: true });
    },
  };
}
