// PWA 아이콘 생성 스크립트
// 실행: node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "fs";

mkdirSync("public/icons", { recursive: true });

const svgIcon = (size) => {
  const r = Math.round(size * 0.18);
  const fs1 = Math.round(size * 0.26);
  const fs2 = Math.round(size * 0.3);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#3d5af1"/>
  <rect x="${size*0.08}" y="${size*0.08}" width="${size*0.84}" height="${size*0.84}" rx="${r*0.7}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="${size*0.025}"/>
  <text x="${size/2}" y="${size*0.44}" font-family="sans-serif" font-weight="bold" font-size="${fs1}" fill="white" text-anchor="middle" dominant-baseline="middle">단평</text>
  <text x="${size/2}" y="${size*0.73}" font-family="sans-serif" font-weight="bold" font-size="${fs2}" fill="#ff6b6b" text-anchor="middle" dominant-baseline="middle">GO</text>
</svg>`);
};

await sharp(svgIcon(192)).png().toFile("public/icons/icon-192.png");
await sharp(svgIcon(512)).png().toFile("public/icons/icon-512.png");
await sharp(svgIcon(180)).png().toFile("public/icons/apple-touch-icon.png");
console.log("✅ 아이콘 생성 완료: public/icons/");
