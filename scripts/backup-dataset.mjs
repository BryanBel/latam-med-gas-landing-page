/**
 * Snapshots the Sanity dataset into ../sanity-backups, outside this repo.
 *
 * Why this exists: document history on this plan is short. Measured on 2026-09-20, the oldest
 * transaction still held for siteSettings was from the previous day, even though the document
 * was created on 2026-08-09 — its creation transaction had already been purged. So the CMS is
 * a good "undo what I just did" and a bad "what did this page say last month".
 *
 * Two artefacts, because they answer different questions:
 *
 *   archive/production-<ts>.tar.gz  — what `sanity dataset import` restores from. Includes
 *                                     uploaded images, which the readable tree cannot.
 *   documents/<type>/<id>.json      — one pretty-printed file per document, keys sorted, with
 *                                     _rev and _updatedAt stripped so a diff shows what the
 *                                     text actually changed and nothing else.
 *
 * The backup directory is its own git repository. That is the version control: `git log -p
 * documents/page/page-privacidad.json` reads as the edit history of that page. It is separate
 * from the site repo on purpose — the site repo is public, and a dataset can hold drafts and
 * testimonials waiting on authorization.
 *
 *   pnpm backup            snapshot and commit
 *   pnpm backup --dry-run  show what would change, write nothing
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { getCliClient } from 'sanity/cli';

const client = getCliClient({ apiVersion: '2024-01-01' });
const dryRun = process.argv.includes('--dry-run');

const ROOT = path.resolve(process.cwd(), '..', 'sanity-backups');
const ARCHIVE = path.join(ROOT, 'archive');
const DOCS = path.join(ROOT, 'documents');
// Matches the scheduled job in the backup repository. If the two pruned to different numbers,
// each run would delete the other's tarballs.
const KEEP_ARCHIVES = 30;
const DATASET = process.env.PUBLIC_SANITY_DATASET || 'production';

// Fields that change on every write without the content changing. Keeping them would make each
// snapshot a full-tree diff and hide the one line that actually moved.
const VOLATILE = new Set(['_rev', '_updatedAt']);

const sortKeys = (value) => {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .filter((k) => !VOLATILE.has(k))
        .sort()
        .map((k) => [k, sortKeys(value[k])]),
    );
  }
  return value;
};

const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');

function git(args, { check = true } = {}) {
  try {
    return execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8' }).trim();
  } catch (err) {
    if (check) throw err;
    return '';
  }
}

async function main() {
  // System documents are Sanity's own bookkeeping and drafts are unfinished work; neither
  // belongs in a record of what the site said.
  const docs = await client.fetch(
    '*[!(_id in path("drafts.**")) && !(_type match "system.*") && !(_type match "sanity.*")] | order(_type asc, _id asc)',
  );
  const byType = new Map();
  for (const doc of docs) {
    if (!byType.has(doc._type)) byType.set(doc._type, []);
    byType.get(doc._type).push(doc);
  }

  console.log(`${docs.length} documento(s) en ${DATASET}:`);
  for (const [type, list] of [...byType].sort()) console.log(`  ${type.padEnd(16)} ${list.length}`);

  if (dryRun) {
    console.log(`\ndry-run: no se escribió nada en ${ROOT}`);
    return;
  }

  mkdirSync(ARCHIVE, { recursive: true });
  rmSync(DOCS, { recursive: true, force: true });
  for (const [type, list] of byType) {
    mkdirSync(path.join(DOCS, type), { recursive: true });
    for (const doc of list) {
      // A document id can contain characters Windows will not take in a filename.
      const name = `${doc._id.replace(/[^a-zA-Z0-9._-]/g, '_')}.json`;
      writeFileSync(path.join(DOCS, type, name), `${JSON.stringify(sortKeys(doc), null, 2)}\n`, 'utf8');
    }
  }

  // The CLI export is what a restore reads, and the only artefact that carries uploaded images.
  const archive = path.join(ARCHIVE, `${DATASET}-${stamp()}.tar.gz`);
  // Run the CLI through Node directly rather than `npx ... {shell: true}`: on Windows that
  // needs a shell, and passing arguments to a shell unescaped is exactly the deprecated
  // pattern Node warns about.
  // `sanity/bin/sanity` is not an export of the package, so resolve it from the package root.
  const cli = path.join(path.dirname(createRequire(import.meta.url).resolve('sanity/package.json')), 'bin', 'sanity');
  if (!existsSync(cli)) throw new Error(`No se encontró el CLI de Sanity en ${cli}`);
  execFileSync(process.execPath, [cli, 'dataset', 'export', DATASET, archive], { stdio: 'inherit' });

  const archives = readdirSync(ARCHIVE)
    .filter((f) => f.endsWith('.tar.gz'))
    .sort();
  for (const old of archives.slice(0, Math.max(0, archives.length - KEEP_ARCHIVES))) {
    rmSync(path.join(ARCHIVE, old));
    console.log(`podado ${old}`);
  }

  if (!existsSync(path.join(ROOT, '.git'))) {
    console.log(`\n${ROOT} no es un repositorio git — snapshot escrito, sin commit.`);
    return;
  }
  const hasRemote = Boolean(git(['remote'], { check: false }));

  git(['add', '-A']);
  const changed = Boolean(git(['status', '--porcelain'], { check: false }));
  if (changed) {
    const summary = [...byType].map(([t, l]) => `${t} ${l.length}`).join(', ');
    git(['commit', '-q', '-m', `Respaldo ${DATASET} — ${docs.length} documentos (${summary})`]);
    console.log(`\nCommit: ${git(['log', '--oneline', '-1'])}`);
  } else {
    console.log('\nSin cambios desde el último respaldo.');
  }

  // The scheduled job pushes its own snapshots, so the remote moves on its own. Rebase onto it
  // before pushing — and only after committing, because a rebase refuses to run with a dirty
  // tree, which is exactly the state this script is in until the commit above.
  if (hasRemote) {
    git(['pull', '--rebase', '--quiet'], { check: false });
    git(['push', '--quiet'], { check: false });
    if (changed) console.log('Empujado al repositorio privado.');
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
