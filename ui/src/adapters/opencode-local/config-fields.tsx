import type { AdapterConfigFieldsProps } from "../types";
import {
  Field,
  ToggleField,
  DraftInput,
  help,
} from "../../components/agent-config-primitives";
import { ChoosePathButton } from "../../components/PathInstructionsModal";
import {
  DEFAULT_OPENCODE_LOCAL_CHEAP_MODEL,
  DEFAULT_OPENCODE_LOCAL_MODEL,
  OPENCODE_LOCAL_MODELARK_BASE_URL,
  OPENCODE_LOCAL_MODELARK_ENV_KEY,
  OPENCODE_LOCAL_MODELARK_MODEL,
  OPENCODE_LOCAL_MODELARK_MODEL_ID,
  OPENCODE_LOCAL_MODELARK_PROVIDER_ID,
  OPENCODE_LOCAL_OPENAI_COMPATIBLE_NPM,
  OPENCODE_LOCAL_PROVIDER_CUSTOM_OPENAI,
  OPENCODE_LOCAL_PROVIDER_DEFAULT,
  OPENCODE_LOCAL_PROVIDER_MODELARK,
} from "@paperclipai/adapter-opencode-local";

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";
const instructionsFileHint =
  "Absolute path to a markdown file (e.g. AGENTS.md) that defines this agent's behavior. Injected into the system prompt at runtime.";

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function shouldUseModelArkDefaultModel(model: string): boolean {
  return !model || model === DEFAULT_OPENCODE_LOCAL_MODEL || model === DEFAULT_OPENCODE_LOCAL_CHEAP_MODEL;
}

