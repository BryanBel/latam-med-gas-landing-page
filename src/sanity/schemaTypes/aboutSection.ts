import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'aboutSection',
  title: 'Sección Sobre Nosotros',
  type: 'document',
  fields: [
    defineField({ name: 'eyebrow', title: 'Texto pequeño superior', type: 'string' }),
    defineField({ name: 'heading', title: 'Título', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'body', title: 'Descripción', type: 'text', rows: 5 }),
    defineField({
      name: 'highlights',
      title: 'Puntos destacados',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'image', title: 'Imagen', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'mission', title: 'Misión', type: 'text', rows: 4 }),
    defineField({ name: 'vision', title: 'Visión', type: 'text', rows: 4 }),
  ],
  preview: {
    select: { title: 'heading' },
  },
});
