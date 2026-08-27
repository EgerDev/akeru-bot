import { create } from "zustand";

interface UsageDialogState {
  readonly open: boolean;
  readonly openUsage: () => void;
  readonly closeUsage: () => void;
}

export const useUsageDialogStore = create<UsageDialogState>((set) => ({
  open: false,
  openUsage: () => set({ open: true }),
  closeUsage: () => set({ open: false }),
}));

export function openUsage(): void {
  useUsageDialogStore.getState().openUsage();
}

export function closeUsage(): void {
  useUsageDialogStore.getState().closeUsage();
}
