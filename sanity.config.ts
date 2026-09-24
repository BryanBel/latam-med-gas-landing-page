import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { presentationTool, defineLocations } from 'sanity/presentation';
import { visionTool } from '@sanity/vision';
import { media } from 'sanity-plugin-media';
import { schemaTypes } from './src/sanity/schemaTypes';
import { structure, SINGLETON_TYPES } from './src/sanity/structure';

const singletons = new Set<string>(SINGLETON_TYPES);

// De dónde carga el sitio la herramienta Vista previa. Tiene que ser el despliegue de preview:
// un segundo Worker de Cloudflare construido desde este repositorio con PUBLIC_SANITY_PREVIEW=true.
// Producción no sirve, porque la edición visual necesita los marcadores stega dentro del texto y
// esos no pueden llegar nunca al HTML público.
//
// El respaldo apunta al Worker y no a `localhost:4321`, que es lo que ponía antes. Dos motivos,
// y el segundo es el que rompía:
//
//   1. El dev server normal no lleva stega ni el runtime de edición visual —eso solo aparece con
//      PUBLIC_SANITY_PREVIEW=true, que además cambia el build a servidor y exige un token—, así
//      que enmarcarlo daba «Unable to connect to visual editing» y nada más.
//   2. Bajo `npx sanity dev` esta variable llega siempre `undefined`, porque el CLI de Sanity
//      expone al navegador las que empiezan por SANITY_STUDIO_ y Astro las que empiezan por
//      PUBLIC_. O sea que el respaldo no era un caso raro: era el camino normal del Studio local.
//
// Comprobado el 24/09/2026: el Worker sirve 98.920 caracteres stega y carga @sanity/visual-editing.
const PREVIEW_ORIGIN =
  import.meta.env.PUBLIC_SANITY_PREVIEW_ORIGIN || 'https://latam-med-gas-preview.bryanbelandriav.workers.dev';

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

  // Los mismos valores que `sanity.cli.ts`, y por el mismo motivo: son identificadores
  // públicos, viajan al navegador en el bundle del sitio y no hay nada que proteger en ellos.
  //
  // El respaldo no es adorno. Bajo Astro, Vite expone las variables con prefijo `PUBLIC_` y la
  // primera rama gana. Pero el CLI de Sanity monta su propio Vite con `envPrefix`
  // `SANITY_STUDIO_`, así que al arrancar el Studio con `npx sanity dev` estas dos llegan
  // `undefined` y el Studio muere con «Configuration must contain `projectId`».
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'mms9p1ms',
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
