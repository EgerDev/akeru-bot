# Third-party notices

## Mastra Code subscription authentication

Parts of `src/subscription-auth/` are adapted from Mastra Code:

- Copyright 2025 Kepler Software, Inc.
- Source: https://github.com/mastra-ai/mastra/tree/main/mastracode/sdk/src/auth
- Cursor source: https://github.com/mastra-ai/mastra/pull/22427
- Kimi For Coding source: https://github.com/mastra-ai/mastra/pull/22428
- License: Apache License 2.0, https://www.apache.org/licenses/LICENSE-2.0

The adapted code includes OAuth authorization input parsing, PKCE helpers, device-code polling, provider login and refresh flows, and the credential-store design. Akeru changes the host API, uses remote-safe flows only, stores pending login state on the environment server, and keeps refresh tokens outside sandboxes.
