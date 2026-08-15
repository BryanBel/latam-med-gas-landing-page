// One-time import of the real project trajectory into Sanity.
//
// Run it with the Sanity CLI so it uses your logged-in credentials — no token in code:
//   npx sanity login                                   # once, opens a browser
//   npx sanity exec scripts/import-projects.mjs --with-user-token
//
// It removes the two legacy seed docs (superseded here) and upserts the curated list with
// deterministic ids, so re-running is safe (it replaces, never duplicates). Any projects the
// client later adds in Studio keep their own random ids and are left untouched.
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2024-01-01' });

// The two docs currently in the dataset (the original 2-project seed), replaced by the list below.
const LEGACY_IDS = ['611fe633-a072-4a6c-b091-575591f3f34e', '7b299640-651e-4021-94c5-c5c52c6ff082'];

// Newest first. `order` drives the site's sort (getProjects orders by order asc).
const PROJECTS = [
  {
    slug: 'tuxtla',
    clientName: 'Hospital General de Tuxtla Gutiérrez',
    location: 'Tuxtla Gutiérrez, Chiapas',
    country: 'México',
    date: 'Noviembre 2024',
    serviceType: 'Inspección y diagnóstico',
    description: 'Inspección y diagnóstico del sistema de gases medicinales y vacío médico-quirúrgico.',
  },
  {
    slug: 'tegucigalpa',
    clientName: 'Hospital Escuela Ciudad de Tegucigalpa',
    location: 'Tegucigalpa',
    country: 'Honduras',
    date: 'Junio 2024',
    serviceType: 'Inspección y diagnóstico',
    description: 'Inspección y diagnóstico del sistema de gases medicinales y vacío médico-quirúrgico.',
  },
  {
    slug: 'isla-mujeres-2024',
    clientName: 'Hospital Naval de Isla Mujeres',
    location: 'Isla Mujeres, Quintana Roo',
    country: 'México',
    date: 'Marzo 2024',
    serviceType: 'Verificación',
    description:
      'Verificación de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    slug: 'boca-chila',
    clientName: 'Clínica Naval de Boca de Chila',
    location: 'Nayarit',
    country: 'México',
    date: 'Marzo 2024',
    serviceType: 'Verificación',
    description:
      'Verificación de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    slug: 'troncoso',
    clientName: 'Centro de Atención de Salud Troncoso',
    location: 'México',
    country: 'México',
    date: 'Febrero 2024',
    serviceType: 'Verificación',
    description:
      'Verificación de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    slug: 'isla-mujeres-2023',
    clientName: 'Hospital Naval de Isla Mujeres',
    location: 'Quintana Roo',
    country: 'México',
    date: 'Octubre 2023',
    serviceType: 'Inspección',
    description:
      'Inspección de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    slug: 'san-cristobal',
    clientName: 'Centro Clínico San Cristóbal',
    location: 'San Cristóbal',
    country: 'Venezuela',
    date: 'Febrero 2023',
    serviceType: 'Inspección',
    description:
      'Inspección de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    slug: 'la-paz',
    clientName: 'Hospital Naval de La Paz',
    location: 'La Paz, Baja California Sur',
    country: 'México',
    date: 'Diciembre 2022',
    serviceType: 'Verificación',
    description:
      'Verificación de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    slug: 'montero',
    clientName: 'Hospital Montero',
    location: 'Santa Cruz de la Sierra',
    country: 'Bolivia',
    date: 'Octubre 2022',
    serviceType: 'Inspección',
    description:
      'Inspección de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    slug: 'coatzacoalcos',
    clientName: 'Hospital General Naval de Coatzacoalcos',
    location: 'Coatzacoalcos, Veracruz',
    country: 'México',
    date: 'Mayo 2022',
    serviceType: 'Verificación',
    description:
      'Verificación de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    slug: 'panama-covid',
    clientName: 'Hospital Covid de la Salud',
    location: 'Ciudad de Panamá',
    country: 'Panamá',
    date: 'Febrero 2021',
    serviceType: 'Verificación',
    description: 'Verificación de sistemas de gases medicinales y vacío médico.',
  },
  {
    slug: 'santa-fe',
    clientName: 'Hospital Fundación Santa Fe de Bogotá',
    location: 'Bogotá',
    country: 'Colombia',
    date: 'Febrero 2020',
    serviceType: 'Inspección',
    description:
      'Inspección de sistemas de gases medicinales, vacío médico-quirúrgico y disposición de desechos de gases anestésicos (WAGD).',
  },
  {
    slug: 'gas-solutions',
    clientName: 'Gas Solutions Services, S.A.',
    location: 'Panamá',
    country: 'Panamá',
    serviceType: 'Capacitación ASSE 6000',
    description: 'Capacitación profesional para certificación bajo la norma ASSE serie 6000, versión NFPA 99-2024.',
  },
];

async function run() {
  // Remove the legacy seed docs (published + any draft copies) — no error if absent.
  await client.delete({
    query: '*[_type == "project" && _id in $ids]',
    params: { ids: [...LEGACY_IDS, ...LEGACY_IDS.map((id) => `drafts.${id}`)] },
  });

  const tx = client.transaction();
  PROJECTS.forEach((p, i) => {
    const { slug, ...rest } = p;
    tx.createOrReplace({ _id: `imported.${slug}`, _type: 'project', order: i, ...rest });
  });
  const res = await tx.commit({ visibility: 'sync' });
  console.log('commit result:', JSON.stringify(res?.results?.map((r) => r.id) ?? res, null, 0).slice(0, 400));

  const projectId = client.config().projectId;
  const dataset = client.config().dataset;
  const now = await client.fetch('count(*[_type == "project"])');
  console.log(`After commit — projectId=${projectId} dataset=${dataset} project count=${now}`);
  console.log(`Imported ${PROJECTS.length} projects; removed ${LEGACY_IDS.length} legacy docs.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
