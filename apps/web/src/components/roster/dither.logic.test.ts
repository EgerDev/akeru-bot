import { describe, expect, it } from "vite-plus/test";

import {
  contrastRatio,
  DITHER_GRID_SIZE,
  ditherForegroundColor,
  ditherSeedForName,
  generateDitherIdenticon,
  identiconPathData,
  orderedDitherRgba,
  rerollDitherSeed,
  resolveUploadAvatar,
} from "./dither.logic";
import { BLOB_COLORS } from "./roster.logic";

describe("ditherForegroundColor", () => {
  it("meets 4.5:1 contrast against every palette background", () => {
    for (const color of BLOB_COLORS) {
      const foreground = ditherForegroundColor(color);
      expect(contrastRatio(color, foreground), color).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("chooses the higher-contrast monochrome color", () => {
    for (const color of BLOB_COLORS) {
      const foreground = ditherForegroundColor(color);
      const other = foreground === "#000000" ? "#ffffff" : "#000000";
      expect(contrastRatio(color, foreground)).toBeGreaterThanOrEqual(contrastRatio(color, other));
    }
  });
});

describe("generateDitherIdenticon", () => {
  it("is deterministic: same seed, same cells and colors", () => {
    const a = generateDitherIdenticon("Akeru");
    const b = generateDitherIdenticon("Akeru");
    expect(b.cells).toEqual(a.cells);
    expect(b.background).toBe(a.background);
    expect(b.foreground).toBe(a.foreground);
  });

  it("differs across seeds", () => {
    const seeds = ["Akeru", "Mori", "Sage", "Akeru#a1b2c3"];
    const patterns = seeds.map((seed) => identiconPathData(generateDitherIdenticon(seed)));
    expect(new Set(patterns).size).toBe(seeds.length);
  });

  it("paints a readable pattern: both on and off cells, contrasting colors", () => {
    for (const seed of ["Akeru", "Mori", "Sage", "z", "bot"]) {
      const identicon = generateDitherIdenticon(seed);
      const onCount = identicon.cells.filter(Boolean).length;
      expect(onCount).toBeGreaterThan(0);
      expect(onCount).toBeLessThan(identicon.cells.length);
      expect(identicon.foreground).not.toBe(identicon.background);
    }
  });

  it("mirrors horizontally, identicon style", () => {
    const { size, cells } = generateDitherIdenticon("Akeru");
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size / 2; x++) {
        expect(cells[y * size + x]).toBe(cells[y * size + (size - 1 - x)]);
      }
    }
  });

  it("survives an empty seed", () => {
    const identicon = generateDitherIdenticon("");
    expect(identicon.cells).toHaveLength(DITHER_GRID_SIZE * DITHER_GRID_SIZE);
  });
});

describe("orderedDitherRgba", () => {
  const gradient = (width: number, height: number): Uint8ClampedArray => {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let index = 0; index < width * height; index++) {
      const value = Math.round((index / (width * height - 1)) * 255);
      data.set([value, value, value, 255], index * 4);
    }
    return data;
  };

  it("changes pixels and leaves only pure black or white", () => {
    const width = 16;
    const height = 16;
    const data = gradient(width, height);
    const before = Uint8ClampedArray.from(data);
    orderedDitherRgba(data, width, height);
    expect(data).not.toEqual(before);
    for (let index = 0; index < data.length; index += 4) {
      expect([0, 255]).toContain(data[index]);
      expect(data[index + 1]).toBe(data[index]);
      expect(data[index + 2]).toBe(data[index]);
      expect(data[index + 3]).toBe(255);
    }
  });

  it("is deterministic for the same input", () => {
    const a = gradient(8, 8);
    const b = gradient(8, 8);
    orderedDitherRgba(a, 8, 8);
    orderedDitherRgba(b, 8, 8);
    expect(a).toEqual(b);
  });
});

describe("seeds", () => {
  it("derives the initial seed from the name, with a fallback", () => {
    expect(ditherSeedForName("  Akeru ")).toBe("Akeru");
    expect(ditherSeedForName("   ")).toBe("bot");
  });

  it("rerolls keep the name prefix and vary with the random source", () => {
    const first = rerollDitherSeed("Akeru", () => 0.25);
    const second = rerollDitherSeed("Akeru", () => 0.75);
    expect(first.startsWith("Akeru#")).toBe(true);
    expect(second).not.toBe(first);
    expect(rerollDitherSeed("Akeru", () => 0.25)).toBe(first);
  });
});

describe("resolveUploadAvatar", () => {
  const upload = { plainUrl: "data:plain", ditheredUrl: "data:dithered" };

  it("is null until an image is chosen", () => {
    expect(resolveUploadAvatar(null, false)).toBeNull();
    expect(resolveUploadAvatar(null, true)).toBeNull();
  });

  it("saves the plain rendering with dithered: false when the toggle is off", () => {
    expect(resolveUploadAvatar(upload, false)).toEqual({
      kind: "image",
      assetPath: "data:plain",
      dithered: false,
    });
  });

  it("saves the dithered rendering with dithered: true when the toggle is on", () => {
    expect(resolveUploadAvatar(upload, true)).toEqual({
      kind: "image",
      assetPath: "data:dithered",
      dithered: true,
    });
  });
});
