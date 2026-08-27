import { afterEach, describe, expect, it } from "vite-plus/test";

import { closeUsage, openUsage, useUsageDialogStore } from "./usageDialogStore";

afterEach(() => closeUsage());

describe("usage dialog store", () => {
  it("opens and closes independently from settings", () => {
    expect(useUsageDialogStore.getState().open).toBe(false);
    openUsage();
    expect(useUsageDialogStore.getState().open).toBe(true);
    closeUsage();
    expect(useUsageDialogStore.getState().open).toBe(false);
  });
});
