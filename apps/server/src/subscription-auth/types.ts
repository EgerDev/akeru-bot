/**
 * Subscription provider OAuth types.
 *
 * Ported from Mastra Code (mastra-ai/mastra, `mastracode/sdk/src/auth`),
 * Apache-2.0. A provider here is a consumer subscription (Claude Pro/Max,
 * ChatGPT, Cursor, Kimi For Coding, X Premium) that the agent runtime spends,
 * not an API key with usage billing.
 */

export interface OAuthCredentials {
  refresh: string;
  access: string;
  /** ms epoch after which `access` must be refreshed. */
  expires: number;
  [key: string]: unknown;
}

export type OAuthCredential = {
  type: "oauth";
} & OAuthCredentials;

export type SubscriptionAuthData = Record<string, OAuthCredential>;
