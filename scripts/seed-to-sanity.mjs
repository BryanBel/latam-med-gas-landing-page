/**
 * Moves the remaining seed copy into Sanity so the Studio becomes the source of truth.
 *
 * Until now roughly half of what the site shows was not editable by the client: the phone,
 * email and address, the product portfolio, the misión/visión, and all ten ASSE courses were
 * empty in Sanity and rendered from src/lib/content.ts. The editor saw a blank field while the
 * site showed a value anyway, with no way to tell where it came from.
 *
 * Populating the `course` collection also defuses a trap. Collection fallbacks fire only on an
 * *empty* type (`courses.length > 0 ? courses : DEFAULT_COURSES`), so creating a single course
 * in the Studio would have dropped the page from ten courses to one.
 *
 * Images are deliberately left out. They are local assets going through `astro:assets`, which
 * produces the WebP and srcset the site's performance depends on; uploading them to Sanity
 * would swap that for Sanity's derivatives. The client can still override any image from the
 * Studio.
 *
 * Every write is setIfMissing / createIfNotExists, so this is safe to re-run and never
 * overwrites an edit made in the Studio.
 *
 *   npx sanity exec scripts/seed-to-sanity.mjs --with-user-token -- --dry-run
 *   npx sanity exec scripts/seed-to-sanity.mjs --with-user-token
 */
import { getCliClient } from 'sanity/cli';
import {
  DEFAULT_SITE_SETTINGS,
  DEFAULT_PRODUCTS,
  DEFAULT_MISSION_VISION,
  DEFAULT_COURSES,
} from '../src/lib/content.ts';

const client = getCliClient({ apiVersion: '2024-01-01' });
const dryRun = process.argv.includes('--dry-run');

async function singletonId(type) {
  const id = await client.fetch('*[_type == $type][0]._id', { type });
  if (!id) throw new Error(`No ${type} document found`);
  return id;
}

/**
 * An undefined value turns setIfMissing into a silent no-op, and the run still reports success.
 * Print what is actually about to be written, and refuse anything undefined — that is how
 * DEFAULT_ABOUT.mission slipped through on the first pass, when the copy really lives in
 * DEFAULT_MISSION_VISION.
 */
function describe(label, obj) {
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) throw new Error(`${label}.${key} is undefined — wrong seed export?`);
    const shown = Array.isArray(value) ? `${value.length} items` : String(value);
    console.log(`  ${label}.${key} = ${shown.length > 90 ? `${shown.slice(0, 90)}…` : shown}`);
  }
}

async function main() {
  const settingsId = await singletonId('siteSettings');
  const aboutId = await singletonId('aboutSection');

  const settings = {
    phone: DEFAULT_SITE_SETTINGS.phone,
    email: DEFAULT_SITE_SETTINGS.email,
    address: DEFAULT_SITE_SETTINGS.address,
    products: DEFAULT_PRODUCTS,
  };
  const about = {
    mission: DEFAULT_MISSION_VISION.mission,
    vision: DEFAULT_MISSION_VISION.vision,
  };
  const courses = DEFAULT_COURSES.map((course, i) => ({
    _id: `course-${course.code}`,
    _type: 'course',
    code: course.code,
    title: course.title,
    description: course.description,
    order: i + 1,
  }));

  console.log(`siteSettings ${settingsId} — setIfMissing:`);
  describe('settings', settings);
  console.log(`aboutSection ${aboutId} — setIfMissing:`);
  describe('about', about);

  if (dryRun) {
    const existing = await client.fetch('count(*[_type == "course"])');
    console.log(`course — createIfNotExists ${courses.length}, ${existing} already present:`);
    courses.forEach((c) => console.log(`  ${c._id}  ${c.code} ${c.title}`));
    return;
  }

  let tx = client
    .transaction()
    .patch(settingsId, (p) => p.setIfMissing(settings))
    .patch(aboutId, (p) => p.setIfMissing(about));
  courses.forEach((course) => {
    tx = tx.createIfNotExists(course);
  });
  await tx.commit();

  console.log(`Patched siteSettings + aboutSection, ensured ${courses.length} courses.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
