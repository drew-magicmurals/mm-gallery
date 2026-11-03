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

export const SWATCH_LABELS = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  teal: 'Teal',
  blue: 'Blue',
  purple: 'Purple',
  pink: 'Pink',
  neutral: 'Neutral',
  blackwhite: 'Black and white',
  brown: 'Brown and earth',
};

export function itemDominantColor(item) {
  const img = item.images?.[0];
  return img?.dominant || null;
}

export function itemHasColorBucket(item, bucket) {
  if (!bucket) return true;
  return (item.images || []).some((im) => im.dominant === bucket);
}

export function hasColorData(items) {
  return items.some((i) => i.images?.[0]?.dominant);
}
