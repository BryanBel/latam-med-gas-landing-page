/**
 * Correcciones de la auditoría del 23 de septiembre.
 *
 * Terminología (verificada contra ASSE y contra CONECOTEC, que es el ente que certifica):
 *   · ASSE 6020 decía «prevención de reflujo» — eso es *backflow prevention*, la serie ASSE
 *     5000, otra cosa. El alcance real de 6020 es inspeccionar la instalación de sistemas de
 *     gases medicinales y vacío dentro de NFPA 99.
 *   · ASSE 6005 no habilita para instalar; «rol de apoyo y supervisión» insinuaba lo contrario.
 *   · ASSE 6040 se llama «Personal de mantenimiento», no «Mantenimiento».
 *   · 6010 y 6030 son perfiles dentro de la norma serie 6000, no normas propias. Se corrige el
 *     sustantivo. Si se quedan o no en las descripciones de servicios es otra pregunta, y está
 *     en las dudas del cliente.
 *   · Una sola forma: «gases medicinales». Había además «gas medicinal», «gases médicos» y
 *     «gas médico». CONECOTEC escribe «Sistemas de Gases Medicinales» en todos sus perfiles.
 *
 * Tono y datos:
 *   · El cierre de cinco páginas pasa de «normalizar» (ambiguo: estandarizar vs. volver a la
 *     normalidad, que insinúa avería) a «poner en conformidad».
 *   · Caja de oración en los títulos de servicio: había Title Case anglosajón mezclado.
 *   · «5+ años en el mercado» contra «desde 2020», a dos centímetros de distancia. Son 6.
 *   · La lista de Trayectoria se titulaba «Proyectos de inspección y verificación» y terminaba
 *     en una capacitación.
 *   · La meta de Trayectoria enumeraba cinco países y la cifra de al lado decía seis: faltaba
 *     Colombia, que sí tiene proyecto en la lista.
 *   · La frase del convenio no era la aprobada y omitía a ema.
 *
 * Además borra `drafts.page-servicios`, un borrador huérfano que conserva el título anterior a
 * la corrección del 23 («…necesita en gases medicinales»). Nadie lo está editando y basta con
 * que alguien pulse Publicar para revertir el cambio sin enterarse.
 *
 *   npx sanity exec scripts/apply-audit-2026-09-23.mjs --with-user-token -- --dry-run
 *   npx sanity exec scripts/apply-audit-2026-09-23.mjs --with-user-token
 */
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2024-01-01' });
const dryRun = process.argv.includes('--dry-run');

const SITE_SETTINGS = '84a7797e-120d-4eee-bbcd-5b1817beaf2d';
const BORRADOR_HUERFANO = 'drafts.page-servicios';

