import { assetUrl } from './config.js';
import { imageSrc } from './images.js';

export function injectJsonLd(items, limit = 24) {
  const existing = document.getElementById('mmg-jsonld');
  if (existing) existing.remove();

  const slice = items.slice(0, limit);
  const graph = slice.map((item) => {
    const img = item.images?.[0];
    const contentUrl = img ? assetUrl(`${img.src}-900.webp`) : undefined;
    return {
      '@type': 'ImageObject',
      name: item.headline || item.mural?.name || item.id,
      description: item.text || item.caption,
      contentUrl,
      thumbnailUrl: img ? imageSrc(img.src, 450) : undefined,
      caption: item.caption,
    };
  });

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'mmg-jsonld';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  });
  document.head.appendChild(script);
}
