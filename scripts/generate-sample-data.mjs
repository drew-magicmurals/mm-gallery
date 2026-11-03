import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writePlaceholderWebp } from './lib/images.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

const SAMPLE = [
  {
    caption: 'Allie B., Stafford Springs, CT',
    headline: 'Vintage Eiffel Tower',
    text: 'We love how the mural transformed our living room. Installation was straightforward.',
    mural: { name: 'Vintage Eiffel Tower', url: '/vintage-eiffel-tower.html' },
    segment: 'residential',
    rooms: ['L'],
    featured: true,
    score: 0.92,
    added: '2016-07-04',
  },
  {
    caption: 'Marcus T., Denver, CO',
    headline: 'Mountain sunrise',
    text: 'Perfect fit above the fireplace.',
    mural: { name: 'Alpine Dawn', url: '/alpine-dawn.html' },
    segment: 'residential',
    rooms: ['L', 'M'],
    featured: false,
    score: 0.78,
    added: '2019-03-12',
  },
  {
    caption: 'Jenny K., Austin, TX',
    headline: 'Kids space explorer',
    text: '',
    mural: { name: 'Space Explorer', url: '/space-explorer.html' },
    segment: 'residential',
    rooms: ['Kid'],
    score: 0.65,
    added: '2020-08-01',
  },
  {
    caption: 'River Cafe, Portland, OR',
    headline: 'Custom vineyard scene',
    text: 'Guests always comment on the wall.',
    mural: { name: 'Custom vineyard', url: null },
    segment: 'business',
    sectors: ['Re'],
    score: 0.88,
    added: '2018-11-20',
  },
  {
    caption: 'St. Luke Church, Ohio',
    headline: 'Stained glass inspired',
    text: 'Beautiful and reverent.',
    mural: { name: 'Gothic Light', url: '/gothic-light.html' },
    segment: 'business',
    sectors: ['Ch'],
    featured: true,
    score: 0.95,
    added: '2015-05-09',
  },
  {
    caption: 'Dana W., Seattle, WA',
    headline: 'Bamboo spa feel',
    text: 'Calming bathroom upgrade.',
    mural: { name: 'Bamboo Grove', url: '/bamboo-grove.html' },
    segment: 'residential',
    rooms: ['Ba'],
    score: 0.71,
    added: '2021-02-14',
  },
  {
    caption: 'Northside Library',
    headline: 'World map mural',
    text: '',
    mural: { name: 'Antique World Map', url: '/antique-world-map.html' },
    segment: 'business',
    sectors: ['Li'],
    score: 0.82,
    added: '2017-09-30',
  },
  {
    caption: 'Chris & Sam, Boston, MA',
    headline: 'City skyline at night',
    text: 'Dining room focal point.',
    mural: { name: 'Boston Skyline', url: '/boston-skyline.html' },
    segment: 'residential',
    rooms: ['D'],
    score: 0.69,
    added: '2022-06-18',
  },
  {
    caption: 'Glow Salon, Miami, FL',
    headline: 'Tropical palms',
    text: '',
    mural: { name: 'Tropical Palms', url: '/tropical-palms.html' },
    segment: 'business',
    sectors: ['S'],
    score: 0.74,
    added: '2023-01-05',
  },
  {
    caption: 'Pat R., Phoenix, AZ',
    headline: 'Desert landscape',
    text: 'Home office inspiration daily.',
    mural: { name: 'Sonoran Vista', url: '/sonoran-vista.html' },
    segment: 'residential',
    rooms: ['Ho'],
    score: 0.67,
    added: '2014-12-01',
  },
  {
    caption: 'Westfield Elementary',
    headline: 'Underwater adventure',
    text: 'Students love it!',
    mural: { name: 'Ocean Friends', url: '/ocean-friends.html' },
    segment: 'business',
    sectors: ['Sc'],
    featured: true,
    score: 0.9,
    added: '2016-04-22',
  },
  {
    caption: 'Elena M., Chicago, IL',
    headline: 'Cherry blossom',
    text: '',
    mural: { name: 'Cherry Blossom', url: '/cherry-blossom.html' },
    segment: 'residential',
    rooms: ['Be'],
    score: 0.63,
    added: '2019-10-10',
  },
  {
    caption: 'AutoHaus Garage',
    headline: 'Racing stripes custom',
    text: 'Bold and fun.',
    mural: { name: 'Custom racing', url: null },
    segment: 'business',
    sectors: ['Ret'],
    score: 0.58,
    added: '2020-07-07',
  },
  {
    caption: 'Tyler N., Nashville, TN',
    headline: 'Music city mural',
    text: 'Man cave complete.',
    mural: { name: 'Music City', url: '/music-city.html' },
    segment: 'residential',
    rooms: ['M'],
    score: 0.76,
    added: '2018-03-03',
  },
  {
    caption: 'Harbor Medical',
    headline: 'Calm coastal',
    text: 'Waiting room feels larger.',
    mural: { name: 'Coastal Calm', url: '/coastal-calm.html' },
    segment: 'business',
    sectors: ['Me'],
    score: 0.85,
    added: '2021-11-11',
  },
  {
    caption: 'Rosa P., San Diego, CA',
    headline: 'Kitchen herb garden',
    text: '',
    mural: { name: 'Herb Garden', url: '/herb-garden.html' },
    segment: 'residential',
    rooms: ['Ki'],
    score: 0.61,
    added: '2017-07-19',
  },
  {
    caption: 'Metro Museum Annex',
    headline: 'Dinosaur dig scene',
    text: '',
    mural: { name: 'Dino Dig', url: '/dino-dig.html' },
    segment: 'business',
    sectors: ['Mu'],
    score: 0.79,
    added: '2015-08-08',
  },
  {
    caption: 'Kim & Lee, Atlanta, GA',
    headline: 'Girl room fairy forest',
    text: 'Magical!',
    mural: { name: 'Fairy Forest', url: '/fairy-forest.html' },
    segment: 'residential',
    rooms: ['Gi'],
    score: 0.72,
    added: '2022-09-09',
  },
  {
    caption: 'Corporate HQ Lobby',
    headline: 'Brand wall graphic',
    text: '',
    mural: { name: 'Custom brand wall', url: null },
    segment: 'business',
    sectors: ['Co'],
    score: 0.81,
    added: '2023-04-04',
  },
  {
    caption: 'Jordan H., Minneapolis, MN',
    headline: 'Lake cabin scene',
    text: 'Bonus room getaway vibe.',
    mural: { name: 'Lake Cabin', url: '/lake-cabin.html' },
    segment: 'residential',
    rooms: ['Bor'],
    score: 0.68,
    added: '2016-01-15',
  },
];

