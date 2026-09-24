import { defineArrayMember, defineField, defineType } from 'sanity';
import { blockTypeNames } from './blocks';

// One document per route. Holds everything the page shows that is not a collection: its SEO,
// its hero, the headings of its sections, and — for /privacidad — the body text itself.
//
// `slug` is what the code looks the document up by, so it is a fixed list rather than free
// text: a typo there would silently detach a page from its content.
export const PAGE_SLUGS = [
  { title: 'Inicio', value: 'inicio' },
  { title: 'Nosotros', value: 'nosotros' },
  { title: 'Servicios', value: 'servicios' },
  { title: 'Cursos ASSE 6000', value: 'cursos' },
  { title: 'Trayectoria', value: 'trayectoria' },
  { title: 'Contacto', value: 'contacto' },
  { title: 'Política de Privacidad', value: 'privacidad' },
  { title: 'Página no encontrada (404)', value: '404' },
];

// Section headings are keyed so the template can find them. Same reasoning as `slug`.
export const SECTION_KEYS = [
  { title: 'Servicios — encabezado', value: 'servicios' },
  { title: 'Trayectoria — encabezado', value: 'proyectos' },
  { title: 'Estándares de la industria — encabezado', value: 'certificaciones' },
  { title: 'Testimonios — encabezado', value: 'testimonios' },
  { title: 'Misión y Visión — encabezado', value: 'misionVision' },
  { title: 'Portafolio de productos — encabezado', value: 'productos' },
  { title: 'Proyectos — encabezado de la lista', value: 'proyectosLista' },
  { title: 'Cursos — nota al pie', value: 'cursosNota' },
  { title: 'Banda de contacto — sólo en esta página', value: 'bandaContacto' },
];

// A field that does nothing on the page being edited is worse than a missing one: the editor
// fills it in and waits for a change that never comes. Inicio's hero lives in its own
// "Portada — Hero" document, only Privacidad renders a body, and Contacto has no sections.
const PAGES_WITH_HERO = ['nosotros', 'servicios', 'cursos', 'trayectoria', 'contacto', 'privacidad', '404'];
const PAGES_WITH_SECTIONS = ['inicio', 'nosotros', 'servicios', 'cursos', 'trayectoria'];

export default defineType({
  name: 'page',
  title: 'Página',
  type: 'document',
  groups: [
    { name: 'seo', title: 'Buscadores (SEO)' },
    { name: 'hero', title: 'Encabezado', default: true },
    { name: 'sections', title: 'Secciones' },
  ],
  fields: [
    defineField({
      name: 'slug',
      title: 'Página',
      description: 'Cuál de las páginas del sitio es esta. No se debe cambiar.',
      type: 'string',
      options: { list: PAGE_SLUGS },
      // Two documents claiming the same page would make which one renders arbitrary, because the
      // build reads `*[_type == "page" && slug == $slug][0]`.
      validation: (r) =>
        r.required().custom(async (slug, context) => {
          if (!slug) return true;
          const id = context.document?._id?.replace(/^drafts\./, '');
          const taken = await context
            .getClient({ apiVersion: '2024-01-01' })
            .fetch('count(*[_type == "page" && slug == $slug && !(_id in [$id, "drafts." + $id])])', { slug, id });
          return taken === 0 || 'Ya existe otra página con este valor.';
        }),
    }),
    defineField({
      name: 'seoTitle',
      title: 'Título en buscadores',
      description: 'Lo que Google muestra como titular. Si se deja vacío se usa el título del encabezado.',
      type: 'string',
      group: 'seo',
      validation: (r) => r.max(65).warning('Google corta alrededor de los 60–65 caracteres.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Descripción en buscadores',
      description: 'El párrafo que aparece bajo el título en Google. Lo ideal es entre 140 y 160 caracteres.',
      type: 'text',
      rows: 3,
      group: 'seo',
      validation: (r) => r.max(200).warning('Google corta alrededor de los 160 caracteres.'),
    }),
    defineField({
      name: 'heroEyebrow',
      hidden: ({ document }) => !PAGES_WITH_HERO.includes(String(document?.slug)),
      title: 'Texto pequeño superior',
      type: 'string',
      group: 'hero',
    }),
    defineField({
      name: 'heroTitle',
      hidden: ({ document }) => !PAGES_WITH_HERO.includes(String(document?.slug)),
      title: 'Título principal',
      type: 'string',
      group: 'hero',
    }),
    defineField({
      name: 'heroSubtitle',
      hidden: ({ document }) => !PAGES_WITH_HERO.includes(String(document?.slug)),
      title: 'Subtítulo',
      type: 'text',
      rows: 3,
      group: 'hero',
    }),
    defineField({
      name: 'sections',
      title: 'Encabezados de sección',
      hidden: ({ document }) => !PAGES_WITH_SECTIONS.includes(String(document?.slug)),
      description:
        'Los títulos que abren cada bloque de la página. El contenido de cada bloque (servicios, ' +
        'proyectos, cursos…) se edita en su propia lista.',
      type: 'array',
      group: 'sections',
      of: [
        defineField({
          name: 'sectionHeader',
          title: 'Encabezado',
          type: 'object',
          fields: [
            defineField({
              name: 'key',
              title: 'Sección',
              type: 'string',
              options: { list: SECTION_KEYS },
              validation: (r) => r.required(),
            }),
            defineField({ name: 'eyebrow', title: 'Texto pequeño superior', type: 'string' }),
            defineField({ name: 'heading', title: 'Título', type: 'string' }),
            defineField({ name: 'subheading', title: 'Texto de apoyo', type: 'text', rows: 2 }),
            defineField({ name: 'ctaLabel', title: 'Texto del enlace', type: 'string' }),
          ],
          preview: {
            select: { title: 'heading', subtitle: 'key' },
          },
        }),
      ],
    }),
    defineField({
      name: 'blocks',
      title: 'Secciones propias',
      description:
        'Secciones que se agregan al final de la página. Se eligen de un catálogo, se ordenan ' +
        'arrastrando, y cada una se dibuja con el diseño del sitio.',
      type: 'array',
      group: 'sections',
      of: blockTypeNames.map((name) => defineArrayMember({ type: name })),
    }),
    defineField({
      name: 'contentSections',
      title: 'Cuerpo de texto',
      hidden: ({ document }) => document?.slug !== 'privacidad',
      description: 'Sólo lo usa la Política de Privacidad: cada entrada es un apartado con su título.',
      type: 'array',
      group: 'sections',
      of: [
        defineField({
          name: 'contentSection',
          title: 'Apartado',
          type: 'object',
          fields: [
            defineField({ name: 'heading', title: 'Título', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'body', title: 'Texto', type: 'text', rows: 5, validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'heading', subtitle: 'body' } },
        }),
      ],
    }),
  ],
  preview: {
    select: { slug: 'slug', title: 'heroTitle' },
    prepare: ({ slug, title }) => ({
      title: PAGE_SLUGS.find((p) => p.value === slug)?.title ?? slug ?? 'Sin asignar',
      subtitle: title,
    }),
  },
});
