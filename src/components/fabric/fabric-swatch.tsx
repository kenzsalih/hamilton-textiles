import { useId } from "react";
import type { FabricPattern } from "@/lib/catalog/types";

/**
 * Procedural cloth texture used wherever a fabric has no photo yet.
 * Each weave gets its own surface, and a soft drape shading sits on top
 * so the swatch reads as hanging fabric rather than a flat colour block.
 */
export function FabricSwatch({
  hex,
  pattern,
  className,
  drape = true,
}: {
  hex: string;
  pattern: FabricPattern;
  className?: string;
  drape?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const light = mix(hex, "#ffffff", 0.35);
  const dark = mix(hex, "#000000", 0.35);
  const isDark = luminance(hex) < 0.18;
  const accent = isDark ? mix(hex, "#ffffff", 0.15) : mix(hex, "#000000", 0.12);

  return (
    <svg className={className} viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id={`grain-${id}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={pattern === "crepe" ? 1.4 : pattern === "linen" ? "0.9 0.05" : 0.8}
            numOctaves={pattern === "linen" ? 3 : 2}
            seed={hex.length + pattern.length}
            result="noise"
          />
          <feColorMatrix
            in="noise"
            values={`0 0 0 0 ${isDark ? 1 : 0}  0 0 0 0 ${isDark ? 1 : 0}  0 0 0 0 ${isDark ? 1 : 0}  0 0 0 ${pattern === "crepe" || pattern === "linen" ? 0.22 : 0.08} 0`}
          />
        </filter>

        <linearGradient id={`drape-${id}`} x1="0" x2="1" y1="0" y2="0.15">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="0.16" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="0.3" stopColor="#000" stopOpacity="0.16" />
          <stop offset="0.48" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="0.62" stopColor="#000" stopOpacity="0.2" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>

        <linearGradient id={`sheen-${id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0.25" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.38" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.85" stopColor="#fff" stopOpacity="0" />
        </linearGradient>

        <pattern id={`twill-${id}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <rect width="6" height="6" fill={hex} />
          <rect width="2.2" height="6" fill={accent} opacity="0.7" />
        </pattern>

        <pattern id={`stripe-${id}`} width="22" height="22" patternUnits="userSpaceOnUse">
          <rect width="22" height="22" fill={hex} />
          <rect x="10" width="1.4" height="22" fill={mix(hex, "#ffffff", 0.75)} />
        </pattern>

        <pattern id={`floral-${id}`} width="90" height="90" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
          <rect width="90" height="90" fill={hex} />
          {[
            [22, 24, "#f1c14b", 13],
            [68, 66, mix(hex, "#ffffff", 0.7), 11],
            [70, 18, "#2e6b4f", 6],
            [20, 72, "#2e6b4f", 7],
          ].map(([cx, cy, fill, r], i) => (
            <g key={i} transform={`translate(${cx} ${cy})`}>
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse key={a} rx={Number(r) * 0.55} ry={Number(r)} transform={`rotate(${a}) translate(0 ${-Number(r) * 0.8})`} fill={fill as string} opacity="0.92" />
              ))}
              <circle r={Number(r) * 0.42} fill={i % 2 ? "#f1c14b" : dark} />
            </g>
          ))}
          <path d="M40 40 q 8 -10 18 -4 M8 48 q 10 4 14 -8" stroke="#2e6b4f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </pattern>

        <pattern id={`lace-${id}`} width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill={hex} />
          <g fill="none" stroke={mix(hex, "#000000", 0.18)} strokeWidth="1.1">
            <circle cx="20" cy="20" r="11" />
            <circle cx="20" cy="20" r="5" />
            <circle cx="0" cy="0" r="7" />
            <circle cx="40" cy="0" r="7" />
            <circle cx="0" cy="40" r="7" />
            <circle cx="40" cy="40" r="7" />
            <path d="M20 9 V0 M20 31 V40 M9 20 H0 M31 20 H40" />
          </g>
        </pattern>
      </defs>

      <rect width="400" height="500" fill={pattern in FILLS ? `url(#${FILLS[pattern]}-${id})` : hex} />

      {pattern === "chiffon" && (
        <g opacity="0.55">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d={`M${-40 + i * 80} -10 C ${10 + i * 80} 160, ${-60 + i * 80} 330, ${i * 80} 520`}
              stroke={light}
              strokeWidth="38"
              fill="none"
              opacity="0.45"
            />
          ))}
        </g>
      )}

      <rect width="400" height="500" filter={`url(#grain-${id})`} />
      {(pattern === "satin" || pattern === "chiffon") && <rect width="400" height="500" fill={`url(#sheen-${id})`} />}
      {drape && <rect width="400" height="500" fill={`url(#drape-${id})`} style={{ mixBlendMode: "soft-light" }} />}
    </svg>
  );
}

const FILLS: Partial<Record<FabricPattern, string>> = {
  twill: "twill",
  stripe: "stripe",
  floral: "floral",
  lace: "lace",
};

function parse(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

function luminance(hex: string): number {
  const [r, g, b] = parse(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
