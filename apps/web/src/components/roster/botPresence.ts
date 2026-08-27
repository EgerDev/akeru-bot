import { EnvironmentId, ThreadId, type ScopedThreadRef } from "@t3tools/contracts";
import { useMemo } from "react";

import { useThreadShell, useThreadShells } from "../../state/entities";
import { usePrimaryEnvironmentId } from "../../state/environments";
import { findLatestBotThreadTarget, findLatestGroupThreadTarget } from "./botThreadRuntime.logic";
import { parseChatPath, resolveBotPresence, type RosterPresence } from "./roster.logic";
import { useRosterStore } from "./rosterStore";

/**
 * Live presence for one bot, derived from its latest durable server thread.
 */
export function useBotPresence(botId: string): RosterPresence {
  const chatPath = useRosterStore((state) => state.chatPathByBotId[botId] ?? null);
  const environmentId = usePrimaryEnvironmentId();
  const threadShells = useThreadShells();
  const ref = useMemo<ScopedThreadRef | null>(() => {
    const durableTarget = environmentId
      ? findLatestBotThreadTarget(botId, environmentId, threadShells)
      : null;
    const target = durableTarget ?? (chatPath === null ? null : parseChatPath(chatPath));
    return target
      ? {
          environmentId: EnvironmentId.make(target.environmentId),
          threadId: ThreadId.make(target.threadId),
        }
      : null;
  }, [botId, chatPath, environmentId, threadShells]);
  return resolveBotPresence(useThreadShell(ref));
}

/** Live presence for a group, derived from its latest durable server thread. */
export function useGroupPresence(groupId: string): RosterPresence {
  const environmentId = usePrimaryEnvironmentId();
  const threadShells = useThreadShells();
  const ref = useMemo<ScopedThreadRef | null>(() => {
    const target = environmentId
      ? findLatestGroupThreadTarget(groupId, environmentId, threadShells)
      : null;
    return target
      ? {
          environmentId: EnvironmentId.make(target.environmentId),
          threadId: ThreadId.make(target.threadId),
        }
      : null;
  }, [environmentId, groupId, threadShells]);
  return resolveBotPresence(useThreadShell(ref));
}
