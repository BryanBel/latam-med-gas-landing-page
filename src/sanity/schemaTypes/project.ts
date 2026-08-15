import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'project',
  title: 'Proyecto / Cliente',
  type: 'document',
  fields: [
    defineField({
      name: 'clientName',
      title: 'Nombre del cliente o proyecto',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'location', title: 'Ubicación', type: 'string' }),
    defineField({ name: 'country', title: 'País', type: 'string' }),
    defineField({
      name: 'date',
      title: 'Fecha (texto)',
      description: 'Mes y año del proyecto, p. ej. "Noviembre 2024".',
      type: 'string',
    }),
    defineField({
      name: 'serviceType',
      title: 'Tipo de servicio',
      description: 'Verificación, Inspección, Diseño, etc. — se muestra como etiqueta.',
      type: 'string',
    }),
    defineField({ name: 'description', title: 'Descripción', type: 'text', rows: 3 }),
    defineField({ name: 'image', title: 'Imagen', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'order', title: 'Orden', type: 'number' }),
  ],
  orderings: [{ title: 'Orden', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'clientName', subtitle: 'location' },
  },
});
