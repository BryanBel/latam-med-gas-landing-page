import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'heroSection',
  title: 'Sección Hero',
  type: 'document',
  fields: [
    defineField({ name: 'eyebrow', title: 'Texto pequeño superior', type: 'string' }),
    defineField({ name: 'heading', title: 'Título principal', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'subheading', title: 'Subtítulo', type: 'text', rows: 3 }),
    defineField({ name: 'ctaLabel', title: 'Texto del botón', type: 'string' }),
    defineField({ name: 'ctaLink', title: 'Enlace del botón', type: 'string' }),
    defineField({ name: 'backgroundImage', title: 'Imagen de fondo', type: 'image', options: { hotspot: true } }),
  ],
  preview: {
    select: { title: 'heading' },
  },
});
