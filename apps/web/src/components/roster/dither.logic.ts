import { BLOB_COLORS } from "./roster.logic";
import type { BotAvatar } from "./types";

/**
 * Dither Kit style identicons: a seeded intensity field pushed through a
 * Bayer ordered-dither threshold. Everything here is deterministic — the same
 * seed always yields the same pixels — so avatars render from the seed alone
 * and nothing needs to be stored.
 */

export const DITHER_GRID_SIZE = 16;

// Classic 4×4 Bayer matrix; thresholds are (value + 0.5) / 16.
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

// 8×8 Bayer matrix for photo dithering; thresholds are (value + 0.5) / 64.
const BAYER_8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
] as const;

/** FNV-1a, 32-bit. Stable across sessions, unlike anything Math-random. */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index++) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: tiny seeded PRNG, consumed in a fixed order for determinism. */
function mulberry32(state: number): () => number {
  let a = state >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The seed a bot's name implies; empty names still get a stable image. */
export function ditherSeedForName(name: string): string {
  const trimmed = name.trim();
  return trimmed.length === 0 ? "bot" : trimmed;
}

/**
 * Rerolled seed: the name plus a random suffix, so the identicon stays
 * name-flavored while every roll lands on a different image. The random
 * source is injectable for tests.
 */
export function rerollDitherSeed(name: string, random: () => number = Math.random): string {
  const suffix = Math.floor(random() * 36 ** 6)
    .toString(36)
    .padStart(6, "0");
  return `${ditherSeedForName(name)}#${suffix}`;
}

function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (match === null) return 0;
  const value = Number.parseInt(match[1]!, 16);
  const channel = (shift: number) => {
    const srgb = ((value >> shift) & 0xff) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0);
}

/** WCAG contrast ratio for two six-digit hex colors. */
export function contrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Pick the higher-contrast monochrome foreground for dither pixels. */
export function ditherForegroundColor(background: string): "#000000" | "#ffffff" {
  return contrastRatio(background, "#000000") >= contrastRatio(background, "#ffffff")
    ? "#000000"
    : "#ffffff";
}

export interface DitherIdenticon {
  /** Grid side length; cells is row-major size × size. */
  size: number;
  /** True cells paint the foreground color. */
  cells: boolean[];
  background: string;
  foreground: string;
}

/**
 * Seed → identicon. A jittered radial intensity field plus per-cell noise is
 * thresholded by the Bayer 4×4 matrix, then mirrored horizontally for the
 * classic identicon symmetry. Background comes from the blob palette and the
 * foreground picks whichever of black or white has the higher measured
 * contrast, so the image stays readable in both color schemes.
 */
export function generateDitherIdenticon(seed: string): DitherIdenticon {
  const random = mulberry32(hashSeed(seed.length === 0 ? "bot" : seed));
  const background = BLOB_COLORS[Math.floor(random() * BLOB_COLORS.length)]!;
  const size = DITHER_GRID_SIZE;
  const half = size / 2;
  const centerX = half - 0.5 + (random() - 0.5) * 3;
  const centerY = half - 0.5 + (random() - 0.5) * 3;
  const falloff = 1.2 + random() * 1.4;
  const noiseWeight = 0.25 + random() * 0.3;

  const cells = Array.from({ length: size * size }, () => false);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < half; x++) {
      const dx = (x - centerX) / half;
      const dy = (y - centerY) / half;
      const base = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) ** falloff);
      const intensity = base * (1 - noiseWeight) + random() * noiseWeight;
      const on = intensity > (BAYER_4[y % 4]![x % 4]! + 0.5) / 16;
      cells[y * size + x] = on;
      cells[y * size + (size - 1 - x)] = on;
    }
  }
  return { size, cells, background, foreground: ditherForegroundColor(background) };
}

/** One SVG path of unit squares for the on cells; a single element per avatar. */
export function identiconPathData(identicon: DitherIdenticon): string {
  const parts: string[] = [];
  for (let y = 0; y < identicon.size; y++) {
    for (let x = 0; x < identicon.size; x++) {
      if (identicon.cells[y * identicon.size + x]) parts.push(`M${x} ${y}h1v1h-1z`);
    }
  }
  return parts.join("");
}

/**
 * In-place ordered dither over RGBA pixels: per-pixel luminance against the
 * tiled Bayer 8×8 threshold, output pure black or white, alpha untouched.
 * Operates on the raw array so tests run without a DOM ImageData.
 */
export function orderedDitherRgba(data: Uint8ClampedArray, width: number, height: number): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const luminance =
        (0.299 * data[index]! + 0.587 * data[index + 1]! + 0.114 * data[index + 2]!) / 255;
      const value = luminance > (BAYER_8[y % 8]![x % 8]! + 0.5) / 64 ? 255 : 0;
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
    }
  }
}

/** Both renderings of one upload, computed together at upload time. */
export interface UploadRendering {
  plainUrl: string;
  ditheredUrl: string;
}

/**
 * The avatar record an upload saves: the dithered rendering with
 * dithered: true when the toggle is on, the plain one with dithered: false
 * otherwise. Null until an image is chosen.
 */
export function resolveUploadAvatar(
  upload: UploadRendering | null,
  ditherEnabled: boolean,
): BotAvatar | null {
  if (upload === null) return null;
  return ditherEnabled
    ? { kind: "image", assetPath: upload.ditheredUrl, dithered: true }
    : { kind: "image", assetPath: upload.plainUrl, dithered: false };
}
