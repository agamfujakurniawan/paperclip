import type { AdapterConfigFieldsProps } from "../types";
import {
  Field,
  ToggleField,
  DraftInput,
  help,
} from "../../components/agent-config-primitives";
import { ChoosePathButton } from "../../components/PathInstructionsModal";
import { LocalWorkspaceRuntimeFields } from "../local-workspace-runtime-fields";
import {
  CODEX_LOCAL_FAST_MODE_SUPPORTED_MODELS,
  CODEX_LOCAL_MODELARK_BASE_URL,
  CODEX_LOCAL_MODELARK_ENV_KEY,
  CODEX_LOCAL_MODELARK_MODEL,
  CODEX_LOCAL_MODELARK_PROVIDER_ID,
  CODEX_LOCAL_PROVIDER_CUSTOM_OPENAI,
  CODEX_LOCAL_PROVIDER_MODELARK,
  CODEX_LOCAL_PROVIDER_OPENAI,
  DEFAULT_CODEX_LOCAL_MODEL,
  isCodexLocalFastModeSupported,
  isCodexLocalManualModel,
} from "@paperclipai/adapter-codex-local";

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";
const instructionsFileHint =
  "Absolute path to a markdown file (e.g. AGENTS.md) that defines this agent's behavior. Injected into the system prompt at runtime. Note: Codex may still auto-apply repo-scoped AGENTS.md files from the workspace.";

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function CodexLocalConfigFields({
  mode,
  isCreate,
  adapterType,
  values,
  set,
  config,
  eff,
  mark,
  models,
  hideInstructionsFile,
}: AdapterConfigFieldsProps) {
  const bypassEnabled =
    config.dangerouslyBypassApprovalsAndSandbox === true || config.dangerouslyBypassSandbox === true;
  const fastModeEnabled = isCreate
    ? Boolean(values!.fastMode)
    : eff("adapterConfig", "fastMode", Boolean(config.fastMode));
  const currentModel = isCreate
    ? String(values!.model ?? "")
    : eff("adapterConfig", "model", String(config.model ?? ""));
  const fastModeManualModel = isCodexLocalManualModel(currentModel);
  const fastModeSupported = isCodexLocalFastModeSupported(currentModel);
  const supportedModelsLabel = CODEX_LOCAL_FAST_MODE_SUPPORTED_MODELS.join(", ");
  const fastModeMessage = fastModeManualModel
    ? "Fast mode will be passed through for this manual model. If Codex rejects it, turn the toggle off."
    : fastModeSupported
      ? "Fast mode consumes credits/tokens much faster than standard Codex runs."
      : `Fast mode currently only works on ${supportedModelsLabel} or manual model IDs. Paperclip will ignore this toggle until the model is switched.`;
  const createProviderValues = (values?.adapterSchemaValues ?? {}) as Record<string, unknown>;
  const providerValue = isCreate
    ? readString(createProviderValues.codexProvider, CODEX_LOCAL_PROVIDER_OPENAI)
    : eff(
        "adapterConfig",
        "codexProvider",
        readString(config.codexProvider, CODEX_LOCAL_PROVIDER_OPENAI),
      );
  const codexProvider = providerValue || CODEX_LOCAL_PROVIDER_OPENAI;

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

  const setCodexProvider = (nextProvider: string) => {
    if (isCreate) {
      const nextValues = { ...createProviderValues };
      if (nextProvider === CODEX_LOCAL_PROVIDER_OPENAI) delete nextValues.codexProvider;
      else nextValues.codexProvider = nextProvider;
      const patch: { adapterSchemaValues: Record<string, unknown>; model?: string } = {
        adapterSchemaValues: nextValues,
      };
      if (
        nextProvider === CODEX_LOCAL_PROVIDER_MODELARK &&
        (!values!.model || values!.model === DEFAULT_CODEX_LOCAL_MODEL)
      ) {
        patch.model = CODEX_LOCAL_MODELARK_MODEL;
      }
      set!(patch);
      return;
    }
    mark(
      "adapterConfig",
      "codexProvider",
      nextProvider === CODEX_LOCAL_PROVIDER_OPENAI ? undefined : nextProvider,
    );
    if (
      nextProvider === CODEX_LOCAL_PROVIDER_MODELARK &&
      (!currentModel || currentModel === DEFAULT_CODEX_LOCAL_MODEL)
    ) {
      mark("adapterConfig", "model", CODEX_LOCAL_MODELARK_MODEL);
    }
  };

  const customProviderId = providerFieldValue("codexProviderId");
  const customProviderName = providerFieldValue("codexProviderName");
  const customProviderBaseUrl = providerFieldValue("codexProviderBaseUrl");
  const customProviderEnvKey = providerFieldValue("codexProviderEnvKey");
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
      <ToggleField
        label="Bypass sandbox"
        hint={help.dangerouslyBypassSandbox}
        checked={
          isCreate
            ? values!.dangerouslyBypassSandbox
            : eff(
                "adapterConfig",
                "dangerouslyBypassApprovalsAndSandbox",
                bypassEnabled,
              )
        }
        onChange={(v) =>
          isCreate
            ? set!({ dangerouslyBypassSandbox: v })
            : mark("adapterConfig", "dangerouslyBypassApprovalsAndSandbox", v)
        }
      />
      <ToggleField
        label="Enable search"
        hint={help.search}
        checked={
          isCreate
            ? values!.search
            : eff("adapterConfig", "search", !!config.search)
        }
        onChange={(v) =>
          isCreate
            ? set!({ search: v })
            : mark("adapterConfig", "search", v)
        }
      />
      <ToggleField
        label="Fast mode"
        hint={help.fastMode}
        checked={fastModeEnabled}
        onChange={(v) =>
          isCreate
            ? set!({ fastMode: v })
            : mark("adapterConfig", "fastMode", v)
        }
      />
      {fastModeEnabled && (
        <div className="rounded-md border border-amber-300/70 bg-amber-50/80 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          {fastModeMessage}
        </div>
      )}
      <Field
        label="Codex provider"
        hint="Default uses Codex's built-in OpenAI provider. ModelArk/custom providers are passed through as Codex model_provider overrides."
      >
        <select
          className={inputClass}
          value={codexProvider}
          onChange={(event) => setCodexProvider(event.target.value)}
        >
          <option value={CODEX_LOCAL_PROVIDER_OPENAI}>OpenAI (default)</option>
          <option value={CODEX_LOCAL_PROVIDER_MODELARK}>BytePlus ModelArk</option>
          <option value={CODEX_LOCAL_PROVIDER_CUSTOM_OPENAI}>Custom OpenAI-compatible</option>
        </select>
      </Field>
      {codexProvider === CODEX_LOCAL_PROVIDER_MODELARK && (
        <div className="rounded-md border border-sky-300/70 bg-sky-50/80 px-3 py-2 text-sm text-sky-900 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100">
          ModelArk uses provider <code>{CODEX_LOCAL_MODELARK_PROVIDER_ID}</code>, base URL <code>{CODEX_LOCAL_MODELARK_BASE_URL}</code>, env key <code>{CODEX_LOCAL_MODELARK_ENV_KEY}</code>, and model <code>{CODEX_LOCAL_MODELARK_MODEL}</code>. Add <code>{CODEX_LOCAL_MODELARK_ENV_KEY}</code> below in Environment variables.
        </div>
      )}
      {codexProvider === CODEX_LOCAL_PROVIDER_CUSTOM_OPENAI && (
        <>
          <Field label="Custom provider ID" hint="Codex model_provider id. Use letters, digits, and underscores only, e.g. proxy or modelark.">
            <DraftInput
              value={customProviderId}
              onCommit={(v) => setProviderField("codexProviderId", v.trim())}
              immediate
              className={inputClass}
              placeholder="proxy"
            />
          </Field>
          <Field label="Custom provider name" hint="Display name written to Codex model_providers.<id>.name.">
            <DraftInput
              value={customProviderName}
              onCommit={(v) => setProviderField("codexProviderName", v.trim())}
              immediate
              className={inputClass}
              placeholder="OpenAI-compatible proxy"
            />
          </Field>
          <Field label="Custom provider base URL" hint="OpenAI-compatible API base URL passed as model_providers.<id>.base_url.">
            <DraftInput
              value={customProviderBaseUrl}
              onCommit={(v) => setProviderField("codexProviderBaseUrl", v.trim())}
              immediate
              className={inputClass}
              placeholder="https://proxy.example.com/v1"
            />
          </Field>
          <Field label="Custom provider env key" hint="Environment variable Codex should read for the provider API key. Add the same key below in Environment variables.">
            <DraftInput
              value={customProviderEnvKey}
              onCommit={(v) => setProviderField("codexProviderEnvKey", v.trim())}
              immediate
              className={inputClass}
              placeholder="PROXY_API_KEY"
            />
          </Field>
          <div className="rounded-md border border-muted-foreground/20 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Codex currently supports <code>wire_api=&quot;responses&quot;</code> for custom providers; Paperclip applies that override automatically.
          </div>
        </>
      )}
      <LocalWorkspaceRuntimeFields
        isCreate={isCreate}
        values={values}
        set={set}
        config={config}
        mark={mark}
        eff={eff}
        mode={mode}
        adapterType={adapterType}
        models={models}
      />
    </>
  );
}
