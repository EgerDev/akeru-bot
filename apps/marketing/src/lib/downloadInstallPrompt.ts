export const MAC_CURL_INSTALL_COMMAND = [
  "(",
  "set -euo pipefail",
  '[ "$(uname -s)" = Darwin ]',
  '[ "$(uname -m)" = arm64 ]',
  'tmp="$(mktemp -d)"',
  'mnt="$tmp/mnt"',
  `trap 'hdiutil detach "$mnt" >/dev/null 2>&1 || true; rm -rf "$tmp"' EXIT`,
  'mkdir -p "$mnt"',
  'tag="$(curl -fsSL https://api.github.com/repos/opencoredev/akeru-bot/releases/latest | sed -n \'s/.*"tag_name":[[:space:]]*"\\(v[0-9][^"]*\\)".*/\\1/p\' | head -1)"',
  '[[ "$tag" =~ ^v[0-9]+[.][0-9]+[.][0-9]+$ ]]',
  'version="${tag#v}"',
  'dmg="Akeru-Bot-${version}-arm64.dmg"',
  'base="https://github.com/opencoredev/akeru-bot/releases/download/${tag}"',
  'curl -fsSL -o "$tmp/SHA256SUMS" "$base/SHA256SUMS"',
  'curl -fL -o "$tmp/$dmg" "$base/$dmg"',
  'line="$(grep -E "^[a-fA-F0-9]{64}[[:space:]]+\\*?${dmg}\\$" "$tmp/SHA256SUMS")" || exit 1',
  '( cd "$tmp" && printf "%s\\n" "$line" | shasum -a 256 -c - )',
  'hdiutil attach "$tmp/$dmg" -nobrowse -readonly -mountpoint "$mnt"',
  'app="/Applications/Akeru Bot (Alpha).app"',
  'if ! ditto "$mnt/Akeru Bot (Alpha).app" "$app" 2>/dev/null; then',
  '  osascript - "$mnt/Akeru Bot (Alpha).app" "$app" <<\'APPLESCRIPT\'',
  "on run argv",
  '  do shell script "ditto " & quoted form of item 1 of argv & " " & quoted form of item 2 of argv with administrator privileges',
  "end run",
  "APPLESCRIPT",
  "fi",
  'xattr -d com.apple.quarantine "$app" 2>/dev/null || true',
  'open "$app"',
  ")",
].join("\n");

export const MAC_GATEKEEPER_COMMAND = [
  'if line=$(grep -E "^[a-fA-F0-9]{64}[[:space:]]+\\*?Akeru-Bot-.*-arm64[.]dmg$" SHA256SUMS); then',
  '  printf "%s\\n" "$line" | shasum -a 256 -c - && {',
  '    xattr -d com.apple.quarantine "/Applications/Akeru Bot (Alpha).app" 2>/dev/null || true',
  '    open "/Applications/Akeru Bot (Alpha).app"',
  "  }",
  "fi",
].join("\n");

export const MAC_DOWNLOAD_DIALOG_TITLE = "Install from Terminal, not the browser";

export const MAC_DOWNLOAD_DIALOG_BODY =
  "Safari and Chrome quarantine unsigned Mac apps, so Gatekeeper says Akeru Bot is damaged. That is not a corrupt file. Paste this in Terminal. It downloads the GitHub DMG, checks SHA256SUMS, then installs. curl does not quarantine the download.";

export function installPromptPlatformForDownload(
  platform: string | undefined,
  resolvedAsset: boolean,
): "mac" | null {
  return resolvedAsset && platform === "mac" ? "mac" : null;
}
