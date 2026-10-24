// Colour math: sRGB <-> OKLab/OKLCH, WCAG luminance and contrast, gamut mapping.
// No dependencies. All functions are pure.

export function hexToRgb(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Invalid hex colour: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

export function rgbToHex([r, g, b]) {
  const to = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function rgbToOklab([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToLinearRgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function hexToOklch(hex) {
  const [L, a, b] = rgbToOklab(hexToRgb(hex));
  const C = Math.sqrt(a * a + b * b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}

function oklchToLinear({ L, C, H }) {
  const hr = (H * Math.PI) / 180;
  return oklabToLinearRgb([L, C * Math.cos(hr), C * Math.sin(hr)]);
}

const inGamut = (lin) => lin.every((v) => v >= -1e-6 && v <= 1 + 1e-6);

/** OKLCH -> hex, reducing chroma (keeping L and H) until the colour fits sRGB. */
export function oklchToHex({ L, C, H }) {
  let lo = 0, hi = C, lin = oklchToLinear({ L, C, H });
  if (!inGamut(lin)) {
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear({ L, C: mid, H }))) lo = mid; else hi = mid;
    }
    lin = oklchToLinear({ L, C: lo, H });
  }
  return rgbToHex(lin.map((v) => toGamma(Math.min(1, Math.max(0, v)))));
}

/** WCAG 2.x relative luminance. */
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two opaque colours. */
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Composite a colour with alpha over an opaque background (for overlays/state layers). */
export function composite(fgHex, alpha, bgHex) {
  const f = hexToRgb(fgHex), b = hexToRgb(bgHex);
  return rgbToHex(f.map((v, i) => v * alpha + b[i] * (1 - alpha)));
}

/**
 * Find the OKLCH lightness for (C, H) whose sRGB result has the target WCAG luminance.
 * This is what makes "step 600" mean the same contrast in every hue.
 */
export function hexForLuminance(targetY, C, H) {
  let lo = 0, hi = 1, hex = '#000000';
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    hex = oklchToHex({ L: mid, C, H });
    if (luminance(hex) < targetY) lo = mid; else hi = mid;
  }
  return oklchToHex({ L: (lo + hi) / 2, C, H });
}

export const hueDistance = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};
