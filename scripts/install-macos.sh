#!/usr/bin/env bash
# Install the latest unsigned macOS Akeru Bot build without a browser download.
# Safari and Chrome quarantine DMGs, and Gatekeeper then reports the app as damaged.
# curl does not set that quarantine flag.
#
# Usage:
#   curl -fsSL https://www.akeru-bot.com/install | bash
set -euo pipefail

REPO="opencoredev/akeru-bot"
APP_NAME="Akeru Bot (Alpha).app"
DOWNLOAD_PREFIX="https://github.com/${REPO}/releases/download/"

log() { printf 'akeru: %s\n' "$*"; }
die() { printf 'akeru: %s\n' "$*" >&2; exit 1; }

[ "$(uname -s)" = Darwin ] || die "This installer is macOS-only."
[ "$(uname -m)" = arm64 ] || die "Official releases support Apple silicon only."

for cmd in curl hdiutil ditto shasum xattr open; do
  command -v "$cmd" >/dev/null 2>&1 || die "Required command '$cmd' is missing."
done

log "Looking up the latest stable release..."
release_json="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest")"
tag="$(printf '%s\n' "$release_json" | sed -n 's/.*"tag_name":[[:space:]]*"\(v[0-9][^"]*\)".*/\1/p' | head -1)"
[[ "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "Could not read a stable vX.Y.Z tag."
version="${tag#v}"
dmg_name="Akeru-Bot-${version}-arm64.dmg"
dmg_url="${DOWNLOAD_PREFIX}${tag}/${dmg_name}"
sums_url="${DOWNLOAD_PREFIX}${tag}/SHA256SUMS"
case "$dmg_url" in
  "${DOWNLOAD_PREFIX}"*) ;;
  *) die "Refusing download URL: $dmg_url" ;;
esac

tmp="$(mktemp -d "${TMPDIR:-/tmp}/akeru-install.XXXXXX")"
mount_point="$tmp/mnt"
cleanup() {
  hdiutil detach "$mount_point" >/dev/null 2>&1 || true
  rm -rf "$tmp"
}
trap cleanup EXIT
mkdir -p "$mount_point"

log "Downloading ${dmg_name} and SHA256SUMS..."
curl -fL --progress-bar -o "$tmp/$dmg_name" "$dmg_url"
curl -fsSL -o "$tmp/SHA256SUMS" "$sums_url"

log "Verifying checksum..."
(
  cd "$tmp"
  grep -E "^[a-fA-F0-9]{64}[[:space:]]+\*?${dmg_name}\$" SHA256SUMS | shasum -a 256 -c -
) || die "Checksum missing or mismatched. Stopped without installing."

log "Installing ${APP_NAME}..."
hdiutil attach "$tmp/$dmg_name" -nobrowse -readonly -mountpoint "$mount_point" >/dev/null
source_app="$mount_point/$APP_NAME"
[ -d "$source_app" ] || die "The disk image does not contain ${APP_NAME}."

dest_app="/Applications/${APP_NAME}"
if ! ditto "$source_app" "$dest_app" 2>/dev/null; then
  mkdir -p "$HOME/Applications"
  dest_app="$HOME/Applications/${APP_NAME}"
  ditto "$source_app" "$dest_app"
fi

xattr -d com.apple.quarantine "$dest_app" >/dev/null 2>&1 || true
log "Installed ${dest_app}"
open "$dest_app"
