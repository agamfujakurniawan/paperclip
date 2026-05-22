import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import {
  CODEX_LOCAL_DEFAULT_PROVIDER_WIRE_API,
  CODEX_LOCAL_MODELARK_MODEL,
  CODEX_LOCAL_PROVIDER_CUSTOM_OPENAI,
  CODEX_LOCAL_PROVIDER_MODELARK,
  CODEX_LOCAL_PROVIDER_OPENAI,
  DEFAULT_CODEX_LOCAL_BYPASS_APPROVALS_AND_SANDBOX,
  DEFAULT_CODEX_LOCAL_MODEL,
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

function parseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
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

function readWireApi(record: Record<string, unknown>): string {
  const wireApi = readString(record, "codexProviderWireApi");
  return wireApi === CODEX_LOCAL_DEFAULT_PROVIDER_WIRE_API
    ? wireApi
    : CODEX_LOCAL_DEFAULT_PROVIDER_WIRE_API;
}

export function buildCodexLocalConfig(v: CreateConfigValues): Record<string, unknown> {
  const ac: Record<string, unknown> = {};
  const adapterSchemaValues = parseRecord(v.adapterSchemaValues);
  const codexProvider = readString(adapterSchemaValues, "codexProvider") || CODEX_LOCAL_PROVIDER_OPENAI;
  if (v.cwd) ac.cwd = v.cwd;
  if (v.instructionsFilePath) ac.instructionsFilePath = v.instructionsFilePath;
  ac.model =
    codexProvider === CODEX_LOCAL_PROVIDER_MODELARK && (!v.model || v.model === DEFAULT_CODEX_LOCAL_MODEL)
      ? CODEX_LOCAL_MODELARK_MODEL
      : v.model || DEFAULT_CODEX_LOCAL_MODEL;
  if (codexProvider === CODEX_LOCAL_PROVIDER_MODELARK) {
    ac.codexProvider = CODEX_LOCAL_PROVIDER_MODELARK;
  } else if (codexProvider === CODEX_LOCAL_PROVIDER_CUSTOM_OPENAI) {
    ac.codexProvider = CODEX_LOCAL_PROVIDER_CUSTOM_OPENAI;
    const providerId = readString(adapterSchemaValues, "codexProviderId");
    const providerName = readString(adapterSchemaValues, "codexProviderName");
    const providerBaseUrl = readString(adapterSchemaValues, "codexProviderBaseUrl");
    const providerEnvKey = readString(adapterSchemaValues, "codexProviderEnvKey");
    const providerWireApi = readWireApi(adapterSchemaValues);
    if (providerId) ac.codexProviderId = providerId;
    if (providerName) ac.codexProviderName = providerName;
    if (providerBaseUrl) ac.codexProviderBaseUrl = providerBaseUrl;
    if (providerEnvKey) ac.codexProviderEnvKey = providerEnvKey;
    if (providerWireApi) ac.codexProviderWireApi = providerWireApi;
  }
  if (v.thinkingEffort) ac.modelReasoningEffort = v.thinkingEffort;
  ac.timeoutSec = 0;
  ac.graceSec = 15;
  const env = parseEnvBindings(v.envBindings);
  const legacy = parseEnvVars(v.envVars);
  for (const [key, value] of Object.entries(legacy)) {
    if (!Object.prototype.hasOwnProperty.call(env, key)) {
      env[key] = { type: "plain", value };
    }
  }
  if (Object.keys(env).length > 0) ac.env = env;
  ac.search = v.search;
  ac.fastMode = v.fastMode;
  ac.dangerouslyBypassApprovalsAndSandbox =
    typeof v.dangerouslyBypassSandbox === "boolean"
      ? v.dangerouslyBypassSandbox
      : DEFAULT_CODEX_LOCAL_BYPASS_APPROVALS_AND_SANDBOX;
  if (v.workspaceStrategyType === "git_worktree") {
    ac.workspaceStrategy = {
      type: "git_worktree",
      ...(v.workspaceBaseRef ? { baseRef: v.workspaceBaseRef } : {}),
      ...(v.workspaceBranchTemplate ? { branchTemplate: v.workspaceBranchTemplate } : {}),
      ...(v.worktreeParentDir ? { worktreeParentDir: v.worktreeParentDir } : {}),
    };
  }
  const runtimeServices = parseJsonObject(v.runtimeServicesJson ?? "");
  if (runtimeServices && Array.isArray(runtimeServices.services)) {
    ac.workspaceRuntime = runtimeServices;
  }
  if (v.command) ac.command = v.command;
  if (v.extraArgs) ac.extraArgs = parseCommaArgs(v.extraArgs);
  return ac;
}
