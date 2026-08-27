import { describe, expect, it } from "vite-plus/test";
import * as Schema from "effect/Schema";

import {
  SubscriptionAuthLoginProgress,
  SubscriptionAuthStartResult,
  SubscriptionAuthStatuses,
} from "./subscriptionAuth.ts";

const decodeStatuses = Schema.decodeUnknownSync(SubscriptionAuthStatuses);
const decodeStartResult = Schema.decodeUnknownSync(SubscriptionAuthStartResult);
const decodeLoginProgress = Schema.decodeUnknownSync(SubscriptionAuthLoginProgress);

describe("subscription auth contracts", () => {
  it("decodes provider statuses without any credential fields", () => {
    const decoded = decodeStatuses({
      providers: [{ provider: "openai-codex", connected: true, expiresAt: 123 }],
    });
    expect(decoded.providers[0]).toEqual({
      provider: "openai-codex",
      connected: true,
      expiresAt: 123,
    });
  });

  it("decodes a remote-safe device login", () => {
    expect(
      decodeStartResult({
        loginId: "login-1",
        provider: "xai",
        url: "https://auth.x.ai/device",
        userCode: "ABCD-EFGH",
        completion: "poll",
      }),
    ).toMatchObject({ provider: "xai", completion: "poll" });
  });

  it("strips credential-shaped fields from progress", () => {
    const decoded = decodeLoginProgress({
      status: "connected",
      access: "must-not-cross-the-wire",
    });
    expect(decoded).toEqual({ status: "connected" });
    expect("access" in decoded).toBe(false);
  });
});
