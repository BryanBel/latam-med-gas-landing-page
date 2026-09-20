/**
 * Seeds `orderRank` on the four orderable collections so the Studio's drag-and-drop list opens
 * in the order the site already renders, instead of an arbitrary one.
 *
 * The plugin compares ranks as strings, so the numeric part is zero-padded to a fixed width:
 * "0|010000:" must sort after "0|002000:", which only holds if both are the same length.
 * Spacing them by 1000 leaves room for the plugin to insert midpoints when an editor drags a
 * row without having to rewrite its neighbours.
 *
 *   npx sanity exec scripts/init-order-ranks.mjs --with-user-token -- --dry-run
 *   npx sanity exec scripts/init-order-ranks.mjs --with-user-token
 */
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2024-01-01' });
const dryRun = process.argv.includes('--dry-run');

const TYPES = ['service', 'course', 'certification', 'project'];
const rank = (i) => `0|${String((i + 1) * 1000).padStart(6, '0')}:`;

async function main() {
  let tx = client.transaction();
  let writes = 0;

  for (const type of TYPES) {
    const docs = await client.fetch(
      '*[_type == $type] | order(coalesce(order, 9999) asc, _createdAt asc){_id, order, orderRank}',
      { type },
    );
    console.log(`${type}: ${docs.length} documento(s)`);
    docs.forEach((doc, i) => {
      if (doc.orderRank) {
        console.log(`  ${doc._id} ya tiene orderRank ${doc.orderRank}`);
        return;
      }
      console.log(`  ${doc._id} (order ${doc.order ?? '—'}) -> ${rank(i)}`);
      tx = tx.patch(doc._id, (p) => p.setIfMissing({ orderRank: rank(i) }));
      writes += 1;
    });
  }

  if (dryRun || writes === 0) {
    console.log(dryRun ? 'dry-run: nada escrito.' : 'Nada que hacer.');
    return;
  }
  await tx.commit();
  console.log(`orderRank asignado a ${writes} documento(s).`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
