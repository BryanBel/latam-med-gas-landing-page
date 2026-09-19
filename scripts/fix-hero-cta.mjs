// Points the hero's primary call to action at the contact page.
//
//   npx sanity exec scripts/fix-hero-cta.mjs --with-user-token
//
// heroSection.ctaLink still held "#contacto" from when the site was a single page. The
// multi-page restructure moved the form to /contacto/ and removed that anchor, so the main
// "Solicitar cotización" button had been scrolling nowhere ever since. The seed in
// src/lib/content.ts was already correct, but a populated Sanity field always wins over it.
//
// Safe to re-run: it only writes when the stored value is not already the page URL.
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2024-01-01' });
const TARGET = '/contacto/';

async function run() {
  const doc = await client.fetch('*[_type == "heroSection"][0]{_id, ctaLink}');
  if (!doc) throw new Error('No heroSection document found in the dataset');

  if (doc.ctaLink === TARGET) {
    console.log(`Nothing to do: ctaLink is already ${TARGET}`);
    return;
  }

  await client.patch(doc._id).set({ ctaLink: TARGET }).commit({ visibility: 'sync' });
  console.log(`ctaLink: ${doc.ctaLink ?? '(empty)'}  ->  ${TARGET}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
