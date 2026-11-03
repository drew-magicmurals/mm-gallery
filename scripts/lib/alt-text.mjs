/** Build public alt text using taxonomy labels (e.g. "living room", not "living"). */

const NO_ROOM_SUFFIX = /\b(room|office|cave|hallway|kitchen|bathroom|garage|spa|bistro|studio|sanctuary|cellar|trailer)\b/i;

export function roomAltPhrase(rooms, taxonomyRooms, segment, taxonomySectors, sectors) {
  if (segment === 'business' && sectors?.length && taxonomySectors) {
    return (taxonomySectors[sectors[0]] || 'business space').toLowerCase();
  }
  if (!rooms?.length || !taxonomyRooms) return 'customer space';
  const label = taxonomyRooms[rooms[0]] || 'room';
  const lower = label.toLowerCase();
  if (NO_ROOM_SUFFIX.test(lower)) return lower;
  return `${lower} room`;
}

export function imageAltText(muralName, rooms, taxonomyRooms, segment, taxonomySectors, sectors) {
  const place = roomAltPhrase(rooms, taxonomyRooms, segment, taxonomySectors, sectors);
  if (!muralName) return `Customer photo installed in a ${place}`;
  return `${muralName} installed in a ${place}`;
}