// { id, campo, de, a } — `de` es el valor que debe haber ahora. Un patch sobre una ruta
// equivocada no falla, simplemente no escribe nada, así que se comprueba antes de tocar.
const CAMBIOS = [
  // ── Cierre de página ──────────────────────────────────────────────────────────────────
  {
    id: SITE_SETTINGS,
    campo: 'ctaTitle',
    de: '¿Listo para normalizar su sistema de gases medicinales?',
    a: '¿Listo para poner su sistema de gases medicinales en conformidad?',
  },

  // ── Cursos: alcance real de cada perfil ───────────────────────────────────────────────
  {
    id: 'course-6005',
    campo: 'description',
    de: 'Comprensión integral de los sistemas y normativas de gases medicinales; rol de apoyo y supervisión.',
    a: 'Comprensión integral de los sistemas de gases medicinales y de las normas que los rigen; no habilita para instalar.',
  },
  {
    id: 'course-6020',
    campo: 'description',
    de: 'Inspección de sistemas de gases medicinales y prevención de reflujo en instalaciones médicas.',
    a: 'Inspección de la instalación de sistemas de gases medicinales y vacío en instituciones de salud.',
  },
  {
    id: 'course-6030',
    campo: 'description',
    de: 'Inspección y pruebas de sistemas de gas medicinal, con informe final de verificación.',
    a: 'Inspección y pruebas de sistemas de gases medicinales, con informe final de verificación.',
  },
  { id: 'course-6040', campo: 'title', de: 'Mantenimiento', a: 'Personal de mantenimiento' },
  {
    id: 'course-6040',
    campo: 'description',
    de: 'Mantenimiento preventivo y correctivo de sistemas de gases médicos.',
    a: 'Mantenimiento preventivo y correctivo de sistemas de gases medicinales.',
  },
  {
    id: 'course-6060',
    campo: 'description',
    de: 'Diseño de sistemas de suministro de gas médico conforme al código NFPA 99.',
    a: 'Diseño de sistemas de suministro de gases medicinales conforme al código NFPA 99.',
  },

  // ── Servicios: sigla inventada, caja de oración, perfil ≠ norma ───────────────────────
  {
    id: '74d5998f-ac3a-4bb9-96f7-5a16cc058880',
    campo: 'title',
    de: 'Inspección de Sistemas GM',
    a: 'Inspección de sistemas de gases medicinales',
  },
  {
    id: '74d5998f-ac3a-4bb9-96f7-5a16cc058880',
    campo: 'description',
    de: 'Revisión técnica de redes y centrales de gases medicinales conforme a la normativa vigente.',
    a: 'Revisión técnica de redes y centrales de gases medicinales conforme a la norma ASSE serie 6000 y el código NFPA 99.',
  },
  {
    id: 'service-instalacion',
    campo: 'description',
    de: 'Instalación de redes y centrales de gases medicinales bajo los perfiles de la norma ASSE 6010 y el código NFPA 99.',
    a: 'Instalación de redes y centrales de gases medicinales bajo el perfil ASSE 6010 de la norma serie 6000 y el código NFPA 99.',
  },
  {
    id: '06585674-4f42-4286-8b5f-d15cd3d20f35',
    campo: 'description',
    de: 'Verificación de sistemas de tubería de gases medicinales bajo la norma ASSE 6030, con informe final y anexos.',
    a: 'Verificación de sistemas de tubería de gases medicinales bajo el perfil ASSE 6030 de la norma serie 6000, con informe final y anexos.',
  },
  {
    id: '24c931a1-9e6d-49c8-9597-6f24bded26d3',
    campo: 'title',
    de: 'Cursos de Capacitación ASSE 6000',
    a: 'Cursos de capacitación ASSE 6000',
  },
  {
    id: '813ebaa4-5923-485d-b083-1527b01a3e45',
    campo: 'title',
    de: 'Venta de Equipos de Prueba',
    a: 'Venta de equipos de prueba',
  },

  // ── Trayectoria ───────────────────────────────────────────────────────────────────────
  {
    id: 'page-trayectoria',
    campo: 'sections[0].heading',
    de: 'Proyectos de inspección y verificación',
    a: 'Proyectos y capacitaciones',
  },
  {
    id: 'page-trayectoria',
    campo: 'metaDescription',
    de: 'Proyectos de inspección y verificación de sistemas de gases medicinales en México, Honduras, Panamá, Venezuela y Bolivia desde 2020.',
    a: 'Proyectos de inspección y verificación de sistemas de gases medicinales en México, Colombia, Honduras, Panamá, Venezuela y Bolivia desde 2020.',
  },
  { id: 'imported-troncoso', campo: 'location', de: 'México', a: 'Ciudad de México' },
  { id: 'imported-isla-mujeres-2023', campo: 'location', de: 'Quintana Roo', a: 'Isla Mujeres, Quintana Roo' },

  // ── Nosotros: la frase aprobada del convenio, con ema nombrado ────────────────────────
  {
    id: 'aboutSection',
    campo: 'body',
    de: 'Latam Med Gas USA LLC es una empresa con sede en Miami, Florida, dedicada al diseño, instalación, inspección, mantenimiento, asesoría y verificación de sistemas de gases medicinales. Acompañamos a hospitales y centros de salud en Latinoamérica en cada etapa de sus proyectos, bajo los estándares de la norma ASSE serie 6000 y el código NFPA 99, con un programa de capacitación profesional en convenio con CONECOTEC y NITC, entes acreditados para certificar.',
    a: 'Latam Med Gas USA LLC es una empresa con sede en Miami, Florida, dedicada al diseño, instalación, inspección, mantenimiento, asesoría y verificación de sistemas de gases medicinales. Acompañamos a hospitales y centros de salud en Latinoamérica en cada etapa de sus proyectos, bajo los estándares de la norma ASSE serie 6000 y el código NFPA 99. Nosotros impartimos la capacitación profesional; la certificación la emiten CONECOTEC, acreditado por ema, y NITC.',
  },
  {
    id: 'aboutSection',
    campo: 'highlights[1]',
    de: 'Capacitación bajo la norma ASSE serie 6000, con certificación a través de entes acreditados',
    a: 'Capacitación bajo la norma ASSE serie 6000; la certificación la emiten CONECOTEC, acreditado por ema, y NITC',
  },
];

