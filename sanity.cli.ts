import { defineCliConfig } from 'sanity/cli';

// projectId and dataset are public identifiers (also shipped to the browser via the
// PUBLIC_SANITY_* env vars), so they are safe to keep here. This file lets the Sanity CLI —
// e.g. `npx sanity exec scripts/import-projects.mjs --with-user-token` — resolve the project.
export default defineCliConfig({
  api: {
    projectId: 'mms9p1ms',
    dataset: 'production',
  },
});
