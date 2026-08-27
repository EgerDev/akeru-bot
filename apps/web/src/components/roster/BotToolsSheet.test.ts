import { McpServerId, type McpServer } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import type { PluginDefinition } from "../../../../../plugins";
import { buildBotToolItems, planBotToolToggle } from "./BotToolsSheet";

const installedPlugin: PluginDefinition = {
  id: "exa",
  title: "Exa",
  description: "Search the web.",
  category: "Search",
  logo: { src: "/plugin-logos/exa.svg" },
  kind: "mcp-url",
  authentication: "optional-oauth",
  url: "https://mcp.exa.ai/mcp",
  builtin: true,
};

const globalServer: McpServer = {
  id: McpServerId.make("builtin-exa"),
  name: "Exa",
  transport: "url",
  url: "https://mcp.exa.ai/mcp",
  enabled: true,
  createdAt: "2026-08-27T00:00:00.000Z",
  updatedAt: "2026-08-27T00:00:00.000Z",
};

describe("bot plugin exclusions", () => {
  it("shows globally installed plugins to every bot by default", () => {
    expect(buildBotToolItems([globalServer], [installedPlugin])).toMatchObject([
      {
        id: "builtin-exa",
        kind: "plugin",
        name: "Exa",
        workspaceEnabled: true,
      },
    ]);
  });

  it("hides workspace-disabled tools from bot overrides", () => {
    expect(buildBotToolItems([{ ...globalServer, enabled: false }], [installedPlugin])).toEqual([]);
  });

  it("stores only per-bot exclusions when a bot disables a plugin", () => {
    const exaId = McpServerId.make("builtin-exa");
    const otherId = McpServerId.make("custom-other");

    expect(planBotToolToggle([], exaId, false)).toEqual([exaId]);
    expect(planBotToolToggle([exaId, otherId], exaId, true)).toEqual([otherId]);
  });
});
