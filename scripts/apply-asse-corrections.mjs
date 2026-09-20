/**
 * Correcciones pedidas por quien evalúa el sitio del lado del cliente (2026-09-20):
 *
 *   1. La sigla ASSE nunca va sola. Siempre acompañada de su serie: "ASSE 6000".
 *   2. La tarjeta de Verificación pierde "ASSE 6030" del título.
 *   3. "Capacitación Profesional" pasa a "Convenio con entes certificadores", que es lo que
 *      describe: LMG capacita, y CONECOTEC —acreditado por ema— y NITC son los que certifican.
 *   4. En Normativas y estándares queda solo ASSE 6000. ASSE 6010 y 6030 se retiran: son
 *      perfiles dentro de la serie, no normativas aparte, y listarlos al mismo nivel sugería
 *      que LMG opera bajo tres estándares distintos.
 *
 * Los documentos retirados quedan en el respaldo (repositorio privado de respaldos, commit
 * anterior a esta ejecución) por si hubiera que reponerlos.
 *
 *   npx sanity exec scripts/apply-asse-corrections.mjs --with-user-token -- --dry-run
 *   npx sanity exec scripts/apply-asse-corrections.mjs --with-user-token
 */
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2024-01-01' });
const dryRun = process.argv.includes('--dry-run');

const SERVICIO_VERIFICACION = '06585674-4f42-4286-8b5f-d15cd3d20f35';
const SERVICIO_CONVENIO = '605a9479-1432-4e9a-877d-94485d1ff631';
const CERTS_A_RETIRAR = [
  ['bf5be7c4-869b-451f-a0e6-63aded233552', 'ASSE 6010'],
  ['9be1ba0f-fff0-421c-8cc3-eb7a7ac99695', 'ASSE 6030'],
];

const SUBTITULO_SERVICIOS =
  'Desde el diseño hasta la verificación final, cubrimos cada etapa bajo la normativa ASSE 6000 ' +
  'y el código NFPA 99.';
const DESC_CONVENIO =
  'Convenio con CONECOTEC, acreditado por ema, y con NITC: los entes certificadores ante los ' +
  'que gestionamos el trámite.';

async function main() {
  const verificacion = await client.getDocument(SERVICIO_VERIFICACION);
  const convenio = await client.getDocument(SERVICIO_CONVENIO);
  if (!verificacion || !convenio) throw new Error('Falta alguno de los servicios esperados');

  const inicio = await client.getDocument('page-inicio');
  if (!inicio) throw new Error('Falta el documento page-inicio');
  const seccionServicios = (inicio.sections ?? []).findIndex((s) => s.key === 'servicios');
  if (seccionServicios === -1) throw new Error('page-inicio no tiene la sección "servicios"');

  console.log(`servicio ${SERVICIO_VERIFICACION}`);
  console.log(`  título:  ${verificacion.title}  ->  Verificación`);
  console.log(`servicio ${SERVICIO_CONVENIO}`);
  console.log(`  título:  ${convenio.title}  ->  Convenio con entes certificadores`);
  console.log(`  texto:   ${DESC_CONVENIO}`);
  console.log('page-inicio → sección servicios');
  console.log(`  subtítulo: ${SUBTITULO_SERVICIOS}`);
  console.log('certificaciones a retirar:');
  for (const [id, nombre] of CERTS_A_RETIRAR) {
    const doc = await client.getDocument(id);
    console.log(`  ${nombre.padEnd(10)} ${id}  ${doc ? 'existe' : 'YA NO EXISTE'}`);
  }

  if (dryRun) return;

  let tx = client
    .transaction()
    .patch(SERVICIO_VERIFICACION, (p) => p.set({ title: 'Verificación' }))
    .patch(SERVICIO_CONVENIO, (p) => p.set({ title: 'Convenio con entes certificadores', description: DESC_CONVENIO }))
    .patch('page-inicio', (p) => p.set({ [`sections[${seccionServicios}].subheading`]: SUBTITULO_SERVICIOS }));
  for (const [id] of CERTS_A_RETIRAR) tx = tx.delete(id);
  await tx.commit();

  console.log('\nAplicado.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
