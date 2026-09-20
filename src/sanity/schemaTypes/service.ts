import { defineField, defineType } from 'sanity';
import { orderRankField } from '@sanity/orderable-document-list';

export default defineType({
  name: 'service',
  title: 'Servicio',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Título', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'description', title: 'Descripción', type: 'text', rows: 3 }),
    defineField({ name: 'icon', title: 'Ícono (nombre lucide-react, ej: "wrench")', type: 'string' }),
    defineField({
      name: 'link',
      title: 'Enlace (opcional)',
      description:
        'Ruta interna a una página propia de este servicio, p. ej. "/cursos/". Si se deja vacío la tarjeta no es clicable.',
      type: 'string',
    }),
    defineField({ name: 'order', title: 'Orden', type: 'number' }),
    orderRankField({ type: 'service' }),
  ],
  orderings: [{ title: 'Orden', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', subtitle: 'description' },
  },
});
