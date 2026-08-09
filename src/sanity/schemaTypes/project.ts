import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'project',
  title: 'Proyecto / Cliente',
  type: 'document',
  fields: [
    defineField({ name: 'clientName', title: 'Nombre del cliente o proyecto', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'location', title: 'Ubicación', type: 'string' }),
    defineField({ name: 'description', title: 'Descripción', type: 'text', rows: 3 }),
    defineField({ name: 'image', title: 'Imagen', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'order', title: 'Orden', type: 'number' }),
  ],
  orderings: [
    { title: 'Orden', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'clientName', subtitle: 'location' },
  },
});
