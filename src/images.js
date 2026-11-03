import { assetUrl } from './config.js';

export function imageSrcSet(srcBase) {
  const widths = [450, 900, 1600];
  return widths.map((w) => `${assetUrl(`${srcBase}-${w}.webp`)} ${w}w`).join(', ');
}

export function imageSrc(srcBase, w) {
  const width = w <= 450 ? 450 : w <= 900 ? 900 : 1600;
  return assetUrl(`${srcBase}-${width}.webp`);
}

export function pinterestUrl(pageUrl, imageUrl, description) {
  const u = new URL('https://www.pinterest.com/pin/create/button/');
  u.searchParams.set('url', pageUrl);
  u.searchParams.set('media', imageUrl);
  u.searchParams.set('description', description);
  return u.toString();
}