// Años en el mercado: el sitio dice «desde 2020» dos secciones más arriba.
const STAT_ANIOS = { key: 'a-os-en-el-mercado', de: 5, a: 6 };

const leer = (doc, ruta) =>
  ruta.split('.').reduce((acc, parte) => {
    const m = parte.match(/^(\w+)\[(\d+)\]$/);
    if (!acc) return undefined;
    return m ? acc[m[1]]?.[Number(m[2])] : acc[parte];
  }, doc);

async function main() {
  // aboutSection es singleton sin id fijo; se resuelve, nunca se adivina.
  const about = await client.fetch('*[_type == "aboutSection"][0]{_id}');
  if (!about?._id) throw new Error('No se encontró el documento aboutSection');

  const cache = new Map();
  const getDoc = async (id) => {
    if (!cache.has(id)) cache.set(id, await client.getDocument(id));
    return cache.get(id);
  };

  let tx = client.transaction();
  let pendientes = 0;

  for (const { id: rawId, campo, de, a } of CAMBIOS) {
    const id = rawId === 'aboutSection' ? about._id : rawId;
    const doc = await getDoc(id);
    if (!doc) throw new Error(`No existe el documento ${id}`);
    const actual = leer(doc, campo);
    if (actual === a) {
      console.log(`  ${id} · ${campo}: ya estaba corregido`);
      continue;
    }
    if (actual !== de) {
      throw new Error(`${id} · ${campo}: valor inesperado.\n  esperaba: ${de}\n  encontró: ${actual}`);
    }
    console.log(`\n${id} · ${campo}`);
    console.log(`  antes: ${de}`);
    console.log(`  ahora: ${a}`);
    tx = tx.patch(id, (p) => p.set({ [campo]: a }));
    pendientes += 1;
  }

  // El stat vive dentro de un arreglo con _key; se localiza por índice real, no por posición
  // asumida, porque el editor puede reordenarlos desde el Studio.
  const settings = await getDoc(SITE_SETTINGS);
  const iStat = (settings.stats ?? []).findIndex((s) => s._key === STAT_ANIOS.key);
  if (iStat === -1) throw new Error(`siteSettings no tiene el stat "${STAT_ANIOS.key}"`);
  const valorStat = settings.stats[iStat].value;
  if (valorStat === STAT_ANIOS.a) {
    console.log(`  ${SITE_SETTINGS} · stats[${iStat}].value: ya estaba corregido`);
  } else if (valorStat !== STAT_ANIOS.de) {
    throw new Error(`siteSettings · stats[${iStat}].value: esperaba ${STAT_ANIOS.de}, encontró ${valorStat}`);
  } else {
    console.log(`\n${SITE_SETTINGS} · stats[${iStat}].value  (${settings.stats[iStat].label})`);
    console.log(`  antes: ${STAT_ANIOS.de}`);
    console.log(`  ahora: ${STAT_ANIOS.a}`);
    tx = tx.patch(SITE_SETTINGS, (p) => p.set({ [`stats[${iStat}].value`]: STAT_ANIOS.a }));
    pendientes += 1;
  }

  const huerfano = await client.getDocument(BORRADOR_HUERFANO);
  if (huerfano) {
    console.log(`\n${BORRADOR_HUERFANO}: borrador huérfano, se elimina`);
    console.log(`  heroTitle que conserva: ${huerfano.heroTitle}`);
    tx = tx.delete(BORRADOR_HUERFANO);
    pendientes += 1;
  } else {
    console.log(`  ${BORRADOR_HUERFANO}: no existe`);
  }

  if (dryRun || pendientes === 0) {
    console.log(dryRun ? '\ndry-run: nada escrito.' : '\nNada que hacer.');
    return;
  }
  await tx.commit();
  console.log(`\n${pendientes} cambio(s) aplicado(s).`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