export function OpenCodeLocalConfigFields({
  isCreate,
  values,
  set,
  config,
  eff,
  mark,
  hideInstructionsFile,
}: AdapterConfigFieldsProps) {
  const createProviderValues = (values?.adapterSchemaValues ?? {}) as Record<string, unknown>;
  const providerValue = isCreate
    ? readString(createProviderValues.openCodeProvider, OPENCODE_LOCAL_PROVIDER_DEFAULT)
    : eff(
        "adapterConfig",
        "openCodeProvider",
        readString(config.openCodeProvider, OPENCODE_LOCAL_PROVIDER_DEFAULT),
      );
  const openCodeProvider = providerValue || OPENCODE_LOCAL_PROVIDER_DEFAULT;

  const providerFieldValue = (field: string, fallback = "") =>
    isCreate
      ? readString(createProviderValues[field], fallback)
      : eff("adapterConfig", field, readString(config[field], fallback));

  const setProviderField = (field: string, value: string) => {
    if (isCreate) {
      const nextValues = { ...createProviderValues };
      if (value) nextValues[field] = value;
      else delete nextValues[field];
      set!({ adapterSchemaValues: nextValues });
      return;
    }
    mark("adapterConfig", field, value || undefined);
  };

  const setOpenCodeProvider = (nextProvider: string) => {
    if (isCreate) {
      const nextValues = { ...createProviderValues };
      if (nextProvider === OPENCODE_LOCAL_PROVIDER_DEFAULT) delete nextValues.openCodeProvider;
      else nextValues.openCodeProvider = nextProvider;
      const patch: { adapterSchemaValues: Record<string, unknown>; model?: string } = {
        adapterSchemaValues: nextValues,
      };
      if (nextProvider === OPENCODE_LOCAL_PROVIDER_MODELARK && shouldUseModelArkDefaultModel(values!.model)) {
        patch.model = OPENCODE_LOCAL_MODELARK_MODEL;
      }
      set!(patch);
      return;
    }
    mark(
      "adapterConfig",
      "openCodeProvider",
      nextProvider === OPENCODE_LOCAL_PROVIDER_DEFAULT ? undefined : nextProvider,
    );
    const currentModel = readString(config.model);
    if (nextProvider === OPENCODE_LOCAL_PROVIDER_MODELARK && shouldUseModelArkDefaultModel(currentModel)) {
      mark("adapterConfig", "model", OPENCODE_LOCAL_MODELARK_MODEL);
    }
  };

  const customProviderId = providerFieldValue("openCodeProviderId");
  const customProviderName = providerFieldValue("openCodeProviderName");
  const customProviderBaseUrl = providerFieldValue("openCodeProviderBaseUrl");
  const customProviderEnvKey = providerFieldValue("openCodeProviderEnvKey");
  const customProviderModelId = providerFieldValue("openCodeProviderModelId");
  const customProviderNpm = providerFieldValue("openCodeProviderNpm", OPENCODE_LOCAL_OPENAI_COMPATIBLE_NPM);

  return (
    <>
      {!hideInstructionsFile && (
        <Field label="Agent instructions file" hint={instructionsFileHint}>
          <div className="flex items-center gap-2">
            <DraftInput
              value={
                isCreate
                  ? values!.instructionsFilePath ?? ""
                  : eff(
                      "adapterConfig",
                      "instructionsFilePath",
                      String(config.instructionsFilePath ?? ""),
                    )
              }
              onCommit={(v) =>
                isCreate
                  ? set!({ instructionsFilePath: v })
                  : mark("adapterConfig", "instructionsFilePath", v || undefined)
              }
              immediate
              className={inputClass}
              placeholder="/absolute/path/to/AGENTS.md"
            />
            <ChoosePathButton />
          </div>
        </Field>
      )}
      <Field
        label="OpenCode provider"
        hint="Default uses your existing OpenCode providers. ModelArk/custom inject an OpenCode provider config at runtime."
      >
        <select
          className={inputClass}
          value={openCodeProvider}
          onChange={(event) => setOpenCodeProvider(event.target.value)}
        >
          <option value={OPENCODE_LOCAL_PROVIDER_DEFAULT}>Configured in OpenCode</option>
          <option value={OPENCODE_LOCAL_PROVIDER_MODELARK}>BytePlus ModelArk</option>
          <option value={OPENCODE_LOCAL_PROVIDER_CUSTOM_OPENAI}>Custom OpenAI-compatible</option>
        </select>
      </Field>
      {openCodeProvider === OPENCODE_LOCAL_PROVIDER_MODELARK && (
        <div className="rounded-md border border-sky-300/70 bg-sky-50/80 px-3 py-2 text-sm text-sky-900 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100">
          OpenCode will use provider <code>{OPENCODE_LOCAL_MODELARK_PROVIDER_ID}</code>, base URL <code>{OPENCODE_LOCAL_MODELARK_BASE_URL}</code>, env key <code>{OPENCODE_LOCAL_MODELARK_ENV_KEY}</code>, and model <code>{OPENCODE_LOCAL_MODELARK_MODEL_ID}</code>. Add <code>{OPENCODE_LOCAL_MODELARK_ENV_KEY}</code> below in Environment variables.
        </div>
      )}
      {openCodeProvider === OPENCODE_LOCAL_PROVIDER_CUSTOM_OPENAI && (
        <>
          <Field label="Custom provider ID" hint="Provider id used in OpenCode model IDs, e.g. proxy for proxy/model-name.">
            <DraftInput
              value={customProviderId}
              onCommit={(v) => setProviderField("openCodeProviderId", v.trim())}
              immediate
              className={inputClass}
              placeholder="proxy"
            />
          </Field>
          <Field label="Custom provider name" hint="Display name written into OpenCode runtime config.">
            <DraftInput
              value={customProviderName}
              onCommit={(v) => setProviderField("openCodeProviderName", v.trim())}
              immediate
              className={inputClass}
              placeholder="OpenAI-compatible proxy"
            />
          </Field>
          <Field label="Custom provider base URL" hint="OpenAI-compatible API base URL for @ai-sdk/openai-compatible.">
            <DraftInput
              value={customProviderBaseUrl}
              onCommit={(v) => setProviderField("openCodeProviderBaseUrl", v.trim())}
              immediate
              className={inputClass}
              placeholder="https://proxy.example.com/v1"
            />
          </Field>
          <Field label="Custom provider env key" hint="Environment variable OpenCode should read for the provider API key. Add the same key below in Environment variables.">
            <DraftInput
              value={customProviderEnvKey}
              onCommit={(v) => setProviderField("openCodeProviderEnvKey", v.trim())}
              immediate
              className={inputClass}
              placeholder="PROXY_API_KEY"
            />
          </Field>
          <Field label="Custom provider model ID" hint="Model id inside the provider. The full Paperclip model should be provider/model.">
            <DraftInput
              value={customProviderModelId}
              onCommit={(v) => setProviderField("openCodeProviderModelId", v.trim())}
              immediate
              className={inputClass}
              placeholder="model-name"
            />
          </Field>
          <Field label="Custom provider SDK package" hint="Advanced: OpenCode AI SDK provider package. OpenAI-compatible chat providers normally use @ai-sdk/openai-compatible.">
            <DraftInput
              value={customProviderNpm}
              onCommit={(v) => setProviderField("openCodeProviderNpm", v.trim() || OPENCODE_LOCAL_OPENAI_COMPATIBLE_NPM)}
              immediate
              className={inputClass}
              placeholder={OPENCODE_LOCAL_OPENAI_COMPATIBLE_NPM}
            />
          </Field>
        </>
      )}
      <ToggleField
        label="Skip permissions"
        hint={help.dangerouslySkipPermissions}
        checked={
          isCreate
            ? values!.dangerouslySkipPermissions
            : eff(
                "adapterConfig",
                "dangerouslySkipPermissions",
                config.dangerouslySkipPermissions !== false,
              )
        }
        onChange={(v) =>
          isCreate
            ? set!({ dangerouslySkipPermissions: v })
            : mark("adapterConfig", "dangerouslySkipPermissions", v)
        }
      />
    </>
  );
}
