import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Configuración del Sitio',
  type: 'document',
  fields: [
    defineField({ name: 'siteName', title: 'Nombre del sitio', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'tagline', title: 'Eslogan', type: 'string' }),
    defineField({ name: 'logo', title: 'Logo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'phone', title: 'Teléfono', type: 'string' }),
    defineField({ name: 'email', title: 'Correo', type: 'string' }),
    defineField({ name: 'address', title: 'Dirección', type: 'text', rows: 2 }),
    defineField({
      name: 'socialLinks',
      title: 'Redes sociales',
      type: 'array',
      of: [
        defineField({
          name: 'socialLink',
          title: 'Enlace',
          type: 'object',
          fields: [
            defineField({ name: 'platform', title: 'Plataforma', type: 'string' }),
            defineField({ name: 'url', title: 'URL', type: 'url' }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'siteName' },
  },
});
