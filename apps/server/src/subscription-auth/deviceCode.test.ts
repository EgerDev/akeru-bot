import { describe, expect, it } from "vite-plus/test";

import { createDeviceCodePollState, nextPollDelayMs, stepDeviceCodePoll } from "./deviceCode.ts";

const NOW = 1_700_000_000_000;

describe("device code polling", () => {
  it("uses the provider interval and expiration", () => {
    const state = createDeviceCodePollState({
      intervalSeconds: 5,
      expiresInSeconds: 600,
      now: NOW,
    });
    expect(state).toEqual({
      deadlineAt: NOW + 600_000,
      intervalMs: 5_000,
      slowDownResponses: 0,
    });
    expect(nextPollDelayMs(state, NOW)).toBe(6_000);
  });

  it("grows the interval after slow_down", async () => {
    const state = createDeviceCodePollState({ expiresInSeconds: 600, now: NOW });
    const result = await stepDeviceCodePoll(
      state,
      async () => ({ status: "slow_down" as const }),
      NOW,
    );
    expect(result.status).toBe("slow_down");
    expect(result.state.slowDownResponses).toBe(1);
    expect(result.state.intervalMs).toBe(10_000);
    if (result.status === "slow_down") expect(result.nextPollMs).toBe(14_000);
  });

  it("returns completion without changing the state", async () => {
    const state = createDeviceCodePollState({ expiresInSeconds: 600, now: NOW });
    const result = await stepDeviceCodePoll(
      state,
      async () => ({ status: "complete" as const, result: "token" }),
      NOW,
    );
    expect(result).toEqual({ status: "complete", result: "token", state });
  });

  it("fails before polling after expiration", async () => {
    const state = createDeviceCodePollState({ expiresInSeconds: 1, now: NOW });
    let polled = false;
    const result = await stepDeviceCodePoll(
      state,
      async () => {
        polled = true;
        return { status: "pending" as const };
      },
      NOW + 1_001,
    );
    expect(polled).toBe(false);
    expect(result.status).toBe("failed");
  });
});
