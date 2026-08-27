import { createBotEnvironmentAtoms } from "@t3tools/client-runtime/state/bots";
import type { EnvironmentId, OrchestrationBot, OrchestrationGroup } from "@t3tools/contracts";
import { Atom } from "effect/unstable/reactivity";

import { connectionAtomRuntime } from "../connection/runtime";
import { environmentSnapshotAtom } from "./shell";

const EMPTY_BOTS: ReadonlyArray<OrchestrationBot> = Object.freeze([]);
const EMPTY_GROUPS: ReadonlyArray<OrchestrationGroup> = Object.freeze([]);

export const botEnvironment = createBotEnvironmentAtoms(connectionAtomRuntime);

export const environmentBotsAtom = Atom.family((environmentId: EnvironmentId) =>
  Atom.make(
    (get): ReadonlyArray<OrchestrationBot> =>
      get(environmentSnapshotAtom(environmentId))?.bots ?? EMPTY_BOTS,
  ).pipe(Atom.withLabel(`web-bots:${environmentId}`)),
);

export const environmentGroupsAtom = Atom.family((environmentId: EnvironmentId) =>
  Atom.make(
    (get): ReadonlyArray<OrchestrationGroup> =>
      get(environmentSnapshotAtom(environmentId))?.groups ?? EMPTY_GROUPS,
  ).pipe(Atom.withLabel(`web-groups:${environmentId}`)),
);

/** Snapshot presence gates the server-backed roster swap and bootstrap. */
export const environmentRosterLoadedAtom = Atom.family((environmentId: EnvironmentId) =>
  Atom.make((get): boolean => get(environmentSnapshotAtom(environmentId)) !== null).pipe(
    Atom.withLabel(`web-roster-loaded:${environmentId}`),
  ),
);
