import { defineField, defineType } from 'sanity';
import { orderRankField } from '@sanity/orderable-document-list';

export default defineType({
  name: 'certification',
  title: 'Certificación',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre (ej: ASSE 6000, NFPA 99)',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'description', title: 'Descripción', type: 'text', rows: 2 }),
    defineField({ name: 'badge', title: 'Insignia / logo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'order', title: 'Orden', type: 'number' }),
    orderRankField({ type: 'certification' }),
  ],
  orderings: [{ title: 'Orden', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name' },
  },
});
