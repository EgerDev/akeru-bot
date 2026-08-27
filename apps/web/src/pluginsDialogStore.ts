import { create } from "zustand";

interface PluginsDialogState {
  readonly open: boolean;
  readonly openPlugins: () => void;
  readonly closePlugins: () => void;
}

export const usePluginsDialogStore = create<PluginsDialogState>((set) => ({
  open: false,
  openPlugins: () => set({ open: true }),
  closePlugins: () => set({ open: false }),
}));

export function openPlugins(): void {
  usePluginsDialogStore.getState().openPlugins();
}

export function closePlugins(): void {
  usePluginsDialogStore.getState().closePlugins();
}

export function isLegacyPluginsPath(pathname: string): boolean {
  return pathname.replace(/^\/settings\/?/, "").split("/")[0] === "plugins";
}
