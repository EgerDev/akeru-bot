import { type ProviderInstanceId } from "@t3tools/contracts";

import type { ProviderInstanceEntry } from "../../providerInstances";
import { ProviderModelPicker } from "../chat/ProviderModelPicker";
import { getTriggerDisplayModelName, type ModelEsque } from "../chat/providerIconUtils";

export interface BotModelChoice {
  readonly instanceId: ProviderInstanceId;
  readonly model: string;
  readonly label: string;
}

export function buildBotModelChoices(
  instanceEntries: ReadonlyArray<ProviderInstanceEntry>,
  modelOptionsByInstance: ReadonlyMap<ProviderInstanceId, ReadonlyArray<ModelEsque>>,
): ReadonlyArray<BotModelChoice> {
  return instanceEntries.flatMap((entry) =>
    (modelOptionsByInstance.get(entry.instanceId) ?? []).map((model) => ({
      instanceId: entry.instanceId,
      model: model.slug,
      label: getTriggerDisplayModelName(model),
    })),
  );
}

/** The established T3 model menu, scoped to model selection for one bot. */
export function BotModelPicker({
  activeInstanceId,
  model,
  instanceEntries,
  modelOptionsByInstance,
  disabled = false,
  onChange,
}: {
  readonly activeInstanceId: ProviderInstanceId;
  readonly model: string;
  readonly instanceEntries: ReadonlyArray<ProviderInstanceEntry>;
  readonly modelOptionsByInstance: ReadonlyMap<ProviderInstanceId, ReadonlyArray<ModelEsque>>;
  readonly disabled?: boolean;
  readonly onChange: (instanceId: ProviderInstanceId, model: string) => void;
}) {
  return (
    <ProviderModelPicker
      activeInstanceId={activeInstanceId}
      model={model}
      lockedProvider={null}
      lockedContinuationGroupKey={null}
      instanceEntries={instanceEntries}
      modelOptionsByInstance={modelOptionsByInstance}
      compact
      disabled={disabled}
      triggerAriaLabel="Change model"
      triggerClassName="max-w-52"
      onInstanceModelChange={onChange}
    />
  );
}
