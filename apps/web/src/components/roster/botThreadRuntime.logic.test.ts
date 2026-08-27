import { BotId, GroupId, ProjectId, ProviderInstanceId, ThreadId } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import {
  buildBotTurnStartInput,
  buildGroupTurnStartInput,
  findLatestBotThreadTarget,
  findLatestGroupThreadTarget,
} from "./botThreadRuntime.logic";

describe("bot thread runtime", () => {
  it("associates the first durable thread with its bot", () => {
    const input = buildBotTurnStartInput({
      botId: BotId.make("bot-akeru"),
      threadId: ThreadId.make("thread-akeru"),
      projectId: ProjectId.make("project-akeru"),
      title: "Hello",
      message: {
        messageId: "message-akeru" as never,
        role: "user",
        text: "Hello",
        attachments: [],
      },
      modelSelection: {
        instanceId: ProviderInstanceId.make("codex"),
        model: "gpt-5.6",
      },
      runtimeMode: "full-access",
      interactionMode: "default",
      createdAt: "2026-08-27T00:00:00.000Z",
      createThread: true,
    });

    expect(input.bootstrap?.createThread?.botId).toBe("bot-akeru");
    expect(input.bootstrap?.createThread?.projectId).toBe("project-akeru");
  });

  it("associates a group thread and routes a mention to its selected bot", () => {
    const input = buildGroupTurnStartInput({
      groupId: GroupId.make("group-product"),
      respondingBotId: BotId.make("bot-specialist"),
      threadId: ThreadId.make("thread-product"),
      projectId: ProjectId.make("project-akeru"),
      title: "Review this",
      message: {
        messageId: "message-product" as never,
        role: "user",
        text: "@Mori Review this",
        attachments: [],
      },
      modelSelection: {
        instanceId: ProviderInstanceId.make("codex"),
        model: "gpt-5.6",
      },
      runtimeMode: "full-access",
      interactionMode: "default",
      createdAt: "2026-08-27T00:00:00.000Z",
      createThread: true,
    });

    expect(input.bootstrap?.createThread?.groupId).toBe("group-product");
    expect(input.respondingBotId).toBe("bot-specialist");
  });

  it("restores the latest durable thread owned by the bot", () => {
    expect(
      findLatestBotThreadTarget("bot-akeru", "env-a", [
        {
          environmentId: "env-a",
          id: "thread-old",
          botId: "bot-akeru",
          updatedAt: "2026-08-26T00:00:00.000Z",
          archivedAt: null,
          deletedAt: null,
        },
        {
          environmentId: "env-a",
          id: "thread-other",
          botId: "bot-other",
          updatedAt: "2026-08-28T00:00:00.000Z",
          archivedAt: null,
          deletedAt: null,
        },
        {
          environmentId: "env-b",
          id: "thread-new",
          botId: "bot-akeru",
          updatedAt: "2026-08-27T00:00:00.000Z",
          archivedAt: null,
          deletedAt: null,
        },
      ]),
    ).toEqual({ environmentId: "env-a", threadId: "thread-old" });
  });

  it("restores the latest durable thread owned by a group", () => {
    expect(
      findLatestGroupThreadTarget("group-product", "env-a", [
        {
          environmentId: "env-a",
          id: "thread-old",
          groupId: "group-product",
          updatedAt: "2026-08-26T00:00:00.000Z",
          archivedAt: null,
        },
        {
          environmentId: "env-a",
          id: "thread-new",
          groupId: "group-product",
          updatedAt: "2026-08-27T00:00:00.000Z",
          archivedAt: null,
        },
      ]),
    ).toEqual({ environmentId: "env-a", threadId: "thread-new" });
  });
});
