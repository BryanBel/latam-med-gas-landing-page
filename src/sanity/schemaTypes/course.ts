import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'course',
  title: 'Curso ASSE 6000',
  type: 'document',
  fields: [
    defineField({ name: 'code', title: 'Código ASSE (ej: 6030)', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'title', title: 'Título', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'description', title: 'Descripción', type: 'text', rows: 3 }),
    defineField({ name: 'order', title: 'Orden', type: 'number' }),
  ],
  orderings: [{ title: 'Orden', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', subtitle: 'code' },
  },
});
