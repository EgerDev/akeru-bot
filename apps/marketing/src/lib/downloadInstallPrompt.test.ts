import { describe, expect, it } from "vite-plus/test";
import {
  MAC_CURL_INSTALL_COMMAND,
  MAC_DOWNLOAD_DIALOG_BODY,
  installPromptPlatformForDownload,
} from "./downloadInstallPrompt";

describe("installPromptPlatformForDownload", () => {
  it("shows the install prompt only after resolving a macOS download", () => {
    expect(installPromptPlatformForDownload("mac", true)).toBe("mac");
    expect(installPromptPlatformForDownload("mac", false)).toBeNull();
    expect(installPromptPlatformForDownload("win", true)).toBeNull();
    expect(installPromptPlatformForDownload("linux", true)).toBeNull();
  });

  it("sends macOS users to a curl install instead of a quarantined DMG", () => {
    expect(MAC_CURL_INSTALL_COMMAND).toBe("curl -fsSL https://www.akeru-bot.com/install | bash");
    expect(MAC_DOWNLOAD_DIALOG_BODY).toMatch(/Safari and Chrome quarantine/);
    expect(MAC_DOWNLOAD_DIALOG_BODY).toMatch(/damaged/);
    expect(MAC_DOWNLOAD_DIALOG_BODY).toMatch(/curl does not quarantine/);
  });
});
