// Contrast grades: 0 = white, 100 = black.
// Target luminance is chosen so that contrast(a, b) = 21^(|a-b|/100):
//   gap 40 -> 3.38:1, gap 50 -> 4.58:1, gap 70 -> 8.41:1.
import { hexForLuminance, hexToOklch, oklchToHex, luminance, contrast } from './color-math.js';

export const GRADES = Array.from({ length: 19 }, (_, i) => (i + 1) * 5); // 5..95

export const targetLuminance = (g) => 1.05 * 21 ** (-g / 100) - 0.05;

/** Grade of any colour (can be fractional). */
export const gradeOf = (hex) => (-100 * Math.log((luminance(hex) + 0.05) / 1.05)) / Math.log(21);

/** Chroma envelope: peaks mid-scale, tapers to white and black. */
const shape = (g) => Math.sin((Math.PI * Math.min(100, Math.max(0, g))) / 100) ** 0.7;

/**
 * Build a scale for one hue.
 * anchor: optional { grade, C } — the chroma curve is scaled so the anchor grade keeps chroma C
 * (used to keep the brand colour's own shade as close as possible to the brand hex).
 */
export function scale(H, peakC, grades = GRADES, anchor = null) {
  const k = anchor ? anchor.C / Math.max(shape(anchor.grade), 1e-3) : peakC;
  return Object.fromEntries(grades.map((g) => [g, shadeFor(g, k * shape(g), H)]));
}

/**
 * Hex for a grade. Rounding to 8-bit hex can move luminance by ~2% in dark shades, which would eat
 * the margin of the 50-grade rule (4.58 vs 4.5). So we try nearby lightness values and keep the hex
 * whose (luminance + 0.05) is closest to the target — typically within 0.3%.
 */
export function shadeFor(g, C, H) {
  if (g <= 0) return '#FFFFFF';
  if (g >= 100) return '#000000';
  const target = targetLuminance(g) + 0.05;
  const first = hexForLuminance(target - 0.05, C, H);
  const L0 = hexToOklch(first).L;
  let best = first, bestErr = Math.abs(luminance(first) + 0.05 - target) / target;
  for (let i = -60; i <= 60; i++) {
    const hex = oklchToHex({ L: L0 + i * 0.0005, C, H });
    const err = Math.abs(luminance(hex) + 0.05 - target) / target;
    if (err < bestErr) { best = hex; bestErr = err; }
  }
  return best;
}

export function describe(hex) {
  const { L, C, H } = hexToOklch(hex);
  return { L, C, H, grade: gradeOf(hex) };
}

/** Worst contrast between any two grades `gap` apart in a scale (used by tests and the report). */
export function worstGapContrast(sc, gap) {
  let worst = Infinity;
  const all = { 0: '#FFFFFF', ...sc, 100: '#000000' };
  const gs = Object.keys(all).map(Number);
  for (const a of gs) for (const b of gs) if (b - a >= gap) worst = Math.min(worst, contrast(all[a], all[b]));
  return worst;
}
