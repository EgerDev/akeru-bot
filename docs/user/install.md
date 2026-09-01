# Install Akeru Bot

Akeru Bot is a web and desktop GUI for running coding agents on your machine.

## Requirements

Node.js `^22.16 || ^23.11 || >=24.10` on the machine that runs the Akeru Bot server.

At least one provider CLI, installed and authenticated. See [Providers](#providers) below.

## Run Without Installing

```bash
npx akeru-bot@latest
```

This starts the Akeru Bot server on your machine and opens the local web app. Use
`npx akeru-bot@latest --help` for the full CLI reference.

## Desktop App

On macOS, install from Terminal. Safari and Chrome quarantine unsigned apps, so a browser
download looks damaged even when the file is fine. `curl` does not set that flag:

```bash
(
set -euo pipefail
[ "$(uname -s)" = Darwin ]
[ "$(uname -m)" = arm64 ]
tmp="$(mktemp -d)"
mnt="$tmp/mnt"
trap 'hdiutil detach "$mnt" >/dev/null 2>&1 || true; rm -rf "$tmp"' EXIT
mkdir -p "$mnt"
tag="$(curl -fsSL https://api.github.com/repos/opencoredev/akeru-bot/releases/latest | sed -n 's/.*"tag_name":[[:space:]]*"\(v[0-9][^"]*\)".*/\1/p' | head -1)"
[[ "$tag" =~ ^v[0-9]+[.][0-9]+[.][0-9]+$ ]]
version="${tag#v}"
dmg="Akeru-Bot-${version}-arm64.dmg"
base="https://github.com/opencoredev/akeru-bot/releases/download/${tag}"
curl -fsSL -o "$tmp/SHA256SUMS" "$base/SHA256SUMS"
curl -fL -o "$tmp/$dmg" "$base/$dmg"
line="$(grep -E "^[a-fA-F0-9]{64}[[:space:]]+\*?${dmg}\$" "$tmp/SHA256SUMS")" || exit 1
( cd "$tmp" && printf "%s\n" "$line" | shasum -a 256 -c - )
hdiutil attach "$tmp/$dmg" -nobrowse -readonly -mountpoint "$mnt"
app="/Applications/Akeru Bot (Alpha).app"
if ! ditto "$mnt/Akeru Bot (Alpha).app" "$app" 2>/dev/null; then
  osascript - "$mnt/Akeru Bot (Alpha).app" "$app" <<'APPLESCRIPT'
on run argv
  do shell script "ditto " & quoted form of item 1 of argv & " " & quoted form of item 2 of argv with administrator privileges
end run
APPLESCRIPT
fi
xattr -d com.apple.quarantine "$app" 2>/dev/null || true
open "$app"
)
```

This resolves one GitHub tag, downloads that tag's arm64 DMG and `SHA256SUMS`, verifies the
checksum, installs **Akeru Bot (Alpha).app** into `/Applications`, and opens it.

Windows and Linux installers are on the same [GitHub Releases](https://github.com/opencoredev/akeru-bot/releases)
page.

### macOS Gatekeeper

If you already downloaded the DMG in Safari or Chrome, do not open the app from the disk image.
Verify the file first, then install and clear quarantine only on the copy in Applications:

```bash
if line=$(grep -E "^[a-fA-F0-9]{64}[[:space:]]+\*?Akeru-Bot-.*-arm64[.]dmg$" SHA256SUMS); then
  printf "%s\n" "$line" | shasum -a 256 -c - && {
    xattr -d com.apple.quarantine "/Applications/Akeru Bot (Alpha).app" 2>/dev/null || true
    open "/Applications/Akeru Bot (Alpha).app"
  }
fi
```

Stop if the checksum is missing or does not match. Do not turn off Gatekeeper or change any
system-wide security setting.

## Providers

Akeru Bot drives provider CLIs; it does not ship them. Install the CLI for each provider you want
to use, then authenticate it.

| Provider   | CLI                                                   | Default binary | Log in with           |
| ---------- | ----------------------------------------------------- | -------------- | --------------------- |
| Codex      | [Codex CLI](https://developers.openai.com/codex/cli)  | `codex`        | `codex login`         |
| Claude     | [Claude Code](https://claude.com/product/claude-code) | `claude`       | `claude auth login`   |
| Grok Build | [Grok Build CLI](https://x.ai/cli)                    | `grok`         | `grok login`          |
| OpenCode   | [OpenCode](https://opencode.ai)                       | `opencode`     | `opencode auth login` |

Codex and Claude are on by default. Grok Build and OpenCode are off by default; turn
them on in **Settings** → the provider's card when you want to use them.

Run the login command on the machine running the Akeru Bot server, not on the device you browse
from.

### Binary Discovery

Each provider CLI must be on the server's `PATH`, or have an explicit binary path set in
**Settings** → the provider instance → **Binary path**. Use the explicit path when a version
manager or a non-standard install location keeps the CLI off the `PATH` of the shell that
started Akeru Bot.

### When Auth Is Needed

Provider auth is required before you start a session with that provider, not before you start
Akeru Bot. You can install Akeru Bot, open it, and add providers afterwards. A provider that is not
authenticated shows its status in **Settings** and fails at session start with the login command
to run.

For multi-account setups, see [Codex](./providers-codex.md) and [Claude](./providers-claude.md).

## Next Steps

- [Permission modes](./permission-modes.md): how much Akeru Bot asks before acting
- [Remote access](./remote-access.md): connect from a phone, tablet, or another desktop
- [Keeping Akeru Bot in sync](./updating.md): client and server version skew
- [Running in the background](./background-service.md): Linux background service
