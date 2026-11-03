// Renders the admin app icons (home-screen / APK) from the logo.
// Run from the project root with: node scripts/admin-icons.mjs

import { readFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";

const logo = readFileSync("public/logo.svg", "utf8");
const inner = logo.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

// Logo centred on the brand green, inside the maskable safe zone (80%).
const icon = (size, pad) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#132820"/>
  <g transform="translate(${pad} ${pad}) scale(${(100 - pad * 2) / 100})">${inner}</g>
</svg>`;

mkdirSync("public/admin", { recursive: true });
for (const size of [192, 512]) {
  await sharp(Buffer.from(icon(size, 18))).png().toFile(`public/admin/icon-${size}.png`);
}
await sharp(Buffer.from(icon(180, 14))).png().toFile("public/admin/apple-touch-icon.png");
console.log("Wrote public/admin icons");
