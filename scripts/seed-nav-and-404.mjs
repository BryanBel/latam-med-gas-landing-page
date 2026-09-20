/**
 * Fills the last of the copy that was still only in code: the navigation menu and the 404 page.
 *
 * The menu's destinations stay a fixed list in the schema rather than free text — a typo there
 * would point an entry at a page that does not exist — but the labels and the order are the
 * client's now.
 *
 *   npx sanity exec scripts/seed-nav-and-404.mjs --with-user-token -- --dry-run
 *   npx sanity exec scripts/seed-nav-and-404.mjs --with-user-token
 */
import { getCliClient } from 'sanity/cli';
import { NAV_LINKS, DEFAULT_PAGES } from '../src/lib/content.ts';

const client = getCliClient({ apiVersion: '2024-01-01' });
const dryRun = process.argv.includes('--dry-run');

async function main() {
  const settingsId = await client.fetch('*[_type == "siteSettings"][0]._id');
  if (!settingsId) throw new Error('No siteSettings document found');

  const navLinks = NAV_LINKS.map((link) => ({
    _key: link.href.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'inicio',
    label: link.label,
    href: link.href,
  }));

  const seed = DEFAULT_PAGES['404'];
  const page404 = {
    _id: 'page-404',
    _type: 'page',
    slug: '404',
    seoTitle: seed.seoTitle,
    metaDescription: seed.metaDescription,
    heroEyebrow: seed.heroEyebrow,
    heroTitle: seed.heroTitle,
    heroSubtitle: seed.heroSubtitle,
  };

  for (const [key, value] of Object.entries(page404)) {
    if (value === undefined) throw new Error(`page-404.${key} is undefined — wrong seed export?`);
  }

  console.log(`siteSettings ${settingsId} — setIfMissing navLinks:`);
  navLinks.forEach((l) => console.log(`  ${l.label.padEnd(20)} ${l.href}`));
  const exists = await client.fetch('defined(*[_id == "page-404"][0]._id)');
  console.log(`page-404 — createIfNotExists${exists ? ' (ya existe)' : ''}: ${page404.heroTitle}`);
  if (dryRun) return;

  await client
    .transaction()
    .patch(settingsId, (p) => p.setIfMissing({ navLinks }))
    .createIfNotExists(page404)
    .commit();

  console.log('Listo.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
