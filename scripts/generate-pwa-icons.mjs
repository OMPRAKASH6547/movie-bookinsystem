import sharp from "sharp";
import { mkdirSync } from "fs";

mkdirSync("public/icons", { recursive: true });

function svg(size) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="#0a0908"/>
  <rect x="${size * 0.12}" y="${size * 0.12}" width="${size * 0.76}" height="${size * 0.76}" rx="${size * 0.12}" fill="#e11d48"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-weight="700" font-size="${size * 0.34}" fill="#fff7f5">C</text>
</svg>`);
}

for (const size of [192, 512]) {
  await sharp(svg(size)).png().toFile(`public/icons/icon-${size}.png`);
}
await sharp(svg(180)).png().toFile("public/icons/apple-touch-icon.png");
console.log("PWA icons generated");
