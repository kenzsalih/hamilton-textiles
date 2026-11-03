// Groups a fabric's exact colour into a family shoppers can filter by.

export const COLOUR_FAMILIES = {
  black: "#16161a",
  white: "#f6f3ec",
  grey: "#8d9294",
  beige: "#cdb894",
  brown: "#7a5236",
  red: "#a8262f",
  pink: "#e29bb0",
  orange: "#d9793f",
  yellow: "#e6c34a",
  green: "#4e7b55",
  blue: "#2f5597",
  purple: "#6d3f7f",
} as const;

export type ColourFamily = keyof typeof COLOUR_FAMILIES;

export function colourFamily(hex: string | null): ColourFamily | null {
  if (!hex) return null;
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  if (l < 0.14) return "black";
  if (l > 0.88 && s < 0.5) return "white";
  if (s < 0.12) return l > 0.8 ? "white" : "grey";

  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = (h * 60 + 360) % 360;

  if (h < 15 || h >= 345) return l > 0.7 ? "pink" : "red";
  if (h < 45) {
    if (s < 0.45 && l > 0.55) return "beige";
    return l < 0.45 ? "brown" : "orange";
  }
  if (h < 65) return s < 0.45 ? "beige" : "yellow";
  if (h < 170) return "green";
  if (h < 255) return "blue";
  if (h < 300) return "purple";
  return l > 0.65 ? "pink" : "red";
}
