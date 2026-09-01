export const MAC_CURL_INSTALL_COMMAND = "curl -fsSL https://www.akeru-bot.com/install | bash";

export const MAC_DOWNLOAD_DIALOG_TITLE = "Install from Terminal, not the browser";

export const MAC_DOWNLOAD_DIALOG_BODY =
  "Safari and Chrome quarantine unsigned Mac apps, so Gatekeeper says Akeru Bot is damaged. That is not a corrupt file. Paste this in Terminal. curl does not quarantine the download, so the app opens.";

export function installPromptPlatformForDownload(
  platform: string | undefined,
  resolvedAsset: boolean,
): "mac" | null {
  return resolvedAsset && platform === "mac" ? "mac" : null;
}
