// @effect-diagnostics globalFetch:off globalDate:off
/**
 * OpenAI Codex OAuth (ChatGPT Plus/Pro subscriptions).
 *
 * Ported from Mastra Code (mastra-ai/mastra,
 * `mastracode/sdk/src/auth/providers/openai-codex.ts`), Apache-2.0.
 *
 * Only the device-code flow is ported. The upstream browser flow waits for a
 * callback on the server's localhost, which cannot work when the client is a
 * phone or a remote browser — every Akeru flow must survive that split, so the
 * headless flow is the only flow.
 */

import type { OAuthCredentials } from "../types.ts";

const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const ISSUER = "https://auth.openai.com";
const TOKEN_URL = `${ISSUER}/oauth/token`;
const DEVICE_USER_CODE_URL = `${ISSUER}/api/accounts/deviceauth/usercode`;
const DEVICE_TOKEN_URL = `${ISSUER}/api/accounts/deviceauth/token`;
const DEVICE_AUTHORIZE_URL = `${ISSUER}/codex/device`;
const DEVICE_REDIRECT_URI = `${ISSUER}/deviceauth/callback`;
const DEFAULT_TOKEN_EXPIRES_IN_SECONDS = 3600;
const DEVICE_AUTH_TIMEOUT_MS = 15 * 60 * 1000;
const JWT_CLAIM_PATH = "https://api.openai.com/auth";
const USER_AGENT = "akeru";

type JwtPayload = {
  chatgpt_account_id?: string;
  [JWT_CLAIM_PATH]?: {
    chatgpt_account_id?: string;
  };
  [key: string]: unknown;
};

function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1] ?? "";
    const padded = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

function extractAccountIdFromClaims(payload: JwtPayload | null): string | null {
  if (!payload) return null;
  const accountId = payload.chatgpt_account_id ?? payload[JWT_CLAIM_PATH]?.chatgpt_account_id;
  return typeof accountId === "string" && accountId.length > 0 ? accountId : null;
}

function getAccountId(
  tokens: { idToken?: string | undefined; access: string },
  fallback?: string,
): string | undefined {
  const fromIdToken = tokens.idToken ? extractAccountIdFromClaims(decodeJwt(tokens.idToken)) : null;
  if (fromIdToken) return fromIdToken;

  const fromAccessToken = extractAccountIdFromClaims(decodeJwt(tokens.access));
  if (fromAccessToken) return fromAccessToken;

  return fallback;
}

function requireAccountId(
  tokens: { idToken?: string | undefined; access: string },
  fallback?: string,
): string {
  const accountId = getAccountId(tokens, fallback);
  if (!accountId) {
    throw new Error("Failed to extract ChatGPT account id from OpenAI Codex token");
  }
  return accountId;
}

type TokenResponseJson = {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

type TokenSuccess = {
  access: string;
  refresh: string;
  expires: number;
  idToken?: string | undefined;
};

function tokenResponseToResult(json: TokenResponseJson): TokenSuccess | null {
  if (!json.access_token || !json.refresh_token) {
    return null;
  }
  return {
    access: json.access_token,
    refresh: json.refresh_token,
    expires: Date.now() + (json.expires_in ?? DEFAULT_TOKEN_EXPIRES_IN_SECONDS) * 1000,
    idToken: json.id_token,
  };
}

async function exchangeAuthorizationCode(
  code: string,
  verifier: string,
  redirectUri: string,
  signal?: AbortSignal,
): Promise<TokenSuccess | null> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri,
    }),
    ...(signal !== undefined ? { signal } : {}),
  });

  if (!response.ok) {
    return null;
  }
  return tokenResponseToResult((await response.json()) as TokenResponseJson);
}

/**
 * Serializable pending state for a Codex device-code login. The device token
 * response carries the `code_verifier`, so no PKCE state spans requests.
 */
export interface CodexDeviceLoginPending {
  deviceAuthId: string;
  userCode: string;
  /** Verification URL for the user to open. */
  url: string;
  instructions: string;
  /** Poll interval in ms suggested by the server. */
  intervalMs: number;
  /** ms epoch after which the device authorization expires. */
  deadlineAt: number;
}

export type CodexDevicePollResult =
  | { status: "complete"; credentials: OAuthCredentials }
  | { status: "pending"; nextPollMs: number }
  | { status: "failed"; error: string };

