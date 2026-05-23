import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import {
  DEFAULT_OPENCODE_LOCAL_CHEAP_MODEL,
  DEFAULT_OPENCODE_LOCAL_MODEL,
  OPENCODE_LOCAL_MODELARK_MODEL,
  OPENCODE_LOCAL_OPENAI_COMPATIBLE_NPM,
  OPENCODE_LOCAL_PROVIDER_CUSTOM_OPENAI,
  OPENCODE_LOCAL_PROVIDER_DEFAULT,
  OPENCODE_LOCAL_PROVIDER_MODELARK,
} from "../index.js";

function parseCommaArgs(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseEnvVars(text: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1);
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    env[key] = value;
  }
  return env;
}

function parseEnvBindings(bindings: unknown): Record<string, unknown> {
  if (typeof bindings !== "object" || bindings === null || Array.isArray(bindings)) return {};
  const env: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(bindings)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (typeof raw === "string") {
      env[key] = { type: "plain", value: raw };
      continue;
    }
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) continue;
    const rec = raw as Record<string, unknown>;
    if (rec.type === "plain" && typeof rec.value === "string") {
      env[key] = { type: "plain", value: rec.value };
      continue;
    }
    if (rec.type === "secret_ref" && typeof rec.secretId === "string") {
      env[key] = {
        type: "secret_ref",
        secretId: rec.secretId,
        ...(typeof rec.version === "number" || rec.version === "latest"
          ? { version: rec.version }
          : {}),
      };
    }
  }
  return env;
}

function parseRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function shouldUseModelArkDefaultModel(model: string): boolean {
  return !model || model === DEFAULT_OPENCODE_LOCAL_MODEL || model === DEFAULT_OPENCODE_LOCAL_CHEAP_MODEL;
}

export function buildOpenCodeLocalConfig(v: CreateConfigValues): Record<string, unknown> {
  const ac: Record<string, unknown> = {};
  const adapterSchemaValues = parseRecord(v.adapterSchemaValues);
  const openCodeProvider = readString(adapterSchemaValues, "openCodeProvider") || OPENCODE_LOCAL_PROVIDER_DEFAULT;
  if (v.cwd) ac.cwd = v.cwd;
  if (v.instructionsFilePath) ac.instructionsFilePath = v.instructionsFilePath;
  const model = openCodeProvider === OPENCODE_LOCAL_PROVIDER_MODELARK && shouldUseModelArkDefaultModel(v.model)
    ? OPENCODE_LOCAL_MODELARK_MODEL
    : v.model;
  if (model) ac.model = model;
  if (openCodeProvider === OPENCODE_LOCAL_PROVIDER_MODELARK) {
    ac.openCodeProvider = OPENCODE_LOCAL_PROVIDER_MODELARK;
  } else if (openCodeProvider === OPENCODE_LOCAL_PROVIDER_CUSTOM_OPENAI) {
    ac.openCodeProvider = OPENCODE_LOCAL_PROVIDER_CUSTOM_OPENAI;
    const providerId = readString(adapterSchemaValues, "openCodeProviderId");
    const providerName = readString(adapterSchemaValues, "openCodeProviderName");
    const providerBaseUrl = readString(adapterSchemaValues, "openCodeProviderBaseUrl");
    const providerEnvKey = readString(adapterSchemaValues, "openCodeProviderEnvKey");
    const providerModelId = readString(adapterSchemaValues, "openCodeProviderModelId");
    const providerNpm = readString(adapterSchemaValues, "openCodeProviderNpm") || OPENCODE_LOCAL_OPENAI_COMPATIBLE_NPM;
    if (providerId) ac.openCodeProviderId = providerId;
    if (providerName) ac.openCodeProviderName = providerName;
    if (providerBaseUrl) ac.openCodeProviderBaseUrl = providerBaseUrl;
    if (providerEnvKey) ac.openCodeProviderEnvKey = providerEnvKey;
    if (providerModelId) ac.openCodeProviderModelId = providerModelId;
    if (providerNpm) ac.openCodeProviderNpm = providerNpm;
  }
  if (v.thinkingEffort) ac.variant = v.thinkingEffort;
  ac.dangerouslySkipPermissions = v.dangerouslySkipPermissions;
  // OpenCode sessions can run until the CLI exits naturally; keep timeout disabled (0)
  // and rely on graceSec for termination handling when a timeout is configured elsewhere.
  ac.timeoutSec = 0;
  ac.graceSec = 20;
  const env = parseEnvBindings(v.envBindings);
  const legacy = parseEnvVars(v.envVars);
  for (const [key, value] of Object.entries(legacy)) {
    if (!Object.prototype.hasOwnProperty.call(env, key)) {
      env[key] = { type: "plain", value };
    }
  }
  if (Object.keys(env).length > 0) ac.env = env;
  if (v.command) ac.command = v.command;
  if (v.extraArgs) ac.extraArgs = parseCommaArgs(v.extraArgs);
  return ac;
}
