/**
 * Creates one `page` document per route and fills in the site-wide copy that was still living
 * as literals inside components: the contact band, the footer note, the slogan and the animated
 * figures.
 *
 * After this, the only text on the site the client cannot reach from the Studio is the navigation
 * labels and the form's own field names.
 *
 * Ids are `page-<slug>`, never with a dot — a dot makes a Sanity document private and invisible
 * to the public API the build uses.
 *
 *   npx sanity exec scripts/seed-pages-to-sanity.mjs --with-user-token -- --dry-run
 *   npx sanity exec scripts/seed-pages-to-sanity.mjs --with-user-token
 */
import { getCliClient } from 'sanity/cli';
import { DEFAULT_PAGES, DEFAULT_SITE_SETTINGS, DEFAULT_STATS } from '../src/lib/content.ts';

const client = getCliClient({ apiVersion: '2024-01-01' });
const dryRun = process.argv.includes('--dry-run');

// Array members need a stable `_key`, and deriving it from the section key keeps a re-run from
// duplicating rows or shuffling them.
const keyed = (items, keyOf) => items.map((item, i) => ({ _key: keyOf(item, i), ...item }));

function pageDoc(slug, seed) {
  const sections = Object.entries(seed.sections ?? {}).map(([key, value]) => ({ _key: key, key, ...value }));
  return {
    _id: `page-${slug}`,
    _type: 'page',
    slug,
    ...(seed.seoTitle ? { seoTitle: seed.seoTitle } : {}),
    ...(seed.metaDescription ? { metaDescription: seed.metaDescription } : {}),
    ...(seed.heroEyebrow ? { heroEyebrow: seed.heroEyebrow } : {}),
    ...(seed.heroTitle ? { heroTitle: seed.heroTitle } : {}),
    ...(seed.heroSubtitle ? { heroSubtitle: seed.heroSubtitle } : {}),
    ...(sections.length ? { sections } : {}),
    ...(seed.contentSections?.length
      ? { contentSections: keyed(seed.contentSections, (_, i) => `apartado-${i + 1}`) }
      : {}),
  };
}

async function main() {
  const settingsId = await client.fetch('*[_type == "siteSettings"][0]._id');
  if (!settingsId) throw new Error('No siteSettings document found');

  const pages = Object.entries(DEFAULT_PAGES).map(([slug, seed]) => pageDoc(slug, seed));
  const settings = {
    slogan: DEFAULT_SITE_SETTINGS.slogan,
    ctaTitle: DEFAULT_SITE_SETTINGS.ctaTitle,
    ctaText: DEFAULT_SITE_SETTINGS.ctaText,
    footerNote: DEFAULT_SITE_SETTINGS.footerNote,
    stats: keyed(DEFAULT_STATS, (s) =>
      s.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 40),
    ),
  };

  for (const [key, value] of Object.entries(settings)) {
    if (value === undefined) throw new Error(`settings.${key} is undefined — wrong seed export?`);
  }

  const existing = await client.fetch('*[_type == "page"]._id');
  console.log(`siteSettings ${settingsId} — setIfMissing: ${Object.keys(settings).join(', ')}`);
  for (const p of pages) {
    const fields = Object.keys(p).filter((k) => !k.startsWith('_') && k !== 'slug');
    console.log(`  ${p._id}${existing.includes(p._id) ? ' (ya existe)' : ''} — ${fields.join(', ')}`);
  }
  if (dryRun) return;

  let tx = client.transaction().patch(settingsId, (patch) => patch.setIfMissing(settings));
  pages.forEach((p) => {
    tx = tx.createIfNotExists(p);
  });
  await tx.commit();

  console.log(`Patched siteSettings, ensured ${pages.length} page documents.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
