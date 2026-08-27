import { ProviderDriverKind, ProviderInstanceId, type ServerProvider } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { deriveProviderInstanceEntries } from "../../providerInstances";
import { makeComposerTestProvider } from "../../test/chatComposerProps";
import { buildBotModelChoices } from "./BotModelPicker";

const codex = ProviderInstanceId.make("codex");
const claude = ProviderInstanceId.make("claude-work");

function makeClaudeProvider(): ServerProvider {
  return {
    ...makeComposerTestProvider(),
    instanceId: claude,
    driver: ProviderDriverKind.make("claudeAgent"),
    models: [
      {
        slug: "claude-fable-5",
        name: "Claude Fable 5",
        isCustom: false,
        isDefault: true,
        capabilities: {},
      },
    ],
  };
}

describe("bot model picker", () => {
  it("flattens subscription instances into model choices without provider rows", () => {
    const choices = buildBotModelChoices(
      deriveProviderInstanceEntries([makeComposerTestProvider(), makeClaudeProvider()]),
      new Map([
        [codex, [{ slug: "gpt-5.6", name: "GPT 5.6" }]],
        [claude, [{ slug: "claude-fable-5", name: "Claude Fable 5" }]],
      ]),
    );

    expect(choices).toEqual([
      { instanceId: codex, model: "gpt-5.6", label: "GPT 5.6" },
      { instanceId: claude, model: "claude-fable-5", label: "Claude Fable 5" },
    ]);
  });
});
