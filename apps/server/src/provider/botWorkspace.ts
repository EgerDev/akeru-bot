import { TOOL_NAME_OVERRIDES } from "@mastra/code-sdk/tool-names";
import { LocalFilesystem, LocalSandbox, Workspace } from "@mastra/core/workspace";
import type { BotSandbox } from "@t3tools/contracts";

export const REMOTE_BOT_SANDBOXES = ["vercel", "akeru-cloud", "upstash"] as const;
export type RemoteBotSandbox = (typeof REMOTE_BOT_SANDBOXES)[number];

export function isRemoteBotSandbox(
  value: BotSandbox | null | undefined,
): value is RemoteBotSandbox {
  return value === "vercel" || value === "akeru-cloud" || value === "upstash";
}

export interface CreateRemoteBotWorkspaceInput {
  readonly threadId: string;
  readonly sandbox: RemoteBotSandbox;
}

export interface CreateBotWorkspaceInput {
  readonly threadId: string;
  readonly cwd?: string;
  readonly sandbox?: BotSandbox | null;
  readonly makeRemoteWorkspace?: (input: CreateRemoteBotWorkspaceInput) => Promise<Workspace>;
}

export async function createBotWorkspace(
  input: CreateBotWorkspaceInput,
): Promise<Workspace | undefined> {
  if (isRemoteBotSandbox(input.sandbox)) {
    return await (input.makeRemoteWorkspace ?? createRemoteMastraWorkspace)({
      threadId: input.threadId,
      sandbox: input.sandbox,
    });
  }
  if (!input.cwd) return undefined;
  return new Workspace({
    id: `akeru-${input.threadId}`,
    name: `Akeru ${input.threadId}`,
    filesystem: new LocalFilesystem({ basePath: input.cwd }),
    sandbox: new LocalSandbox({ workingDirectory: input.cwd }),
    tools: TOOL_NAME_OVERRIDES,
  });
}

export async function createRemoteMastraWorkspace(
  input: CreateRemoteBotWorkspaceInput,
): Promise<Workspace> {
  const { createMastraWorkspace } = await import("@opencoredev/sandbox-sdk/mastra");
  return createMastraWorkspace({
    id: `akeru-${input.threadId}`,
    provider: await loadSandboxProvider(input.sandbox),
    workspace: {
      id: `akeru-${input.threadId}`,
      name: `Akeru ${input.threadId}`,
      tools: TOOL_NAME_OVERRIDES,
    },
  });
}

async function loadSandboxProvider(sandbox: RemoteBotSandbox) {
  if (sandbox === "vercel") {
    const { vercel } = await import("@opencoredev/sandbox-sdk/vercel");
    return vercel();
  }
  if (sandbox === "upstash") {
    const { upstash } = await import("@opencoredev/sandbox-sdk/upstash");
    return upstash();
  }
  const { e2b } = await import("@opencoredev/sandbox-sdk/e2b");
  return e2b();
}
