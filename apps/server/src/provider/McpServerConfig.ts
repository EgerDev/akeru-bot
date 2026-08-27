import type { McpServer } from "@t3tools/contracts";
import type * as EffectAcpSchema from "effect-acp/schema";

export function toAcpMcpServers(
  servers: readonly McpServer[],
): ReadonlyArray<EffectAcpSchema.McpServer> {
  return servers.map((server) =>
    server.transport === "url"
      ? {
          type: "http" as const,
          name: server.name,
          url: server.url,
          headers: [],
        }
      : {
          name: server.name,
          command: server.command,
          args: [...(server.args ?? [])],
          env: [],
        },
  );
}

export function toClaudeMcpServers(servers: readonly McpServer[]) {
  return Object.fromEntries(
    servers.map((server) => [
      String(server.id),
      server.transport === "url"
        ? { type: "http" as const, url: server.url, headers: {} }
        : {
            type: "stdio" as const,
            command: server.command,
            args: [...(server.args ?? [])],
          },
    ]),
  );
}
