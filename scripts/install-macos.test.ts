import * as NodeFS from "node:fs";
import * as NodePath from "node:path";
import * as NodeURL from "node:url";

import { expect, it } from "vite-plus/test";

const script = NodeFS.readFileSync(
  NodePath.resolve(NodePath.dirname(NodeURL.fileURLToPath(import.meta.url)), "install-macos.sh"),
  "utf8",
);

it("installs only the official Apple silicon Akeru Bot release", () => {
  expect(script).toContain("opencoredev/akeru-bot");
  expect(script).toContain("Akeru Bot (Alpha).app");
  expect(script).toContain("arm64");
  expect(script).toContain("https://github.com/${REPO}/releases/download/");
  expect(script).not.toContain("spctl --master-disable");
  expect(script).not.toContain("csrutil");
});

it("verifies SHA256SUMS before copying the app", () => {
  const checksum = script.indexOf('log "Verifying checksum..."');
  const copy = script.indexOf('log "Installing ${APP_NAME}..."');
  expect(checksum).toBeGreaterThan(0);
  expect(copy).toBeGreaterThan(checksum);
  expect(script).toContain("shasum -a 256 -c");
  expect(script).toContain("Checksum missing or mismatched");
});

it("documents the curl install path that skips browser quarantine", () => {
  expect(script).toContain("curl -fsSL https://www.akeru-bot.com/install | bash");
  expect(script).toContain("Safari and Chrome quarantine DMGs");
});
