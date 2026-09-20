import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './src/sanity/schemaTypes';
import { structure, SINGLETON_TYPES } from './src/sanity/structure';

const singletons = new Set<string>(SINGLETON_TYPES);

export default defineConfig({
  name: 'default',
  title: 'Latam Med Gas — CMS',

  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',

  plugins: [structureTool({ structure }), visionTool()],

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
