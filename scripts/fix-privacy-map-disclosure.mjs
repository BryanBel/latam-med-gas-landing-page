/**
 * La página de Contacto ya no enseña un marcador de posición: lleva un mapa incrustado de
 * OpenStreetMap. El apartado «Cookies y analítica» de la Política de Privacidad enumera a los
 * terceros que intervienen —Cloudflare, y en otros apartados Supabase y Resend— y ese mapa
 * habría sido el único sin nombrar.
 *
 * El embed de OSM no manda ninguna cabecera Set-Cookie, comprobado antes de incrustarlo, así
 * que la frase de que el sitio no usa cookies de seguimiento sigue siendo cierta. Lo que sí
 * ocurre, como con cualquier contenido servido por un tercero, es que al cargarlo el navegador
 * le comunica la dirección IP del visitante. Eso es lo que se añade.
 *
 * Existe este script y no basta con editar `src/lib/content.ts` porque el documento
 * `page-privacidad` de Sanity tiene sus propios `contentSections`, y un documento poblado gana
 * siempre a la semilla: el texto del seed no llega al sitio. Este script copia el apartado del
 * seed al documento, que es la única vía que cambia lo que se publica.
 *
 *   npx sanity exec scripts/fix-privacy-map-disclosure.mjs --with-user-token -- --dry-run
 *   npx sanity exec scripts/fix-privacy-map-disclosure.mjs --with-user-token
 */
import { getCliClient } from 'sanity/cli';
import { DEFAULT_PAGES } from '../src/lib/content.ts';

const client = getCliClient({ apiVersion: '2024-01-01' });
const dryRun = process.argv.includes('--dry-run');

const HEADING = 'Cookies y analítica';
const SENAL = 'OpenStreetMap';

async function main() {
  const doc = await client.getDocument('page-privacidad');
  if (!doc) throw new Error('No existe el documento page-privacidad');

  const seedBody = DEFAULT_PAGES.privacidad.contentSections?.find((s) => s.heading === HEADING)?.body;
  if (!seedBody) throw new Error(`El seed no tiene el apartado "${HEADING}"`);
  if (!seedBody.includes(SENAL)) throw new Error('El seed todavía no menciona el mapa; edítalo antes de correr esto');

  const index = (doc.contentSections ?? []).findIndex((s) => s.heading === HEADING);
  if (index === -1) throw new Error(`El documento no tiene el apartado "${HEADING}"`);

  const current = doc.contentSections[index].body ?? '';
  if (current.includes(SENAL)) {
    console.log('El apartado ya menciona el mapa; nada que hacer.');
    return;
  }

  console.log(`antes:   ${current}`);
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
