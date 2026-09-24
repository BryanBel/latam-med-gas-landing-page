/**
 * Dos secciones que no estaban a la altura del resto.
 *
 *   1. Nosotros titulaba «Normativas y estándares» mientras la portada, para la misma lista de
 *      cuatro elementos, titulaba «Respaldados por los estándares internacionales de la
 *      industria». Se unifican con la de la portada, que además es una afirmación y no una
 *      etiqueta. De paso sale «normativas», que es justo la palabra que se descartó hoy por
 *      imprecisa: ASSE publica una *norma*, no una normativa.
 *
 *   2. La nota junto a la foto de Cursos metía dos ideas en el campo `heading` y se pintaba
 *      como un párrafo gris de 16px al lado de una foto a media página. Peor: decía
 *      «Escríbanos» sin que hubiera nada que pulsar. Se reparte en los tres campos que la
 *      sección ya ofrecía — título, texto de apoyo y enlace — sin tocar el esquema.
 *
 *   npx sanity exec scripts/apply-nosotros-cursos-2026-09-23.mjs --with-user-token -- --dry-run
 *   npx sanity exec scripts/apply-nosotros-cursos-2026-09-23.mjs --with-user-token
 */
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2024-01-01' });
const dryRun = process.argv.includes('--dry-run');

const NOTA_VIEJA =
  'Los cursos se dictan conforme a la norma ASSE serie 6000. Escríbanos para conocer fechas, modalidades y el temario detallado de cada perfil.';
const NOTA_TITULO = 'Los cursos se dictan conforme a la norma ASSE serie 6000';
const NOTA_TEXTO = 'Escríbanos para conocer fechas, modalidades y el temario detallado de cada perfil.';
const NOTA_CTA = 'Consultar fechas y temario';

const HEAD_VIEJO = 'Normativas y estándares';
const HEAD_NUEVO = 'Respaldados por los estándares internacionales de la industria';

/** Índice real de una sección por su `key`, porque el editor puede reordenarlas en el Studio. */
function indiceDe(doc, key) {
  const i = (doc.sections ?? []).findIndex((s) => s.key === key);
  if (i === -1) throw new Error(`${doc._id} no tiene la sección "${key}"`);
  return i;
}

async function main() {
  const nosotros = await client.getDocument('page-nosotros');
  const cursos = await client.getDocument('page-cursos');
  if (!nosotros || !cursos) throw new Error('Falta page-nosotros o page-cursos');

  let tx = client.transaction();
  let pendientes = 0;

  // 1 · Encabezado de Nosotros
  const iCert = indiceDe(nosotros, 'certificaciones');
  const headActual = nosotros.sections[iCert].heading;
  if (headActual === HEAD_NUEVO) {
    console.log('  page-nosotros · certificaciones: ya estaba corregido');
  } else if (headActual !== HEAD_VIEJO) {
    throw new Error(`page-nosotros · certificaciones: valor inesperado.\n  encontró: ${headActual}`);
  } else {
    console.log(`\npage-nosotros · sections[${iCert}].heading`);
    console.log(`  antes: ${HEAD_VIEJO}`);
    console.log(`  ahora: ${HEAD_NUEVO}`);
    tx = tx.patch('page-nosotros', (p) => p.set({ [`sections[${iCert}].heading`]: HEAD_NUEVO }));
    pendientes += 1;
  }

  // 2 · Nota de Cursos, repartida en tres campos
  const iNota = indiceDe(cursos, 'cursosNota');
  const nota = cursos.sections[iNota];
  if (nota.heading === NOTA_TITULO && nota.subheading === NOTA_TEXTO && nota.ctaLabel === NOTA_CTA) {
    console.log('  page-cursos · cursosNota: ya estaba corregido');
  } else if (nota.heading !== NOTA_VIEJA) {
    throw new Error(`page-cursos · cursosNota.heading: valor inesperado.\n  encontró: ${nota.heading}`);
  } else {
    console.log(`\npage-cursos · sections[${iNota}]`);
    console.log(`  antes  heading: ${NOTA_VIEJA}`);
    console.log(`  ahora  heading: ${NOTA_TITULO}`);
    console.log(`       subheading: ${NOTA_TEXTO}`);
    console.log(`         ctaLabel: ${NOTA_CTA}`);
    tx = tx.patch('page-cursos', (p) =>
      p.set({
        [`sections[${iNota}].heading`]: NOTA_TITULO,
        [`sections[${iNota}].subheading`]: NOTA_TEXTO,
        [`sections[${iNota}].ctaLabel`]: NOTA_CTA,
      }),
    );
    pendientes += 1;
  }

  if (dryRun || pendientes === 0) {
    console.log(dryRun ? '\ndry-run: nada escrito.' : '\nNada que hacer.');
    return;
  }
  await tx.commit();
  console.log(`\n${pendientes} sección(es) corregida(s).`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
