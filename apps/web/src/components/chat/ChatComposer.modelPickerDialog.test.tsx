import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { visitElements } from "../../test/reactElementTree";
import { reactHookHarness as hooks } from "../../test/reactHookHarness";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  const { reactHookHarness } = await import("../../test/reactHookHarness");
  return {
    ...actual,
    useCallback: reactHookHarness.useCallback,
    useMemo: reactHookHarness.useMemo,
    useRef: reactHookHarness.useRef,
    useState: reactHookHarness.useState,
    useEffect: () => {},
    useLayoutEffect: () => {},
    useDebugValue: () => {},
    useImperativeHandle: (
      ref: { current: unknown } | ((value: unknown) => void) | null,
      create: () => unknown,
    ) => {
      if (typeof ref === "function") {
        ref(create());
      } else if (ref) {
        ref.current = create();
      }
    },
    useSyncExternalStore: <Snapshot,>(
      _subscribe: (listener: () => void) => () => void,
      getSnapshot: () => Snapshot,
    ): Snapshot => getSnapshot(),
  };
});

vi.mock("react/compiler-runtime", async () => {
  const { reactHookHarness } = await import("../../test/reactHookHarness");
  return { c: reactHookHarness.useMemoCache };
});

// Zustand hooks resolve React from node_modules, where the plain-function
// harness cannot reach. Route their selectors at the live store state instead.
vi.mock("../../composerDraftStore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../composerDraftStore")>();
  return {
    ...actual,
    useComposerDraftStore: Object.assign(
      (selector: (state: unknown) => unknown) => selector(actual.useComposerDraftStore.getState()),
      actual.useComposerDraftStore,
    ),
    useComposerThreadDraft: () => ({
      prompt: "",
      images: [],
      nonPersistedImageIds: [],
      persistedAttachments: [],
      terminalContexts: [],
      elementContexts: [],
      previewAnnotations: [],
      reviewComments: [],
      modelSelectionByProvider: {},
      activeProvider: null,
      runtimeMode: null,
      interactionMode: null,
    }),
    useEffectiveComposerModelState: () => ({ selectedModel: "gpt-5-codex", modelOptions: null }),
  };
});
vi.mock("../../promptStashStore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../promptStashStore")>();
  return {
    ...actual,
    usePromptStashStore: Object.assign(
      (selector: (state: unknown) => unknown) => selector(actual.usePromptStashStore.getState()),
      actual.usePromptStashStore,
    ),
  };
});
vi.mock("../../lib/attachmentUploadQueue", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/attachmentUploadQueue")>();
  return {
    ...actual,
    useAttachmentUploadStore: Object.assign(
      (selector: (state: unknown) => unknown) =>
        selector(actual.useAttachmentUploadStore.getState()),
      actual.useAttachmentUploadStore,
    ),
  };
});
vi.mock("../../lib/composerPathSearchState", () => ({
  useComposerPathSearch: () => ({ entries: [], error: null, isPending: false }),
}));
vi.mock("../../hooks/useMediaQuery", () => ({
  useMediaQuery: () => false,
  useIsMobile: () => false,
}));
vi.mock("~/hooks/useSettings", () => ({
  useEnvironmentIdentificationMode: () => "color",
}));
vi.mock("../SidebarStageBackdrop", () => ({
  useSidebarStageBackdropVariant: () => null,
  StageBackdropButtonArt: () => null,
}));
vi.mock("../ComposerPromptEditor", () => ({
  ComposerPromptEditor: () => null,
}));

import { composerTestInstanceId, makeChatComposerProps } from "../../test/chatComposerProps";
import { Dialog, DialogTitle } from "../ui/dialog";
import { ChatComposer, type ChatComposerHandle, type ChatComposerProps } from "./ChatComposer";
import { ModelPickerContent } from "./ModelPickerContent";

type ElementWithProps = ReactElement<Record<string, unknown>>;

function renderComposer(props: ChatComposerProps): ElementWithProps {
  hooks.beginRender();
  const component = (
    ChatComposer as unknown as { type: (p: ChatComposerProps) => ElementWithProps }
  ).type;
  return component(props);
}

function findByType(tree: ElementWithProps, type: unknown): ElementWithProps | null {
  return visitElements(tree, (element) => element.type === type);
}

describe("ChatComposer model picker dialog", () => {
  beforeEach(() => {
    hooks.reset();
  });

  it("opens, reports, and closes the triggerless dialog through the composer handle", () => {
    const composerRef: { current: ChatComposerHandle | null } = { current: null };
    const props = makeChatComposerProps({ composerRef });

    let tree = renderComposer(props);
    const handle = composerRef.current;
    expect(handle).not.toBeNull();
    expect(handle!.isModelPickerOpen()).toBe(false);
    expect(findByType(tree, Dialog)?.props.open).toBe(false);

    // The keyboard shortcut path: ChatView's `modelPicker.toggle` handler
    // calls this exact method on the composer handle.
    handle!.toggleModelPicker();
    tree = renderComposer(props);
    expect(composerRef.current!.isModelPickerOpen()).toBe(true);
    const dialog = findByType(tree, Dialog);
    expect(dialog?.props.open).toBe(true);

    // Accessible name without any visible trigger or title.
    const title = findByType(tree, DialogTitle);
    expect(title?.props.className).toBe("sr-only");
    expect(title?.props.children).toBe("Choose model");

    composerRef.current!.closeModelPicker();
    tree = renderComposer(props);
    expect(composerRef.current!.isModelPickerOpen()).toBe(false);
    expect(findByType(tree, Dialog)?.props.open).toBe(false);

    composerRef.current!.openModelPicker();
    tree = renderComposer(props);
    expect(composerRef.current!.isModelPickerOpen()).toBe(true);
  });

  it("routes a model selection through ChatView's callback and closes the dialog", () => {
    const composerRef: { current: ChatComposerHandle | null } = { current: null };
    const onProviderModelSelect = vi.fn();
    const props = makeChatComposerProps({ composerRef, onProviderModelSelect });

    let tree = renderComposer(props);
    composerRef.current!.openModelPicker();
    tree = renderComposer(props);

    const content = findByType(tree, ModelPickerContent);
    expect(content).not.toBeNull();
    expect(content?.props.activeInstanceId).toBe(composerTestInstanceId);
    expect(content?.props.model).toBe("gpt-5-codex");

    (content!.props.onInstanceModelChange as (instanceId: unknown, model: string) => void)(
      composerTestInstanceId,
      "gpt-5-codex",
    );
    expect(onProviderModelSelect).toHaveBeenCalledWith(composerTestInstanceId, "gpt-5-codex");

    tree = renderComposer(props);
    expect(composerRef.current!.isModelPickerOpen()).toBe(false);
    expect(findByType(tree, Dialog)?.props.open).toBe(false);
  });

  it("keeps the picker closed and unopenable when no provider is available", () => {
    const composerRef: { current: ChatComposerHandle | null } = { current: null };
    const props = makeChatComposerProps({ composerRef, providerStatuses: [] });

    let tree = renderComposer(props);
    expect(findByType(tree, Dialog)).toBeNull();
    expect(composerRef.current!.isModelPickerOpen()).toBe(false);

    composerRef.current!.openModelPicker();
    tree = renderComposer(props);
    expect(findByType(tree, Dialog)).toBeNull();
    expect(composerRef.current!.isModelPickerOpen()).toBe(false);

    composerRef.current!.toggleModelPicker();
    tree = renderComposer(props);
    expect(findByType(tree, Dialog)).toBeNull();
    expect(composerRef.current!.isModelPickerOpen()).toBe(false);
  });
});
