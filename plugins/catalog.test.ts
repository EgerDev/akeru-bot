import * as NodeFS from "node:fs";
import { describe, expect, it } from "vite-plus/test";

import context from "./context";
import { loadCatalog } from "./index";

const CATALOG_IDS = ["context", "exa", "executor", "firecrawl", "parallel-search"];
const DISALLOWED_ID_PART = ["pipe", "dream"].join("");

describe("plugin catalog", () => {
  it("loads the focused builtin catalog with unique launch recipes", () => {
    const catalog = loadCatalog();
    const ids = catalog.map((plugin) => plugin.id);
    expect(ids.toSorted()).toEqual(CATALOG_IDS);
    expect(new Set(ids).size).toBe(catalog.length);
    expect(ids.some((id) => id.includes(DISALLOWED_ID_PART))).toBe(false);
    for (const plugin of catalog) {
      expect(plugin.builtin).toBe(true);
      expect(plugin.featured).toBe(true);
      expect(plugin.title.trim()).not.toBe("");
      expect(plugin.description.trim()).not.toBe("");
      expect(plugin.category.trim()).not.toBe("");
      expect(
        NodeFS.existsSync(new URL(`../apps/web/public${plugin.logo.src}`, import.meta.url)),
      ).toBe(true);
      if (plugin.logo.darkSrc) {
        expect(
          NodeFS.existsSync(new URL(`../apps/web/public${plugin.logo.darkSrc}`, import.meta.url)),
        ).toBe(true);
      }
      if (plugin.docsUrl) expect(plugin.docsUrl).toMatch(/^https:\/\//);
      for (const skill of plugin.skills ?? []) {
        expect(skill.title.trim()).not.toBe("");
        expect(skill.description.trim()).not.toBe("");
        expect(skill.url).toMatch(/^https:\/\/skills\.sh\//);
      }
      if (plugin.kind === "mcp-url") {
        expect(plugin.url).toMatch(/^https:\/\//);
        expect(["none", "oauth", "optional-oauth"]).toContain(plugin.authentication);
      } else {
        expect(plugin.command.trim()).not.toBe("");
      }
    }
  });

  it("keeps the verified hosted services in focused sections", () => {
    const byId = new Map(loadCatalog().map((plugin) => [plugin.id, plugin]));

    expect(byId.get("context")).toMatchObject({
      category: "Data Extraction",
      url: "https://mcp.context.dev/mcp",
      authentication: "oauth",
    });
    expect(byId.get("firecrawl")).toMatchObject({
      category: "Data Extraction",
      url: "https://mcp.firecrawl.dev/v2/mcp-oauth",
      authentication: "oauth",
    });
    expect(byId.get("exa")).toMatchObject({
      category: "Search",
      url: "https://mcp.exa.ai/mcp",
      authentication: "optional-oauth",
    });
    expect(byId.get("parallel-search")).toMatchObject({
      category: "Search",
      url: "https://search.parallel.ai/mcp-oauth",
      authentication: "oauth",
    });
    expect(byId.get("executor")).toMatchObject({
      category: "Productivity",
      command: "bunx",
      args: ["-y", "executor", "mcp"],
    });
    expect(byId.get("firecrawl")?.skills?.[0]?.url).toBe(
      "https://skills.sh/firecrawl/cli/firecrawl",
    );
    expect(byId.get("exa")?.skills?.[0]?.url).toBe(
      "https://skills.sh/exa-labs/agent-skills/exa-search",
    );
    expect(byId.get("parallel-search")?.skills?.[0]?.url).toBe(
      "https://skills.sh/parallel-web/parallel-agent-skills/parallel-web-search",
    );
  });

  it("rejects duplicate ids", () => {
    expect(() =>
      loadCatalog({
        "./context.ts": { default: context },
        "./context-copy.ts": { default: context },
      }),
    ).toThrow("Duplicate plugin id 'context'");
  });
});