function roomLabel(rooms, taxonomyRooms) {
  if (!rooms?.length) return 'room';
  return taxonomyRooms[rooms[0]]?.toLowerCase() || 'room';
}

export async function generateSampleGallery() {
  const taxonomy = JSON.parse(
    await fs.readFile(path.join(PUBLIC, 'data/taxonomy.json'), 'utf8'),
  );

  const items = [];
  let n = 1;
  for (const row of SAMPLE) {
    const id = `G-${String(n).padStart(4, '0')}`;
    const imgBase = path.join(PUBLIC, 'img', `${id}-1`);
    const relSrc = `img/${id}-1`;
    const hue = (n * 37) % 360;
    const label = row.mural?.name || row.headline;
    const dims = await writePlaceholderWebp(imgBase, hue, label.slice(0, 40));

    const muralName = row.mural?.name || row.headline;
    const alt = `${muralName} installed in a ${roomLabel(row.rooms, taxonomy.rooms)}`;

    items.push({
      id,
      images: [{ src: relSrc, w: dims.w, h: dims.h, alt }],
      caption: row.caption,
      headline: row.headline,
      text: row.text,
      mural: row.mural?.url
        ? { name: row.mural.name, url: row.mural.url }
        : row.mural?.name
          ? { name: row.mural.name, url: null }
          : null,
      segment: row.segment,
      rooms: row.rooms || [],
      sectors: row.sectors || [],
      material: null,
      featured: Boolean(row.featured),
      score: row.score ?? 0,
      added: row.added,
    });
    n += 1;
  }

  const gallery = {
    version: 1,
    generated: new Date().toISOString(),
    items,
  };

  await fs.writeFile(
    path.join(PUBLIC, 'data/gallery.json'),
    JSON.stringify(gallery, null, 2) + '\n',
  );

  console.log(`Wrote ${items.length} sample items to public/data/gallery.json`);
  return gallery;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.join(__dirname, 'generate-sample-data.mjs');
if (isMain) {
  generateSampleGallery().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
