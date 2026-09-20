// Points the "Cursos de Capacitación ASSE 6000" service card at the courses page.
//
//   npx sanity exec scripts/link-cursos-service.mjs --with-user-token
//
// The client asked whether the courses need a tab of their own when they are part of the
// services. They do — it is the offering people search for, and a page of its own earns its
// own ranking. But the answer only holds if you can actually get there from Servicios, and
// the card was not a link, so the section was reachable from the nav and nowhere else.
//
// Safe to re-run: it only writes when the stored value differs.
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2024-01-01' });
const ID = '24c931a1-9e6d-49c8-9597-6f24bded26d3';
const TARGET = '/cursos/';

async function run() {
  const doc = await client.fetch('*[_id == $id][0]{_id, title, link}', { id: ID });
  if (!doc) throw new Error(`No service document with id ${ID}`);
  if (doc.link === TARGET) {
    console.log(`Nothing to do: "${doc.title}" already links to ${TARGET}`);
    return;
  }
  await client.patch(ID).set({ link: TARGET }).commit({ visibility: 'sync' });
  console.log(`"${doc.title}"  ->  ${TARGET}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
