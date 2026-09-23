/**
 * Volcado de solo lectura de todo el texto editable, para poder corregirlo sabiendo el valor
 * exacto de cada campo en vez de adivinarlo. No escribe nada.
 *
 *   npx sanity exec scripts/dump-copy.mjs --with-user-token
 */
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2024-01-01' });

const line = (t) => console.log(`\n${'='.repeat(4)} ${t} ${'='.repeat(40 - t.length)}`);

async function main() {
  line('siteSettings');
  const s = await client.fetch('*[_type == "siteSettings"][0]');
  console.log('_id:', s?._id);
  for (const k of ['slogan', 'ctaTitle', 'ctaText', 'footerNote', 'tagline', 'metaDescription']) {
    console.log(` ${k}: ${JSON.stringify(s?.[k])}`);
  }
  console.log(' stats:', JSON.stringify(s?.stats));

  line('aboutSection');
  const a = await client.fetch('*[_type == "aboutSection"][0]');
  console.log(' heading:', JSON.stringify(a?.heading));
  console.log(' body:', JSON.stringify(a?.body));
  console.log(' highlights:', JSON.stringify(a?.highlights, null, 2));
  console.log(' mission:', JSON.stringify(a?.mission));
  console.log(' vision:', JSON.stringify(a?.vision));

  line('services');
  for (const x of await client.fetch('*[_type == "service"]|order(orderRank){_id,title,description,link}')) {
    console.log(` ${x._id}`);
    console.log(`   title: ${JSON.stringify(x.title)}`);
    console.log(`   desc : ${JSON.stringify(x.description)}`);
  }

  line('courses');
  for (const x of await client.fetch('*[_type == "course"]|order(orderRank){_id,code,title,description}')) {
    console.log(` ${x._id}  ${x.code}`);
    console.log(`   title: ${JSON.stringify(x.title)}`);
    console.log(`   desc : ${JSON.stringify(x.description)}`);
  }

  line('certifications');
  for (const x of await client.fetch('*[_type == "certification"]|order(orderRank){_id,name,description}')) {
    console.log(` ${x._id}  ${JSON.stringify(x.name)}`);
    console.log(`   desc : ${JSON.stringify(x.description)}`);
  }

  line('projects');
  for (const x of await client.fetch(
    '*[_type == "project"]|order(orderRank){_id,clientName,location,country,date,serviceType,description}',
  )) {
    console.log(` ${x._id}`);
    console.log(`   ${JSON.stringify(x.clientName)} | ${JSON.stringify(x.location)} | ${JSON.stringify(x.country)}`);
    console.log(`   ${JSON.stringify(x.date)} | ${JSON.stringify(x.serviceType)}`);
  }

  line('pages');
  for (const p of await client.fetch('*[_type == "page"]|order(slug.current){...}')) {
    console.log(`\n ${p._id}  (${p.slug?.current})`);
    for (const k of ['heroEyebrow', 'heroTitle', 'heroSubtitle', 'seoTitle', 'metaDescription']) {
      if (p[k]) console.log(`   ${k}: ${JSON.stringify(p[k])}`);
    }
    (p.sections ?? []).forEach((sec, i) => {
      console.log(`   sections[${i}] key=${sec.key}`);
      for (const k of ['heading', 'subheading', 'ctaLabel']) {
        if (sec[k]) console.log(`     ${k}: ${JSON.stringify(sec[k])}`);
      }
    });
    if (p.contentSections?.length) {
      p.contentSections.forEach((cs, i) => console.log(`   contentSections[${i}]: ${JSON.stringify(cs.heading)}`));
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
