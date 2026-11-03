export const COLOR_BUCKETS = [
  { key: 'red', label: 'Red', hue: [350, 15] },
  { key: 'orange', label: 'Orange', hue: [16, 45] },
  { key: 'yellow', label: 'Yellow', hue: [46, 65] },
  { key: 'green', label: 'Green', hue: [66, 150] },
  { key: 'teal', label: 'Teal', hue: [151, 185] },
  { key: 'blue', label: 'Blue', hue: [186, 250] },
  { key: 'purple', label: 'Purple', hue: [251, 290] },
  { key: 'pink', label: 'Pink', hue: [291, 349] },
  { key: 'neutral', label: 'Neutral', neutral: true },
  { key: 'blackwhite', label: 'Black & white', bw: true },
  { key: 'brown', label: 'Brown & earth', brown: true },
];

export const SWATCH_HEX = {
  red: '#c0392b',
  orange: '#e67e22',
  yellow: '#f1c40f',
  green: '#3c9b35',
  teal: '#16a085',
  blue: '#2980b9',
  purple: '#8e44ad',
  pink: '#e84393',
  neutral: '#9e9e9e',
  blackwhite: '#2c2c2c',
  brown: '#795548',
};

export function rgbToBucket(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2 / 255;
  const d = max - min;

  if (max < 35 && min < 35) return 'blackwhite';
  if (max > 240 && min > 220) return 'blackwhite';
  if (d < 18 && l > 0.75) return 'blackwhite';
  if (d < 15) return 'neutral';

  if (d < 40 && r > g && g > b && r > 80) return 'brown';

  if (d < 25 && l > 0.55 && l < 0.85) return 'neutral';

  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  for (const bkt of COLOR_BUCKETS) {
    if (bkt.hue && h >= bkt.hue[0] && h <= bkt.hue[1]) return bkt.key;
    if (bkt.hue && bkt.hue[0] > bkt.hue[1] && (h >= bkt.hue[0] || h <= bkt.hue[1])) return bkt.key;
  }
  return 'neutral';
}
