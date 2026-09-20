/**
 * The published privacy policy carried an unfilled placeholder — "Conservamos los mensajes
 * durante *[por definir]*" — in the section on how long contact messages are kept. A visible
 * blank in a legal text is worse than a conservative statement, so this replaces it with
 * wording that is accurate today and commits to no specific period.
 *
 * It is not the final answer: a definite retention period is a decision for the client, and the
 * policy has still never had legal review. The text is editable from the Studio now
 * (Páginas → Política de Privacidad → Cuerpo de texto), so replacing it needs no deploy.
 *
 * Only rewrites the one apartado, and only while it still holds the placeholder.
 *
 *   npx sanity exec scripts/fix-privacy-retention.mjs --with-user-token -- --dry-run
 *   npx sanity exec scripts/fix-privacy-retention.mjs --with-user-token
 */
import { getCliClient } from 'sanity/cli';
import { DEFAULT_PAGES } from '../src/lib/content.ts';

const client = getCliClient({ apiVersion: '2024-01-01' });
const dryRun = process.argv.includes('--dry-run');

const HEADING = 'Cuánto tiempo la conservamos';
const PLACEHOLDER = '[por definir]';

async function main() {
  const doc = await client.getDocument('page-privacidad');
  if (!doc) throw new Error('No existe el documento page-privacidad');

  const seedBody = DEFAULT_PAGES.privacidad.contentSections?.find((s) => s.heading === HEADING)?.body;
  if (!seedBody) throw new Error(`El seed no tiene el apartado "${HEADING}"`);
  if (seedBody.includes(PLACEHOLDER)) throw new Error('El seed todavía contiene el marcador');

  const index = (doc.contentSections ?? []).findIndex((s) => s.heading === HEADING);
  if (index === -1) throw new Error(`El documento no tiene el apartado "${HEADING}"`);

  const current = doc.contentSections[index].body ?? '';
  if (!current.includes(PLACEHOLDER)) {
    console.log('El apartado ya no tiene el marcador; nada que hacer.');
    return;
  }

  console.log(`antes:  ${current}`);
  console.log(`después: ${seedBody}`);
  if (dryRun) return;

  await client
    .patch('page-privacidad')
    .set({ [`contentSections[${index}].body`]: seedBody })
    .commit();
  console.log('Apartado actualizado.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
