// Applies the client's 2026-09-09 correction round to Sanity.
//
// Run it with the Sanity CLI so it uses your logged-in credentials — no token in code:
//   npx sanity login                                            # once, opens a browser
//   npx sanity exec scripts/apply-copy-corrections.mjs --with-user-token
//
// Why this exists: the pages read from Sanity and fall back to the DEFAULT_* seed in
// src/lib/content.ts only when a document type is empty. heroSection, aboutSection,
// siteSettings, service and certification are all populated, so editing the seed alone
// changes nothing on the live site. This brings the dataset in line with the corrected seed.
//
// The source of the corrections is docs/internal/observaciones-2026-09.md. The headline
// one: Latam Med Gas does not certify — CONECOTEC and NITC do. Every "certification"
// claim about LMG itself has to become capacitación (training) plus handling the paperwork.
//
// Safe to re-run: every write is a patch or a createOrReplace with a deterministic id.
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2024-01-01' });

const TAGLINE =
  'Diseño, instalación, inspección, mantenimiento, asesoría y verificación de sistemas de gases medicinales';

// Existing document ids, read from the dataset on 2026-09-09.
const SERVICE = {
  inspeccion: '74d5998f-ac3a-4bb9-96f7-5a16cc058880',
  mantenimiento: '72dc2c8e-11f2-45ae-8d99-561454ad58d6',
  diseno: '24c72e54-fa7f-419b-acfe-d21c7785388f',
  asesoria: '1720bef6-a9aa-464b-b91c-0b642a46fbf9',
  verificacion: '06585674-4f42-4286-8b5f-d15cd3d20f35',
  cursos: '24c931a1-9e6d-49c8-9597-6f24bded26d3',
  capacitacion: '605a9479-1432-4e9a-877d-94485d1ff631', // was "Certificación Profesional"
  equipos: '813ebaa4-5923-485d-b083-1527b01a3e45',
  instalacion: 'service-instalacion', // new — §C, the service that was missing
};

const CERT = {
  nfpa99: '4bb301e5-6115-45c1-a379-fd62701a265a',
  asse6000: '06e6c346-c27a-446a-b614-0c6d06c36b8b',
  asse6010: 'bf5be7c4-869b-451f-a0e6-63aded233552',
  asse6030: '9be1ba0f-fff0-421c-8cc3-eb7a7ac99695',
  iso: 'certification-iso', // new — §B5
  asme: 'certification-asme', // new — §B5
};

// Project lifecycle order, matching DEFAULT_SERVICES in src/lib/content.ts.
const SERVICE_ORDER = [
  'inspeccion',
  'mantenimiento',
  'diseno',
  'instalacion',
  'asesoria',
  'verificacion',
  'cursos',
  'capacitacion',
  'equipos',
];
const CERT_ORDER = ['nfpa99', 'asse6000', 'asse6010', 'asse6030', 'iso', 'asme'];

// The three singletons carry generated uuids, not their type name, so resolve them first
// rather than hardcoding ids that would silently rot if a document were ever recreated.
async function singletonId(type) {
  const id = await client.fetch(`*[_type == $type][0]._id`, { type });
  if (!id) throw new Error(`No ${type} document found in the dataset`);
  return id;
}

async function run() {
  const [settingsId, heroId, aboutId] = await Promise.all([
    singletonId('siteSettings'),
    singletonId('heroSection'),
    singletonId('aboutSection'),
  ]);

  const tx = client.transaction();

  // §C — instalación joins the service list everywhere it is enumerated.
  tx.patch(client.patch(settingsId).set({ tagline: TAGLINE }));

  // §A — the hero cannot say "certificados"; LMG verifies, it does not certify.
  tx.patch(
    client.patch(heroId).set({
      heading: 'Sistemas de gases medicinales seguros, verificados y conformes a la norma',
      subheading:
        'Diseño, instalación, inspección, mantenimiento, asesoría y verificación de sistemas de gases medicinales para hospitales y centros de salud en Latinoamérica.',
    }),
  );

  // §B1 — "gases medicinales" alone reads as supply; it has to say "sistemas de".
  // §A — the closing clause attributed a certification programme to LMG.
  tx.patch(
    client.patch(aboutId).set({
      heading: 'Especialistas en sistemas de gases medicinales para instituciones de salud',
      body: 'Latam Med Gas USA LLC es una empresa con sede en Miami, Florida, dedicada a la inspección, mantenimiento, diseño, asesoría y verificación de sistemas de gases medicinales. Acompañamos a hospitales y centros de salud en Latinoamérica en cada etapa de sus proyectos, bajo los estándares de la norma ASSE serie 6000 y el código NFPA 99, con un programa de capacitación profesional en convenio con CONECOTEC y NITC, entes acreditados para certificar.',
      highlights: [
        'Cobertura en instituciones de salud públicas y privadas en Latinoamérica',
        'Capacitación bajo la norma ASSE serie 6000, con certificación a través de entes acreditados',
        'Venta de equipos de prueba para instalación ASSE 6010 y verificación ASSE 6030',
      ],
    }),
  );

  // §A — the card that clashed hardest with "Latam Med Gas no Certifica".
  tx.patch(
    client.patch(SERVICE.capacitacion).set({
      title: 'Capacitación Profesional',
      description:
        'Formación en convenio con CONECOTEC y NITC, entes acreditados para certificar, y gestión del trámite de certificación ante ellos.',
      icon: 'award',
    }),
  );

  // Stray leading space in the title, visible in the card heading.
  tx.patch(client.patch(SERVICE.cursos).set({ title: 'Cursos de Capacitación ASSE 6000' }));

  // §C — the missing service. Copy is provisional until the client sends their own.
  tx.createOrReplace({
    _id: SERVICE.instalacion,
    _type: 'service',
    title: 'Instalación',
    description:
      'Instalación de redes y centrales de gases medicinales bajo los perfiles de la norma ASSE 6010 y el código NFPA 99.',
    icon: 'hard-hat',
  });

  // §B5 — ISO and ASME as referential standards alongside ASSE 6000.
  tx.createOrReplace({
    _id: CERT.iso,
    _type: 'certification',
    name: 'ISO',
    description:
      'Publicaciones de la Organización Internacional para la Normalización, usadas como referencia técnica.',
  });
  tx.createOrReplace({
    _id: CERT.asme,
    _type: 'certification',
    name: 'ASME',
    description: 'Publicaciones de la American Society of Mechanical Engineers, usadas como referencia técnica.',
  });

  // Every document had order: null, so the site was rendering them in arbitrary order.
  SERVICE_ORDER.forEach((key, i) => tx.patch(client.patch(SERVICE[key]).set({ order: i + 1 })));
  CERT_ORDER.forEach((key, i) => tx.patch(client.patch(CERT[key]).set({ order: i + 1 })));

  await tx.commit();
  console.log(`Done: ${SERVICE_ORDER.length} services and ${CERT_ORDER.length} certifications in order.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
