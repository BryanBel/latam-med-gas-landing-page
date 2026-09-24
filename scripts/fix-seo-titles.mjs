/**
 * Titles que no caben o que no dicen nada.
 *
 * El sufijo « | Latam Med Gas USA LLC» son 24 caracteres en todas las páginas, así que el
 * título propio tiene unos 40 antes de que Google corte (~60-65).
 *
 *   · Cursos iba en 68. El sufijo con el nombre de la empresa se perdía entero.
 *   · Nosotros iba en 32, y no por conciso: decía literalmente «Nosotros». Es la página que
 *     explica que son especialistas en sistemas de gases medicinales, y el título no lo
 *     mencionaba. Un título corto no es lo mismo que un título desaprovechado.
 *   · La portada separaba con guion suelto mientras las otras seis usan barra vertical. En una
 *     página de resultados aparecen una debajo de otra y se nota.
 *
 * Servicios se queda en 66 a propósito: recortarlo obliga a soltar «sistemas de gases
 * medicinales», que es la frase exacta que usa el sector y que el cliente pidió mantener.
 *
 *   npx sanity exec scripts/fix-seo-titles.mjs --with-user-token -- --dry-run
 *   npx sanity exec scripts/fix-seo-titles.mjs --with-user-token
 */
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2024-01-01' });
const dryRun = process.argv.includes('--dry-run');

const SUFIJO = ' | Latam Med Gas USA LLC';

const CAMBIOS = [
  {
    id: 'page-cursos',
    campo: 'seoTitle',
    de: 'Cursos de Capacitación ASSE 6000 (6005–6060)',
    a: 'Capacitación ASSE 6000 (6005–6060)',
  },
  {
    id: 'page-nosotros',
    campo: 'seoTitle',
    de: 'Nosotros',
    a: 'Especialistas en gases medicinales',
  },
  {
    // La portada lleva `titleTemplate={false}`, así que este texto es el título completo.
    id: 'page-inicio',
    campo: 'seoTitle',
    de: 'Latam Med Gas USA LLC - Gases Medicinales ASSE 6000 / NFPA 99',
    a: 'Latam Med Gas USA LLC | Gases Medicinales ASSE 6000 y NFPA 99',
    completo: true,
  },
];

async function main() {
  let tx = client.transaction();
  let pendientes = 0;

  for (const { id, campo, de, a, completo } of CAMBIOS) {
    const doc = await client.getDocument(id);
    if (!doc) throw new Error(`No existe ${id}`);
    const actual = doc[campo];
    if (actual === a) {
      console.log(`  ${id} · ${campo}: ya estaba corregido`);
      continue;
    }
    if (actual !== de) throw new Error(`${id} · ${campo}: valor inesperado.\n  encontró: ${actual}`);

    const largo = (s) => (completo ? s.length : s.length + SUFIJO.length);
    console.log(`\n${id} · ${campo}`);
    console.log(`  antes (${largo(de)}): ${de}`);
    console.log(`  ahora (${largo(a)}): ${a}`);
    if (largo(a) > 65) console.warn(`  AVISO: sigue por encima de 65`);
    tx = tx.patch(id, (p) => p.set({ [campo]: a }));
    pendientes += 1;
  }

  if (dryRun || pendientes === 0) {
    console.log(dryRun ? '\ndry-run: nada escrito.' : '\nNada que hacer.');
    return;
  }
  await tx.commit();
  console.log(`\n${pendientes} título(s) corregido(s).`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
