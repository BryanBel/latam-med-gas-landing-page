import { defineArrayMember, defineField, defineType } from 'sanity';

// The section catalogue. An editor adds, reorders and removes these on any page, which is what
// makes new sections possible without a deploy — but each one renders through the site's own
// components, so the result cannot drift away from the design. That is the deliberate trade
// against a free-form page builder: less control over layout, and no way to end up with a page
// that looks like it belongs to a different site.
//
// `tone` offers three grounds rather than a colour picker, for the same reason.
const TONES = [
  { title: 'Blanco', value: 'light' },
  { title: 'Gris suave', value: 'soft' },
  { title: 'Azul (texto claro)', value: 'navy' },
];

const toneField = defineField({
  name: 'tone',
  title: 'Fondo',
  type: 'string',
  options: { list: TONES },
  initialValue: 'light',
});

export const blockText = defineType({
  name: 'blockText',
  title: 'Texto',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Texto pequeño superior', type: 'string' }),
    defineField({ name: 'heading', title: 'Título', type: 'string' }),
    defineField({
      name: 'body',
      title: 'Contenido',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          // A heading inside a section would compete with the section's own title, so the styles
          // on offer are the ones that make sense within a body of text.
          styles: [
            { title: 'Párrafo', value: 'normal' },
            { title: 'Subtítulo', value: 'h3' },
            { title: 'Cita', value: 'blockquote' },
          ],
          lists: [
            { title: 'Viñetas', value: 'bullet' },
            { title: 'Numerada', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Negrita', value: 'strong' },
              { title: 'Cursiva', value: 'em' },
            ],
            annotations: [
              defineField({
                name: 'link',
                title: 'Enlace',
                type: 'object',
                fields: [defineField({ name: 'href', title: 'URL', type: 'url' })],
              }),
            ],
          },
        }),
      ],
    }),
    toneField,
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Texto', subtitle: 'Texto' }),
  },
});

export const blockTextImage = defineType({
  name: 'blockTextImage',
  title: 'Texto con imagen',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Texto pequeño superior', type: 'string' }),
    defineField({ name: 'heading', title: 'Título', type: 'string' }),
    defineField({ name: 'body', title: 'Texto', type: 'text', rows: 5 }),
    defineField({ name: 'image', title: 'Imagen', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'imageSide',
      title: 'Lado de la imagen',
      type: 'string',
      options: {
        list: [
          { title: 'Izquierda', value: 'left' },
          { title: 'Derecha', value: 'right' },
        ],
      },
      initialValue: 'right',
    }),
    toneField,
  ],
  preview: {
    select: { title: 'heading', media: 'image' },
    prepare: ({ title, media }) => ({
      title: title || 'Texto con imagen',
      subtitle: 'Texto con imagen',
      media,
    }),
  },
});

export const blockCards = defineType({
  name: 'blockCards',
  title: 'Tarjetas',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Texto pequeño superior', type: 'string' }),
    defineField({ name: 'heading', title: 'Título', type: 'string' }),
    defineField({ name: 'intro', title: 'Texto de apoyo', type: 'text', rows: 2 }),
    defineField({
      name: 'cards',
      title: 'Tarjetas',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'card',
          title: 'Tarjeta',
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Título', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'text', title: 'Texto', type: 'text', rows: 3 }),
            defineField({
              name: 'icon',
              title: 'Ícono',
              description: 'El mismo catálogo que usan los servicios: shield-check, hard-hat, graduation-cap…',
              type: 'string',
            }),
            defineField({ name: 'link', title: 'Enlace (opcional)', type: 'string' }),
          ],
          preview: { select: { title: 'title', subtitle: 'text' } },
        }),
      ],
      validation: (r) => r.min(1),
    }),
    toneField,
  ],
  preview: {
    select: { title: 'heading', cards: 'cards' },
    prepare: ({ title, cards }) => ({
      title: title || 'Tarjetas',
      subtitle: `Tarjetas — ${cards?.length ?? 0}`,
    }),
  },
});

export const blockQuote = defineType({
  name: 'blockQuote',
  title: 'Cita destacada',
  type: 'object',
  fields: [
    defineField({ name: 'quote', title: 'Cita', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({ name: 'author', title: 'Autor', type: 'string' }),
    defineField({ name: 'role', title: 'Cargo o institución', type: 'string' }),
    toneField,
  ],
  preview: {
    select: { title: 'quote', subtitle: 'author' },
  },
});

export const blockGallery = defineType({
  name: 'blockGallery',
  title: 'Galería',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Título', type: 'string' }),
    defineField({
      name: 'images',
      title: 'Imágenes',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Texto alternativo',
              description: 'Qué se ve en la imagen. Lo leen los lectores de pantalla y los buscadores.',
              type: 'string',
            }),
          ],
        }),
      ],
      validation: (r) => r.min(1),
    }),
    toneField,
  ],
  preview: {
    select: { title: 'heading', images: 'images', media: 'images.0' },
    prepare: ({ title, images, media }) => ({
      title: title || 'Galería',
      subtitle: `Galería — ${images?.length ?? 0} imagen(es)`,
      media,
    }),
  },
});

export const blockFaq = defineType({
  name: 'blockFaq',
  title: 'Preguntas frecuentes',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Título', type: 'string' }),
    defineField({
      name: 'items',
      title: 'Preguntas',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'faqItem',
          title: 'Pregunta',
          type: 'object',
          fields: [
            defineField({ name: 'question', title: 'Pregunta', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'answer', title: 'Respuesta', type: 'text', rows: 4, validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'question', subtitle: 'answer' } },
        }),
      ],
      validation: (r) => r.min(1),
    }),
    toneField,
  ],
  preview: {
    select: { title: 'heading', items: 'items' },
    prepare: ({ title, items }) => ({
      title: title || 'Preguntas frecuentes',
      subtitle: `Preguntas frecuentes — ${items?.length ?? 0}`,
    }),
  },
});

export const blockCta = defineType({
  name: 'blockCta',
  title: 'Llamado a la acción',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Título', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'text', title: 'Texto', type: 'text', rows: 2 }),
    defineField({ name: 'buttonLabel', title: 'Texto del botón', type: 'string' }),
    defineField({ name: 'buttonHref', title: 'Destino del botón', type: 'string', initialValue: '/contacto/' }),
    toneField,
  ],
  preview: {
    select: { title: 'heading', subtitle: 'text' },
    prepare: ({ title, subtitle }) => ({ title: title || 'Llamado a la acción', subtitle }),
  },
});

export const blockTypes = [blockText, blockTextImage, blockCards, blockQuote, blockGallery, blockFaq, blockCta];
export const blockTypeNames = blockTypes.map((b) => b.name);
