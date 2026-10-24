// Colour-vision-deficiency simulation (Machado, Oliveira & Fernandes 2009, severity 1.0),
// applied in linear sRGB, and a perceptual distance in OKLab.
import { hexToRgb, rgbToOklab } from './color-math.js';

const M = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};
export const CVD_TYPES = ['normal', ...Object.keys(M)];

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const clamp = (v) => Math.min(1, Math.max(0, v));

/** Simulated colour as an sRGB triple (0..1). */
export function simulate(hex, type) {
  const rgb = hexToRgb(hex);
  if (type === 'normal') return rgb;
  const lin = rgb.map(toLinear);
  return M[type].map((row) => toGamma(clamp(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2])));
}

/** OKLab distance between two colours as seen with a given vision type. */
export function distance(a, b, type = 'normal') {
  const [x, y] = [simulate(a, type), simulate(b, type)].map(rgbToOklab);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

/** Smallest distance across all vision types. */
export function worstDistance(a, b) {
  return Math.min(...CVD_TYPES.map((t) => distance(a, b, t)));
}
