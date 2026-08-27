// @effect-diagnostics globalFetch:off globalDate:off
/**
 * Anthropic OAuth flow (Claude Pro/Max).
 *
 * Ported from Mastra Code (mastra-ai/mastra,
 * `mastracode/sdk/src/auth/providers/anthropic.ts`), Apache-2.0; originally
 * inspired by pi-mono's implementation.
 *
 * Paste-code PKCE flow: the redirect lands on Anthropic's hosted callback page
 * which displays `code#state` for the user to paste back. No inbound
 * connection to this server is needed, so the flow works locally, remotely,
 * and from a phone. Only the PKCE verifier spans the two steps.
 */

import { parseAuthorizationInput } from "../authorizationInput.ts";
import { generatePKCE } from "../pkce.ts";
import type { OAuthCredentials } from "../types.ts";

const decode = (s: string) => atob(s);
const CLIENT_ID = decode("OWQxYzI1MGEtZTYxYi00NGQ5LTg4ZWQtNTk0NGQxOTYyZjVl");
const AUTHORIZE_URL = "https://claude.ai/oauth/authorize";
const TOKEN_URL = "https://console.anthropic.com/v1/oauth/token";
const REDIRECT_URI = "https://console.anthropic.com/oauth/code/callback";
const SCOPES = "org:create_api_key user:profile user:inference";
const REFRESH_SKEW_MS = 5 * 60 * 1000;

export interface AnthropicLoginStart {
  /** Authorization URL for the user to open. */
  url: string;
  /** PKCE code verifier — persist it to complete the login later. */
  verifier: string;
}

/** Start an Anthropic login: generate PKCE state and build the authorization URL. */
export async function startAnthropicLogin(): Promise<AnthropicLoginStart> {
  const { verifier, challenge } = await generatePKCE();

  const authParams = new URLSearchParams({
    code: "true",
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state: verifier,
  });

  return { url: `${AUTHORIZE_URL}?${authParams.toString()}`, verifier };
}

/**
 * Complete an Anthropic login: parse the pasted authorization input
 * (full URL, `code#state`, or query string), validate its state, and exchange
 * it for tokens using the verifier from `startAnthropicLogin()`.
 */
export async function completeAnthropicLogin(
  input: string,
  verifier: string,
): Promise<OAuthCredentials> {
  const { code, state } = parseAuthorizationInput(input);
  if (!code) {
    throw new Error("Missing authorization code");
  }
  if (!state || state !== verifier) {
    throw new Error("Invalid authorization state");
  }

  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    // Bound the OAuth exchange so an unresponsive upstream cannot pin the caller.
    signal: AbortSignal.timeout(15_000),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code,
      state,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    refresh: tokenData.refresh_token,
    access: tokenData.access_token,
    expires: Date.now() + tokenData.expires_in * 1000 - REFRESH_SKEW_MS,
  };
}

/** Refresh an Anthropic OAuth token. */
export async function refreshAnthropicToken(refreshToken: string): Promise<OAuthCredentials> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    signal: AbortSignal.timeout(15_000),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic token refresh failed: ${error}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    refresh: data.refresh_token,
    access: data.access_token,
    expires: Date.now() + data.expires_in * 1000 - REFRESH_SKEW_MS,
  };
}
