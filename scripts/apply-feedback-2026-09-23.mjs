/**
 * Correcciones de la ronda del 23 de septiembre.
 *
 *   1. La tarjeta del convenio sonaba forzada. Sale la coletilla «los entes certificadores ante
 *      los que gestionamos el trámite» y queda una frase que dice lo mismo de corrido.
 *   2. «Todo lo que su institución necesita en gases medicinales» pasa a nombrar el servicio
 *      completo: **Sistemas de Gases Medicinales**. Es la misma regla que el cliente ya había
 *      pedido en agosto y que se había quedado sin aplicar en el titular de Servicios, que
 *      aparece dos veces: como encabezado de la sección en la portada y como título de la
 *      página.
 *
 *   npx sanity exec scripts/apply-feedback-2026-09-23.mjs --with-user-token -- --dry-run
 *   npx sanity exec scripts/apply-feedback-2026-09-23.mjs --with-user-token
 */
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2024-01-01' });
const dryRun = process.argv.includes('--dry-run');

const SERVICIO_CONVENIO = '605a9479-1432-4e9a-877d-94485d1ff631';

const TITULO_VIEJO = 'Todo lo que su institución necesita en gases medicinales';
const TITULO_NUEVO = 'Todo lo que su institución necesita en Sistemas de Gases Medicinales';

const DESC_VIEJA =
  'Convenio con CONECOTEC, acreditado por ema, y con NITC: los entes certificadores ante los que gestionamos el trámite.';
const DESC_NUEVA =
  'Convenio con CONECOTEC, acreditado por ema, y con NITC para la certificación del personal que capacitamos.';

// Lee una ruta aunque lleve índice de arreglo, para comprobar el valor antes de escribir: un
// patch sobre una ruta equivocada no falla, simplemente no hace nada.
const leer = (doc, ruta) =>
  ruta.split('.').reduce((acc, parte) => {
    const m = parte.match(/^(\w+)\[(\d+)\]$/);
    if (!acc) return undefined;
    return m ? acc[m[1]]?.[Number(m[2])] : acc[parte];
  }, doc);

async function main() {
  const inicio = await client.getDocument('page-inicio');
  const servicios = await client.getDocument('page-servicios');
  const convenio = await client.getDocument(SERVICIO_CONVENIO);
  if (!inicio || !servicios || !convenio) throw new Error('Falta alguno de los documentos esperados');

  const iServicios = (inicio.sections ?? []).findIndex((s) => s.key === 'servicios');
  if (iServicios === -1) throw new Error('page-inicio no tiene la sección "servicios"');

  const cambios = [
    { id: 'page-inicio', campo: `sections[${iServicios}].heading`, doc: inicio, de: TITULO_VIEJO, a: TITULO_NUEVO },
    { id: 'page-servicios', campo: 'heroTitle', doc: servicios, de: TITULO_VIEJO, a: TITULO_NUEVO },
    { id: SERVICIO_CONVENIO, campo: 'description', doc: convenio, de: DESC_VIEJA, a: DESC_NUEVA },
  ];

  let tx = client.transaction();
  let pendientes = 0;

  for (const { id, campo, doc, de, a } of cambios) {
    const actual = leer(doc, campo);
    if (actual === a) {
      console.log(`${id} · ${campo}: ya estaba corregido`);
      continue;
    }
    if (actual !== de) throw new Error(`${id} · ${campo}: valor inesperado.\n  actual: ${actual}`);
    console.log(`${id} · ${campo}`);
    console.log(`  antes: ${de}`);
    console.log(`  ahora: ${a}`);
    tx = tx.patch(id, (p) => p.set({ [campo]: a }));
    pendientes += 1;
  }

  if (dryRun || pendientes === 0) {
    console.log(dryRun ? '\ndry-run: nada escrito.' : '\nNada que hacer.');
    return;
  }
  await tx.commit();
  console.log(`\n${pendientes} campo(s) corregido(s).`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
