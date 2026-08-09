import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'service',
  title: 'Servicio',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Título', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'description', title: 'Descripción', type: 'text', rows: 3 }),
    defineField({ name: 'icon', title: 'Ícono (nombre lucide-react, ej: "wrench")', type: 'string' }),
    defineField({ name: 'order', title: 'Orden', type: 'number' }),
  ],
  orderings: [
    { title: 'Orden', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title', subtitle: 'description' },
  },
});
