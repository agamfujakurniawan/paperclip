import { asString } from "@paperclipai/adapter-utils/server-utils";
import {
  CODEX_LOCAL_DEFAULT_PROVIDER_WIRE_API,
  CODEX_LOCAL_MODELARK_BASE_URL,
  CODEX_LOCAL_MODELARK_ENV_KEY,
  CODEX_LOCAL_MODELARK_PROVIDER_ID,
  CODEX_LOCAL_MODELARK_PROVIDER_NAME,
  CODEX_LOCAL_PROVIDER_CUSTOM_OPENAI,
  CODEX_LOCAL_PROVIDER_MODELARK,
} from "../index.js";

export type CodexLocalResolvedModelProvider = {
  id: string;
  name: string;
  baseUrl: string;
  envKey: string;
  wireApi: string;
};

const CODEX_PROVIDER_ID_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ENV_KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(record: Record<string, unknown>, key: string): string {
  return asString(record[key], "").trim();
}

function readWireApi(record: Record<string, unknown>): string {
  const wireApi = readString(record, "codexProviderWireApi");
  return wireApi === CODEX_LOCAL_DEFAULT_PROVIDER_WIRE_API
    ? wireApi
    : CODEX_LOCAL_DEFAULT_PROVIDER_WIRE_API;
}

export function resolveCodexLocalModelProvider(
  config: unknown,
): CodexLocalResolvedModelProvider | null {
  const record = asRecord(config);
  const provider = readString(record, "codexProvider");
  if (provider === CODEX_LOCAL_PROVIDER_MODELARK) {
    return {
      id: CODEX_LOCAL_MODELARK_PROVIDER_ID,
      name: CODEX_LOCAL_MODELARK_PROVIDER_NAME,
      baseUrl: CODEX_LOCAL_MODELARK_BASE_URL,
      envKey: CODEX_LOCAL_MODELARK_ENV_KEY,
      wireApi: CODEX_LOCAL_DEFAULT_PROVIDER_WIRE_API,
    };
  }

  if (provider !== CODEX_LOCAL_PROVIDER_CUSTOM_OPENAI) return null;

  const id = readString(record, "codexProviderId");
  const baseUrl = readString(record, "codexProviderBaseUrl");
  const envKey = readString(record, "codexProviderEnvKey");
  if (!CODEX_PROVIDER_ID_RE.test(id) || !baseUrl || !ENV_KEY_RE.test(envKey)) return null;

  return {
    id,
    name: readString(record, "codexProviderName") || id,
    baseUrl,
    envKey,
    wireApi: readWireApi(record),
  };
}

export function buildCodexModelProviderArgs(
  provider: CodexLocalResolvedModelProvider,
): string[] {
  const prefix = `model_providers.${provider.id}`;
  return [
    "-c",
    `model_provider=${JSON.stringify(provider.id)}`,
    "-c",
    `${prefix}.name=${JSON.stringify(provider.name)}`,
    "-c",
    `${prefix}.base_url=${JSON.stringify(provider.baseUrl)}`,
    "-c",
    `${prefix}.env_key=${JSON.stringify(provider.envKey)}`,
    "-c",
    `${prefix}.wire_api=${JSON.stringify(provider.wireApi)}`,
  ];
}
