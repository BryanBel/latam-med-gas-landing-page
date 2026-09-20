import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { media } from 'sanity-plugin-media';
import { schemaTypes } from './src/sanity/schemaTypes';
import { structure, SINGLETON_TYPES } from './src/sanity/structure';

const singletons = new Set<string>(SINGLETON_TYPES);

export default defineConfig({
  name: 'default',
  title: 'Latam Med Gas — CMS',

  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',

  // Sanity's built-in picker can already upload and reuse an image across documents, but it
  // offers no way to find one again: no tags, no search, no bulk view. `media` adds those, and
  // adds a Media tool to the top bar so the client can curate the library on its own instead of
  // only meeting it inside a field.
  plugins: [structureTool({ structure }), media(), visionTool()],

  schema: {
    types: schemaTypes,
  },

  document: {
    // Nothing stopped an editor creating a second siteSettings, heroSection or aboutSection.
    // The build reads `*[_type == "..."][0]` with no ordering, so which of the two won would
    // have been arbitrary and silent. Keep them out of the "create new" menu entirely.
    newDocumentOptions: (prev) => prev.filter((item) => !singletons.has(item.templateId)),

    // Same reasoning from the other side: a singleton must not be deleted or duplicated.
    actions: (prev, { schemaType }) =>
      singletons.has(schemaType)
        ? prev.filter(({ action }) => action !== 'delete' && action !== 'duplicate' && action !== 'unpublish')
        : prev,
  },
});
