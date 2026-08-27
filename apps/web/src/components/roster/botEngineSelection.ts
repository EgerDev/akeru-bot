import {
  ProviderInstanceId,
  type BotEngine,
  type ServerProvider,
  type UnifiedSettings,
} from "@t3tools/contracts";

import { resolveAppModelSelectionForInstance } from "../../modelSelection";
import {
  resolveSelectableProviderInstanceEntry,
  type ProviderInstanceEntry,
} from "../../providerInstances";

export function resolveStickyBotEngine(input: {
  readonly engine: BotEngine | null;
  readonly instanceEntries: ReadonlyArray<ProviderInstanceEntry>;
  readonly settings: UnifiedSettings;
  readonly providers: ReadonlyArray<ServerProvider>;
  readonly defaultSelection: { readonly instanceId: ProviderInstanceId; readonly model: string };
}): { readonly instanceId: ProviderInstanceId; readonly model: string } | null {
  const preferredId = ProviderInstanceId.make(
    input.engine?.provider ?? input.defaultSelection.instanceId,
  );
  const entry =
    resolveSelectableProviderInstanceEntry(input.instanceEntries, preferredId) ??
    input.instanceEntries[0] ??
    null;
  if (!entry) return null;
  if (input.engine && input.engine.provider === entry.instanceId) {
    return { instanceId: entry.instanceId, model: input.engine.model };
  }
  const model =
    resolveAppModelSelectionForInstance(entry.instanceId, input.settings, input.providers, null) ??
    input.defaultSelection.model;
  return { instanceId: entry.instanceId, model };
}
