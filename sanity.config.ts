import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { presentationTool, defineLocations } from 'sanity/presentation';
import { visionTool } from '@sanity/vision';
import { media } from 'sanity-plugin-media';
import { schemaTypes } from './src/sanity/schemaTypes';
import { structure, SINGLETON_TYPES } from './src/sanity/structure';

const singletons = new Set<string>(SINGLETON_TYPES);

// Where the Presentation tool loads the site from. The preview deployment is a second
// Cloudflare Worker built from this repository with PUBLIC_SANITY_PREVIEW=true; production
// cannot be used, because visual editing needs stega markers inside the text and those must
// never reach the public HTML. Falls back to the local dev server.
const PREVIEW_ORIGIN = import.meta.env.PUBLIC_SANITY_PREVIEW_ORIGIN || 'http://localhost:4321';

// The route each page document renders at, so Presentation can jump to the right screen when
// an editor opens a document — and so a document shows which page it appears on.
const PAGE_PATHS: Record<string, string> = {
  inicio: '/',
  nosotros: '/nosotros/',
  servicios: '/servicios/',
  cursos: '/cursos/',
  trayectoria: '/trayectoria/',
  contacto: '/contacto/',
  privacidad: '/privacidad/',
  '404': '/404',
};

// Documents that are not pages still appear on one. Naming them here is what makes the
// "used on" list in the Studio useful instead of empty.
const everywhere = (title: string) => ({
  locations: [
    { title, href: '/' },
    { title: 'Servicios', href: '/servicios/' },
  ],
});

export default defineConfig({
  name: 'default',
  title: 'Latam Med Gas — CMS',

  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',

  // Sanity's built-in picker can already upload and reuse an image across documents, but it
  // offers no way to find one again: no tags, no search, no bulk view. `media` adds those, and
  // adds a Media tool to the top bar so the client can curate the library on its own instead of
  // only meeting it inside a field.
  plugins: [
    structureTool({ structure }),
    presentationTool({
      name: 'preview',
      title: 'Vista previa',
      previewUrl: { initial: PREVIEW_ORIGIN },
      allowOrigins: [PREVIEW_ORIGIN],
      resolve: {
        locations: {
          page: defineLocations({
            select: { slug: 'slug', title: 'heroTitle' },
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title || 'Página',
                  href: PAGE_PATHS[String(doc?.slug)] ?? '/',
                },
              ],
            }),
          }),
          service: defineLocations({
            select: { title: 'title' },
            resolve: (doc) => everywhere(doc?.title || 'Servicio'),
          }),
          course: defineLocations({
            select: { title: 'title' },
            resolve: (doc) => ({ locations: [{ title: doc?.title || 'Curso', href: '/cursos/' }] }),
          }),
          project: defineLocations({
            select: { title: 'clientName' },
            resolve: (doc) => ({
              locations: [
                { title: doc?.title || 'Proyecto', href: '/trayectoria/' },
                { title: 'Inicio', href: '/' },
              ],
            }),
          }),
          certification: defineLocations({
            select: { title: 'name' },
            resolve: (doc) => ({
              locations: [
                { title: doc?.title || 'Normativa', href: '/nosotros/' },
                { title: 'Inicio', href: '/' },
              ],
            }),
          }),
          testimonial: defineLocations({
            select: { title: 'authorName' },
            resolve: (doc) => ({ locations: [{ title: doc?.title || 'Testimonio', href: '/trayectoria/' }] }),
          }),
          siteSettings: defineLocations({
            select: { title: 'siteName' },
            resolve: () => ({ locations: [{ title: 'Todo el sitio', href: '/' }] }),
          }),
          heroSection: defineLocations({
            select: { title: 'heading' },
            resolve: () => ({ locations: [{ title: 'Inicio', href: '/' }] }),
          }),
          aboutSection: defineLocations({
            select: { title: 'heading' },
            resolve: () => ({
              locations: [
                { title: 'Nosotros', href: '/nosotros/' },
                { title: 'Inicio', href: '/' },
              ],
            }),
          }),
        },
      },
    }),
    media(),
    visionTool(),
  ],

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
