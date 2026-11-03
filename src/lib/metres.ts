// Lengths are kept as numbers of metres, always on a material's step (usually 0.5 m).

export function snapMetres(value: number, min: number, step: number, max?: number): number {
  const snapped = Math.round(value / step) * step;
  const clamped = Math.max(min, max !== undefined ? Math.min(snapped, max) : snapped);
  return Math.round(clamped * 100) / 100;
}

export function isValidLength(metres: number, min: number, step: number): boolean {
  if (!Number.isFinite(metres) || metres < min) return false;
  const units = metres / step;
  return Math.abs(units - Math.round(units)) < 1e-6;
}

/** Line total in fils, rounded to the nearest fils. */
export function lineTotal(priceFils: number, metres: number): number {
  return Math.round(priceFils * metres);
}
