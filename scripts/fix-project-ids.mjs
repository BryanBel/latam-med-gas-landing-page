// Makes the imported projects publicly readable.
//
//   npx sanity exec scripts/fix-project-ids.mjs --with-user-token
//
// scripts/import-projects.mjs created the 13 projects with ids shaped `imported.<slug>`.
// Sanity treats any document whose _id contains a dot as private: it is returned to
// authenticated requests only. The site builds against the public API, so it saw zero
// projects and fell back to DEFAULT_PROJECTS in src/lib/content.ts — which is why the
// trajectory still rendered correctly and the problem went unnoticed. The client could not
// edit any of them in Studio either.
//
// This copies each document to a dot-free id and deletes the dotted original, in one
// transaction. Content is untouched. Safe to re-run: once no dotted ids remain it is a no-op.
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2024-01-01' });

async function run() {
  const docs = await client.fetch('*[_type == "project" && _id match "imported.*"]');
  const dotted = docs.filter((d) => d._id.includes('.'));

  if (dotted.length === 0) {
    console.log('Nothing to do: no project ids contain a dot.');
    return;
  }

  const tx = client.transaction();
  for (const doc of dotted) {
    const content = { ...doc };
    for (const key of ['_rev', '_createdAt', '_updatedAt']) delete content[key];
    content._id = doc._id.replace(/\./g, '-');
    tx.createOrReplace(content);
    tx.delete(doc._id);
  }
  await tx.commit({ visibility: 'sync' });

  const remaining = await client.fetch('count(*[_type == "project"])');
  console.log(`Renamed ${dotted.length} projects. Dataset now holds ${remaining}.`);
  for (const doc of dotted) console.log(`  ${doc._id}  ->  ${doc._id.replace(/\./g, '-')}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
