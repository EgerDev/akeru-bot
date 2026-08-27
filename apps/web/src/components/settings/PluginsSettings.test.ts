import { describe, expect, it } from "vite-plus/test";

import { validateMcpServerDraft } from "./PluginsSettings";

describe("raw MCP server settings", () => {
  it("accepts standard input/output and HTTP server configurations", () => {
    expect(
      validateMcpServerDraft({
        name: "Filesystem",
        transport: "stdio",
        command: "bunx",
        args: "@modelcontextprotocol/server-filesystem",
        url: "",
      }),
    ).toBeNull();
    expect(
      validateMcpServerDraft({
        name: "Remote",
        transport: "url",
        command: "",
        args: "",
        url: "https://mcp.example.com",
      }),
    ).toBeNull();
  });

  it("rejects missing commands and credentials embedded in URLs", () => {
    expect(
      validateMcpServerDraft({
        name: "Filesystem",
        transport: "stdio",
        command: " ",
        args: "",
        url: "",
      }),
    ).toBe("Command is required.");
    expect(
      validateMcpServerDraft({
        name: "Remote",
        transport: "url",
        command: "",
        args: "",
        url: "https://token@mcp.example.com",
      }),
    ).toBe("Store credentials outside the server URL.");
  });
});
