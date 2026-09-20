/**
 * Sanity beats the seed, so the corrections in src/lib/content.ts do not reach the live site on
 * their own. This mirrors them into the dataset:
 *
 *   - the Cursos service card claimed the courses are "dictada por instructores certificados
 *     ASSE 6050" — an unverified credential claim about the company's own staff;
 *   - the About body still listed the services from before Instalación was added;
 *   - the Asesoría description carried a leading space.
 *
 * Run once:  npx sanity exec scripts/fix-certification-copy.mjs --with-user-token
 */
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2024-01-01' });

const SERVICE_CURSOS = '24c931a1-9e6d-49c8-9597-6f24bded26d3';
const SERVICE_ASESORIA = '1720bef6-a9aa-464b-b91c-0b642a46fbf9';

const ABOUT_BODY =
  'Latam Med Gas USA LLC es una empresa con sede en Miami, Florida, dedicada al diseño, ' +
  'instalación, inspección, mantenimiento, asesoría y verificación de sistemas de gases ' +
  'medicinales. Acompañamos a hospitales y centros de salud en Latinoamérica en cada etapa de ' +
  'sus proyectos, bajo los estándares de la norma ASSE serie 6000 y el código NFPA 99, con un ' +
  'programa de capacitación profesional en convenio con CONECOTEC y NITC, entes acreditados ' +
  'para certificar.';

async function main() {
  const about = await client.fetch('*[_type == "aboutSection"][0]._id');
  if (!about) throw new Error('No aboutSection document found');

  const asesoria = await client.getDocument(SERVICE_ASESORIA);
  const cursos = await client.getDocument(SERVICE_CURSOS);
  if (!asesoria || !cursos) throw new Error('Expected service documents are missing');

  await client
    .transaction()
    .patch(about, (p) => p.set({ body: ABOUT_BODY }))
    .patch(SERVICE_CURSOS, (p) =>
      p.set({
        description:
          'Formación profesional para todos los perfiles de la norma ASSE serie 6000 y el ' + 'código NFPA 99.',
      }),
    )
    .patch(SERVICE_ASESORIA, (p) => p.set({ description: asesoria.description.trim() }))
    .commit();

  console.log('Patched aboutSection + 2 services.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
