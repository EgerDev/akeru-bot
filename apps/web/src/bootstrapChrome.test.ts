import { describe, expect, it } from "vite-plus/test";

import bootstrapHtml from "../index.html?raw";
import manifestJson from "../public/manifest.webmanifest?raw";

// The static bootstrap shell renders before React mounts, so its branding
// lives in index.html instead of branding.ts and needs its own check.
describe("bootstrap chrome", () => {
  it("brands the static bootstrap shell as Akeru Bot", () => {
    expect(bootstrapHtml).toContain("<title>Akeru Bot (Alpha)</title>");
    expect(bootstrapHtml).toContain('aria-label="Akeru Bot splash screen"');
    expect(bootstrapHtml).toContain('alt="Akeru Bot"');
    expect(bootstrapHtml).not.toContain("T3 Code");
    expect(bootstrapHtml).not.toContain("t3.codes");
    expect(bootstrapHtml).not.toContain("ping.gg");
  });

  it("brands the web app manifest as Akeru Bot", () => {
    const manifest = JSON.parse(manifestJson) as { name?: string; short_name?: string };

    expect(manifest.name).toBe("Akeru Bot");
    expect(manifest.short_name).toBe("Akeru Bot");
  });
});
