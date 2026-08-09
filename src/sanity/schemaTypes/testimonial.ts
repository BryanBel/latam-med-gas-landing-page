import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'testimonial',
  title: 'Testimonio',
  type: 'document',
  fields: [
    defineField({ name: 'quote', title: 'Cita', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({ name: 'authorName', title: 'Nombre del autor', type: 'string' }),
    defineField({ name: 'authorRole', title: 'Cargo', type: 'string' }),
    defineField({ name: 'company', title: 'Empresa', type: 'string' }),
  ],
  preview: {
    select: { title: 'authorName', subtitle: 'company' },
  },
});
