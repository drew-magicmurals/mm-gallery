const NO_ROOM_SUFFIX = /\b(room|office|cave|hallway|kitchen|bathroom|garage|spa|bistro|studio|sanctuary|cellar|trailer)\b/i;

export function roomAltPhrase(item, taxonomy) {
  if (item.segment === 'business' && item.sectors?.length) {
    return (taxonomy?.sectors?.[item.sectors[0]] || 'business space').toLowerCase();
  }
  if (!item.rooms?.length) return 'customer space';
  const label = taxonomy?.rooms?.[item.rooms[0]] || 'room';
  const lower = label.toLowerCase();
  if (NO_ROOM_SUFFIX.test(lower)) return lower;
  return `${lower} room`;
}

export function displayAlt(item, image, taxonomy) {
  if (image?.alt && !/installed in a living[^ ]*$/.test(image.alt)) {
    return image.alt;
  }
  const mural = item.mural?.name || item.headline || 'Custom mural';
  return `${mural} installed in a ${roomAltPhrase(item, taxonomy)}`;
}
