/** Legacy type codes (after segment letter) → public taxonomy keys */
export const LEGACY_ROOM_CODES = {
  Ba: 'Ba',
  Be: 'Be',
  Bor: 'Bor',
  Bo: 'Bo',
  D: 'D',
  Eh: 'Eh',
  Rf: 'Rf',
  G: 'G',
  Gi: 'Gi',
  Ho: 'Ho',
  Kid: 'Kid',
  Ki: 'Ki',
  L: 'L',
  M: 'M',
  Ro: 'Ro',
};

export const LEGACY_SECTOR_CODES = {
  Ch: 'Ch',
  Co: 'Co',
  E: 'E',
  Li: 'Li',
  Me: 'Me',
  Mu: 'Mu',
  Rc: 'Rc',
  Re: 'Re',
  Ret: 'Ret',
  S: 'S',
  Sc: 'Sc',
  Buo: 'Buo',
};

export function parseLegacyType(typeStr) {
  const raw = String(typeStr || 'R,L').trim();
  const segment = raw.charAt(0).toUpperCase() === 'B' ? 'business' : 'residential';
  const codes = raw
    .slice(1)
    .replace(/^[,.\s]+/, '')
    .split(/[,.\s]+/)
    .map((c) => c.trim())
    .filter(Boolean);

  const rooms = [];
  const sectors = [];
  for (const code of codes) {
    if (LEGACY_ROOM_CODES[code]) rooms.push(LEGACY_ROOM_CODES[code]);
    else if (LEGACY_SECTOR_CODES[code]) sectors.push(LEGACY_SECTOR_CODES[code]);
  }
  if (segment === 'residential' && rooms.length === 0) rooms.push('L');
  if (segment === 'business' && sectors.length === 0) sectors.push('Co');

  return { segment, rooms, sectors };
}

export function stripHtml(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim()
    .replace(/'+$/g, '');
}
