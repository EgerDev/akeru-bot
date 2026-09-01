import * as NodeFS from "node:fs";
import * as NodePath from "node:path";

import { describe, expect, it } from "vite-plus/test";
import {
  MAC_CURL_INSTALL_COMMAND,
  MAC_DOWNLOAD_DIALOG_BODY,
  MAC_GATEKEEPER_COMMAND,
  installPromptPlatformForDownload,
} from "./downloadInstallPrompt";

describe("installPromptPlatformForDownload", () => {
  it("shows the install prompt only after resolving a macOS download", () => {
    expect(installPromptPlatformForDownload("mac", true)).toBe("mac");
    expect(installPromptPlatformForDownload("mac", false)).toBeNull();
    expect(installPromptPlatformForDownload("win", true)).toBeNull();
    expect(installPromptPlatformForDownload("linux", true)).toBeNull();
  });

  it("sends macOS users to a checksummed GitHub DMG instead of a quarantined download", () => {
    expect(MAC_CURL_INSTALL_COMMAND).toContain(
      "https://github.com/opencoredev/akeru-bot/releases/download/${tag}",
    );
    expect(MAC_CURL_INSTALL_COMMAND).toContain("|| exit 1");
    expect(MAC_CURL_INSTALL_COMMAND).toContain("shasum -a 256 -c -");
    expect(MAC_CURL_INSTALL_COMMAND).toContain("hdiutil attach");
    expect(MAC_CURL_INSTALL_COMMAND).toContain("ditto");
    expect(MAC_CURL_INSTALL_COMMAND).toContain("xattr -d com.apple.quarantine");
    expect(MAC_CURL_INSTALL_COMMAND).toContain('open "$app"');
    expect(MAC_CURL_INSTALL_COMMAND).not.toContain("/releases/latest/download");
    expect(MAC_CURL_INSTALL_COMMAND).not.toContain("| bash");
    expect(MAC_CURL_INSTALL_COMMAND).not.toContain("install-macos.sh");
    expect(MAC_GATEKEEPER_COMMAND).toContain("shasum -a 256 -c - && {");
    expect(MAC_DOWNLOAD_DIALOG_BODY).toMatch(/Safari and Chrome quarantine/);
    expect(MAC_DOWNLOAD_DIALOG_BODY).toMatch(/damaged/);
    expect(MAC_DOWNLOAD_DIALOG_BODY).toMatch(/curl does not quarantine/);
  });

  it("keeps the install docs on the same fail-closed recipe", () => {
    const docs = NodeFS.readFileSync(
      NodePath.resolve(import.meta.dirname, "../../../../docs/user/install.md"),
      "utf8",
    );
    expect(docs).toContain(MAC_CURL_INSTALL_COMMAND);
    expect(docs).toContain(MAC_GATEKEEPER_COMMAND);
  });
});
