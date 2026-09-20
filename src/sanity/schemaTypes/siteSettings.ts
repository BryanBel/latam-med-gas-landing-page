import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Configuración del Sitio',
  type: 'document',
  fields: [
    defineField({ name: 'siteName', title: 'Nombre del sitio', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'tagline', title: 'Eslogan', type: 'string' }),
    defineField({
      name: 'metaDescription',
      title: 'Meta descripción (SEO)',
      description:
        'Descripción para buscadores y redes sociales (140–160 caracteres). Si se deja vacío se usa el eslogan.',
      type: 'text',
      rows: 2,
      validation: (r) => r.max(200).warning('Lo ideal es menos de 160 caracteres.'),
    }),
    defineField({ name: 'logo', title: 'Logo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'phone', title: 'Teléfono', type: 'string' }),
    defineField({ name: 'email', title: 'Correo', type: 'string' }),
    defineField({ name: 'address', title: 'Dirección', type: 'text', rows: 2 }),
    defineField({
      name: 'products',
      title: 'Portafolio de productos',
      description: 'Lista de productos y repuestos que aparece en la página de Servicios.',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'slogan',
      title: 'Eslogan de la banda de contacto',
      description: 'La frase corta sobre el botón de contacto, al pie de cada página.',
      type: 'string',
    }),
    defineField({
      name: 'ctaTitle',
      title: 'Banda de contacto — título',
      type: 'string',
    }),
    defineField({
      name: 'ctaText',
      title: 'Banda de contacto — texto',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'footerNote',
      title: 'Nota del pie de página',
      description: 'La línea bajo el copyright sobre el uso de los datos de contacto.',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'stats',
      title: 'Cifras destacadas',
      description:
        'La franja de números animados de la portada y de Trayectoria. El número se cuenta solo; ' +
        'el sufijo es lo que va pegado detrás, por ejemplo el "+" de "5+".',
      type: 'array',
      of: [
        defineField({
          name: 'stat',
          title: 'Cifra',
          type: 'object',
          fields: [
            defineField({ name: 'value', title: 'Número', type: 'number', validation: (r) => r.required().min(0) }),
            defineField({ name: 'suffix', title: 'Sufijo', type: 'string' }),
            defineField({ name: 'label', title: 'Etiqueta', type: 'string', validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'label', subtitle: 'value' } },
        }),
      ],
    }),
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
