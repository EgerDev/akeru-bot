// @effect-diagnostics globalFetch:off globalDate:off cryptoRandomUUID:off
/**
 * Cursor subscription OAuth.
 *
 * Ported from Mastra Code PR mastra-ai/mastra#22427
 * (`mastracode/sdk/src/auth/providers/cursor.ts`), Apache-2.0. Same flow Pi
 * uses in pi-cursor-oauth.
 *
 * Browser PKCE login against cursor.com/loginDeepControl, then poll
 * api2.cursor.sh/auth/poll. The poll endpoint returns 404 until the user
 * approves, so this maps onto the same step-poll shape as a device flow.
 */
import type { OAuthCredentials } from "../types.ts";
import { base64urlEncode } from "../pkce.ts";

const LOGIN_URL = "https://cursor.com/loginDeepControl";
const POLL_URL = "https://api2.cursor.sh/auth/poll";
const REFRESH_URL = "https://api2.cursor.sh/auth/exchange_user_api_key";
const POLL_BACKOFF = 1.2;
const POLL_BASE_DELAY_MS = 1000;
const POLL_MAX_DELAY_MS = 10_000;
const LOGIN_LIFETIME_MS = 10 * 60 * 1000;
const MAX_CONSECUTIVE_ERRORS = 3;
const DEFAULT_TOKEN_TTL_MS = 60 * 60 * 1000;
const REFRESH_SKEW_MS = 5 * 60 * 1000;

/** Serializable pending state for a Cursor login. */
export interface CursorLoginPending {
  uuid: string;
  verifier: string;
  url: string;
  /** Current poll delay in ms (grows while the endpoint returns 404). */
  delayMs: number;
  /** Consecutive transport/HTTP errors observed so far. */
  consecutiveErrors: number;
  /** ms epoch after which the login attempt is abandoned. */
  deadlineAt: number;
}

export type CursorPollResult =
  | { status: "complete"; credentials: OAuthCredentials }
  | { status: "pending"; nextPollMs: number; pending: CursorLoginPending }
  | { status: "failed"; error: string };

/** Start a Cursor login: generate PKCE material and the deep-control URL. */
export async function startCursorLogin(now: number = Date.now()): Promise<CursorLoginPending> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = base64urlEncode(array);
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = base64urlEncode(new Uint8Array(hash));
  const uuid = crypto.randomUUID();
  const params = new URLSearchParams({
    challenge,
    uuid,
    mode: "login",
    redirectTarget: "cli",
  });
  return {
    uuid,
    verifier,
    url: `${LOGIN_URL}?${params.toString()}`,
    delayMs: POLL_BASE_DELAY_MS,
    consecutiveErrors: 0,
    deadlineAt: now + LOGIN_LIFETIME_MS,
  };
}

export function cursorTokenExpiry(token: string): number {
  try {
    const payload = token.split(".")[1];
    if (!payload) return Date.now() + DEFAULT_TOKEN_TTL_MS - REFRESH_SKEW_MS;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: unknown;
    };
    if (typeof decoded.exp === "number") return decoded.exp * 1000 - REFRESH_SKEW_MS;
  } catch {
    // Fall through to the default TTL.
  }
  return Date.now() + DEFAULT_TOKEN_TTL_MS - REFRESH_SKEW_MS;
}

/**
 * Perform exactly one poll for a pending Cursor login. 404 means the user has
 * not approved yet. Never throws for flow-level conditions.
 */
export async function pollCursorLogin(
  pending: CursorLoginPending,
  options?: { signal?: AbortSignal },
  now: number = Date.now(),
): Promise<CursorPollResult> {
  if (now >= pending.deadlineAt) {
    return { status: "failed", error: "Cursor authentication timed out" };
  }

  try {
    const url = `${POLL_URL}?uuid=${encodeURIComponent(pending.uuid)}&verifier=${encodeURIComponent(
      pending.verifier,
    )}`;
    const response =
      options?.signal !== undefined
        ? await fetch(url, { signal: options.signal })
        : await fetch(url);
    if (response.status === 404) {
      const next: CursorLoginPending = {
        ...pending,
        consecutiveErrors: 0,
        delayMs: Math.min(Math.round(pending.delayMs * POLL_BACKOFF), POLL_MAX_DELAY_MS),
      };
      return { status: "pending", nextPollMs: next.delayMs, pending: next };
    }
    if (!response.ok) throw new Error(`Poll failed: ${response.status}`);
    const data = (await response.json()) as { accessToken?: unknown; refreshToken?: unknown };
    if (typeof data.accessToken !== "string" || typeof data.refreshToken !== "string") {
      throw new Error("Cursor poll response missing tokens");
    }
    return {
      status: "complete",
      credentials: {
        refresh: data.refreshToken,
        access: data.accessToken,
        expires: cursorTokenExpiry(data.accessToken),
      },
    };
  } catch (error) {
    const consecutiveErrors = pending.consecutiveErrors + 1;
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        status: "failed",
        error: `Too many consecutive errors during Cursor auth polling: ${message}`,
      };
    }
    const next: CursorLoginPending = { ...pending, consecutiveErrors };
    return { status: "pending", nextPollMs: next.delayMs, pending: next };
  }
}

/** Refresh a Cursor token by exchanging the stored refresh (or access) token. */
export async function refreshCursorToken(credentials: OAuthCredentials): Promise<OAuthCredentials> {
  const bearer =
    typeof credentials.refresh === "string" && credentials.refresh.length > 0
      ? credentials.refresh
      : credentials.access;
  const response = await fetch(REFRESH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearer}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Cursor token refresh failed: ${response.status}${text ? ` ${text}` : ""}`);
  }
  const data = (await response.json()) as { accessToken?: unknown; refreshToken?: unknown };
  if (typeof data.accessToken !== "string" || !data.accessToken) {
    throw new Error("Cursor token refresh response missing accessToken");
  }
  return {
    refresh:
      typeof data.refreshToken === "string" && data.refreshToken.length > 0
        ? data.refreshToken
        : bearer,
    access: data.accessToken,
    expires: cursorTokenExpiry(data.accessToken),
  };
}
