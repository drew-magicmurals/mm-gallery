import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const WIDTHS = [450, 900, 1600];

export async function writeResponsiveWebp(srcBuffer, basePathWithoutExt) {
  const meta = await sharp(srcBuffer).metadata();
  const w = meta.width || 1000;
  const h = meta.height || 750;

  await fs.mkdir(path.dirname(basePathWithoutExt), { recursive: true });

  for (const width of WIDTHS) {
    const out = `${basePathWithoutExt}-${width}.webp`;
    await sharp(srcBuffer)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(out);
  }

  const aspectW = w;
  const aspectH = h;
  return { w: aspectW, h: aspectH };
}

/** Procedural placeholder when legacy images are unavailable */
export async function writePlaceholderWebp(basePathWithoutExt, hue, label) {
  const w = 1200;
  const h = 900;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue},35%,88%)"/>
        <stop offset="100%" stop-color="hsl(${hue},45%,72%)"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
      font-family="system-ui,sans-serif" font-size="28" fill="hsl(${hue},30%,35%)">${label}</text>
  </svg>`;
  const buf = Buffer.from(svg);
  return writeResponsiveWebp(buf, basePathWithoutExt);
}
