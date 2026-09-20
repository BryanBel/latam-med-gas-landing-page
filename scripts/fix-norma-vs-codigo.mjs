/**
 * Unifica cómo se nombran los dos documentos que rigen el trabajo, y corrige que estaban
 * intercambiados.
 *
 * ASSE publica «ASSE/IAPMO/ANSI Series 6000, Professional Qualifications Standard». Es una
 * **norma**. NFPA 99 es el «Health Care Facilities **Code**»: un **código**. El sitio decía
 * "el código ASSE 6000" y "la norma NFPA 99", exactamente al revés, en la página de Cursos.
 *
 * Forma larga a partir de aquí: «la norma ASSE serie 6000 y el código NFPA 99».
 * Forma corta: «ASSE 6000».
 *
 * Nota sobre "normativa": quien revisa el sitio escribió «normativa ASSE 6000». En español
 * *normativa* es un conjunto de reglas, y ASSE 6000 es una norma concreta, así que se usa
 * *norma* — que además es la traducción exacta de *Standard* y mantiene el paralelo con *código*
 * para NFPA 99. Su regla de fondo, que la sigla nunca aparezca sin su serie, se respeta.
 *
 *   npx sanity exec scripts/fix-norma-vs-codigo.mjs --with-user-token -- --dry-run
 *   npx sanity exec scripts/fix-norma-vs-codigo.mjs --with-user-token
 */
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2024-01-01' });
const dryRun = process.argv.includes('--dry-run');

const CAMBIOS = [
  {
    id: 'page-cursos',
    campo: 'heroSubtitle',
    de: 'Formación para todos los perfiles del código ASSE 6000, orientada a aplicar con propiedad lo establecido en la norma NFPA 99.',
    a: 'Formación para todos los perfiles de la norma ASSE serie 6000, orientada a aplicar con propiedad lo establecido en el código NFPA 99.',
  },
  {
    id: 'page-cursos',
    campo: 'sections[0].heading',
    de: 'Los cursos se dictan conforme al código ASSE serie 6000. Escríbanos para conocer fechas, modalidades y el temario detallado de cada perfil.',
    a: 'Los cursos se dictan conforme a la norma ASSE serie 6000. Escríbanos para conocer fechas, modalidades y el temario detallado de cada perfil.',
  },
  {
    id: 'page-inicio',
    campo: 'sections[0].subheading',
    de: 'Desde el diseño hasta la verificación final, cubrimos cada etapa bajo la normativa ASSE 6000 y el código NFPA 99.',
    a: 'Desde el diseño hasta la verificación final, cubrimos cada etapa bajo la norma ASSE serie 6000 y el código NFPA 99.',
  },
];

// Lee un campo aunque la ruta lleve un índice de arreglo, para poder comprobar el valor actual
// antes de escribir: un patch sobre una ruta equivocada no falla, simplemente no hace nada.
const leer = (doc, ruta) =>
  ruta.split('.').reduce((acc, parte) => {
    const m = parte.match(/^(\w+)\[(\d+)\]$/);
    if (!acc) return undefined;
    return m ? acc[m[1]]?.[Number(m[2])] : acc[parte];
  }, doc);

async function main() {
  let tx = client.transaction();
  let pendientes = 0;

  for (const { id, campo, de, a } of CAMBIOS) {
    const doc = await client.getDocument(id);
    if (!doc) throw new Error(`No existe ${id}`);
    const actual = leer(doc, campo);
    if (actual === a) {
      console.log(`${id} · ${campo}: ya estaba corregido`);
      continue;
    }
    if (actual !== de) {
      throw new Error(`${id} · ${campo}: el valor actual no es el esperado.\n  actual: ${actual}`);
    }
    console.log(`${id} · ${campo}`);
    console.log(`  antes:  ${de}`);
    console.log(`  ahora:  ${a}`);
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
