import { LocalFilesystem, LocalSandbox, Workspace } from "@mastra/core/workspace";
import { assert, describe, expect, it, vi } from "vite-plus/test";

import { createBotWorkspace, isRemoteBotSandbox } from "./botWorkspace.ts";

describe("createBotWorkspace", () => {
  it("treats vercel, akeru-cloud, and upstash as remote sandboxes", () => {
    expect(isRemoteBotSandbox("local")).toBe(false);
    expect(isRemoteBotSandbox(null)).toBe(false);
    expect(isRemoteBotSandbox("vercel")).toBe(true);
    expect(isRemoteBotSandbox("akeru-cloud")).toBe(true);
    expect(isRemoteBotSandbox("upstash")).toBe(true);
  });

  it("builds a local Mastra workspace from the thread cwd", async () => {
    const workspace = await createBotWorkspace({
      threadId: "thread-local",
      cwd: process.cwd(),
      sandbox: "local",
    });
    assert.isDefined(workspace);
    expect(workspace?.sandbox).toBeInstanceOf(LocalSandbox);
    expect(workspace?.filesystem).toBeInstanceOf(LocalFilesystem);
    await workspace?.destroy();
  });

  it("uses the selected remote sandbox provider", async () => {
    const remote = new Workspace({
      filesystem: new LocalFilesystem({ basePath: process.cwd() }),
      sandbox: new LocalSandbox({ workingDirectory: process.cwd() }),
    });
    const makeRemoteWorkspace = vi.fn(async () => remote);
    const workspace = await createBotWorkspace({
      threadId: "thread-vercel",
      cwd: process.cwd(),
      sandbox: "vercel",
      makeRemoteWorkspace,
    });
    expect(makeRemoteWorkspace).toHaveBeenCalledOnce();
    expect(makeRemoteWorkspace).toHaveBeenCalledWith({
      threadId: "thread-vercel",
      sandbox: "vercel",
    });
    expect(workspace).toBe(remote);
    await workspace?.destroy();
  });
});