/** Start a Codex device-code login: request a user code and return pending state. */
export async function startCodexDeviceLogin(options?: {
  signal?: AbortSignal;
}): Promise<CodexDeviceLoginPending> {
  const response = await fetch(DEVICE_USER_CODE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({ client_id: CLIENT_ID, originator: USER_AGENT }),
    ...(options?.signal !== undefined ? { signal: options.signal } : {}),
  });

  if (!response.ok) {
    throw new Error(`Failed to initiate OpenAI Codex device authorization: ${response.status}`);
  }

  const deviceData = (await response.json()) as {
    device_auth_id?: string;
    user_code?: string;
    usercode?: string;
    interval?: string | number;
  };

  const userCode = deviceData.user_code ?? deviceData.usercode;

  if (!deviceData.device_auth_id || !userCode) {
    throw new Error("OpenAI Codex device authorization response missing required fields");
  }

  const intervalSeconds =
    typeof deviceData.interval === "number"
      ? deviceData.interval
      : Number.parseInt(deviceData.interval ?? "", 10) || 5;

  return {
    deviceAuthId: deviceData.device_auth_id,
    userCode,
    url: DEVICE_AUTHORIZE_URL,
    instructions: `Enter code: ${userCode}`,
    intervalMs: Math.max(intervalSeconds, 1) * 1000,
    deadlineAt: Date.now() + DEVICE_AUTH_TIMEOUT_MS,
  };
}

/**
 * Perform exactly one upstream poll for a pending Codex device login.
 * The Codex device endpoint signals "still pending" via HTTP 403/404 (it is
 * not an RFC 8628 error-JSON endpoint); on success it returns the
 * authorization code plus server-held PKCE verifier, which is exchanged
 * immediately for credentials. Never throws for flow-level conditions.
 */
export async function pollCodexDeviceLogin(
  pending: CodexDeviceLoginPending,
  options?: { signal?: AbortSignal },
): Promise<CodexDevicePollResult> {
  if (Date.now() >= pending.deadlineAt) {
    return {
      status: "failed",
      error: "OpenAI Codex device authorization timed out after 15 minutes",
    };
  }

  const pollResponse = await fetch(DEVICE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({
      device_auth_id: pending.deviceAuthId,
      user_code: pending.userCode,
    }),
    ...(options?.signal !== undefined ? { signal: options.signal } : {}),
  });

  if (pollResponse.ok) {
    const data = (await pollResponse.json()) as {
      authorization_code?: string;
      code_verifier?: string;
    };

    if (!data.authorization_code || !data.code_verifier) {
      return {
        status: "failed",
        error: "OpenAI Codex device token response missing required fields",
      };
    }

    const tokenResult = await exchangeAuthorizationCode(
      data.authorization_code,
      data.code_verifier,
      DEVICE_REDIRECT_URI,
      options?.signal,
    );
    if (!tokenResult) {
      return { status: "failed", error: "Token exchange failed" };
    }

    let accountId: string;
    try {
      accountId = requireAccountId(tokenResult);
    } catch (error) {
      return { status: "failed", error: error instanceof Error ? error.message : String(error) };
    }

    return {
      status: "complete",
      credentials: {
        access: tokenResult.access,
        refresh: tokenResult.refresh,
        expires: tokenResult.expires,
        accountId,
      },
    };
  }

  if (pollResponse.status !== 403 && pollResponse.status !== 404) {
    const text = await pollResponse.text().catch(() => "");
    return {
      status: "failed",
      error: `OpenAI Codex device authorization failed: ${pollResponse.status}${text ? ` ${text}` : ""}`,
    };
  }

  return { status: "pending", nextPollMs: pending.intervalMs };
}

/** Refresh an OpenAI Codex OAuth token, preserving the ChatGPT account id. */
export async function refreshCodexToken(credentials: OAuthCredentials): Promise<OAuthCredentials> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: credentials.refresh,
      client_id: CLIENT_ID,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `OpenAI Codex token refresh failed: ${response.status}${text ? ` ${text}` : ""}`,
    );
  }

  const result = tokenResponseToResult((await response.json()) as TokenResponseJson);
  if (!result) {
    throw new Error("OpenAI Codex token refresh response missing fields");
  }

  const previousAccountId =
    typeof credentials.accountId === "string" ? credentials.accountId : undefined;

  return {
    access: result.access,
    refresh: result.refresh,
    expires: result.expires,
    accountId: requireAccountId(result, previousAccountId),
  };
}
