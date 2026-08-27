import {
  EnvironmentId,
  ProjectId,
  ProviderDriverKind,
  ProviderInstanceId,
  ThreadId,
  type ServerProvider,
} from "@t3tools/contracts";
import { DEFAULT_UNIFIED_SETTINGS } from "@t3tools/contracts/settings";

import { DraftId } from "../composerDraftStore";
import type { ChatComposerProps } from "../components/chat/ChatComposer";
import type { Thread } from "../types";

/**
 * Shared ChatComposer fixtures for composer behavior tests. One configured
 * codex instance with one default model keeps model resolution deterministic.
 */
export const composerTestEnvironmentId = EnvironmentId.make("environment-local");
export const composerTestInstanceId = ProviderInstanceId.make("codex");
export const composerTestModelName = "Launchbar Model";

export function makeComposerTestProvider(): ServerProvider {
  return {
    instanceId: composerTestInstanceId,
    driver: ProviderDriverKind.make("codex"),
    enabled: true,
    installed: true,
    version: null,
    status: "ready",
    auth: { status: "authenticated" },
    checkedAt: "2026-01-01T00:00:00.000Z",
    models: [
      {
        slug: "gpt-5-codex",
        name: composerTestModelName,
        isCustom: false,
        isDefault: true,
        capabilities: {},
      },
    ],
    slashCommands: [],
    skills: [],
  };
}

export function makeComposerTestThread(overrides: Partial<Thread> = {}): Thread {
  return {
    id: ThreadId.make("thread-1"),
    environmentId: composerTestEnvironmentId,
    projectId: ProjectId.make("project-1"),
    title: "Thread",
    modelSelection: { instanceId: composerTestInstanceId, model: "gpt-5-codex" },
    runtimeMode: "full-access",
    interactionMode: "default",
    session: null,
    messages: [],
    proposedPlans: [],
    createdAt: "2026-03-01T00:00:00.000Z",
    archivedAt: null,
    settledOverride: null,
    settledAt: null,
    deletedAt: null,
    updatedAt: "2026-03-01T00:00:00.000Z",
    latestTurn: null,
    branch: null,
    worktreePath: null,
    checkpoints: [],
    activities: [],
    ...overrides,
  };
}

export function makeChatComposerProps(
  overrides: Partial<ChatComposerProps> = {},
): ChatComposerProps {
  const draftId = DraftId.make("draft-1");
  return {
    composerDraftTarget: draftId,
    environmentId: composerTestEnvironmentId,
    attachmentUploadsCapabilityKnown: true,
    supportsAttachmentUploads: true,
    routeKind: "draft",
    draftId,
    activeThreadId: ThreadId.make("thread-1"),
    activeThreadEnvironmentId: composerTestEnvironmentId,
    activeThread: makeComposerTestThread(),
    isServerThread: false,
    isLocalDraftThread: true,
    forceExpandedOnMobile: false,
    projectSelectionRequired: false,
    phase: "ready",
    isConnecting: false,
    isSendBusy: false,
    sendDisabledReason: null,
    isPreparingWorktree: false,
    externalDrawerAttached: false,
    environmentUnavailable: null,
    activePendingApproval: null,
    pendingApprovals: [],
    pendingUserInputs: [],
    activePendingProgress: null,
    activePendingResolvedAnswers: null,
    activePendingIsResponding: false,
    activePendingDraftAnswers: {},
    activePendingQuestionIndex: 0,
    respondingRequestIds: [],
    showPlanFollowUpPrompt: false,
    activeProposedPlan: null,
    activeTasksProgress: null,
    activeTaskSteps: null,
    lockedProvider: null,
    providerStatuses: [makeComposerTestProvider()],
    activeProjectDefaultModelSelection: {
      instanceId: composerTestInstanceId,
      model: "gpt-5-codex",
    },
    activeThreadModelSelection: { instanceId: composerTestInstanceId, model: "gpt-5-codex" },
    activeContextWindow: null,
    compactDisabled: false,
    compactDisabledReason: null,
    resolvedTheme: "dark",
    settings: DEFAULT_UNIFIED_SETTINGS,
    keybindings: [],
    terminalOpen: false,
    gitCwd: "/repo",
    promptRef: { current: "" },
    composerImagesRef: { current: [] },
    composerTerminalContextsRef: { current: [] },
    composerElementContextsRef: { current: [] },
    composerRef: { current: null },
    onSend: () => {},
    onInterrupt: () => {},
    onImplementPlanInNewThread: () => {},
    onRespondToApproval: async () => undefined,
    onSelectActivePendingUserInputOption: () => {},
    onAdvanceActivePendingUserInput: () => {},
    onPreviousActivePendingUserInputQuestion: () => {},
    onChangeActivePendingUserInputCustomAnswer: () => {},
    onProviderModelSelect: () => {},
    getModelDisabledReason: () => null,
    focusComposer: () => {},
    setThreadError: () => {},
    onExpandImage: () => {},
    ...overrides,
  };
}
