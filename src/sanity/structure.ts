import type { StructureResolver } from 'sanity/structure';
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';

// The default Studio shows a flat, alphabetical list of every document type, which tells an
// editor nothing about what is one-of-a-kind and what is a list they can add to. This groups
// them the way the site is organised and opens each singleton straight into its one document
// rather than a list holding a single row.
export const SINGLETON_TYPES = ['siteSettings', 'heroSection', 'aboutSection'] as const;

const SINGLETON_TITLES: Record<string, string> = {
  siteSettings: 'Configuración del Sitio',
  heroSection: 'Portada — Hero',
  aboutSection: 'Sobre Nosotros',
};

// The existing singletons were created by Sanity with random uuids, so their ids are looked up
// rather than guessed. Guessing would silently open a second, empty document — the same class
// of mistake as writing an `_id` with a dot in it.
export const structure: StructureResolver = async (S, context) => {
  const client = context.getClient({ apiVersion: '2024-01-01' });
  const ids: Record<string, string | null> = Object.fromEntries(
    await Promise.all(
      SINGLETON_TYPES.map(async (type) => [type, await client.fetch('*[_type == $type][0]._id', { type })]),
    ),
  );

  const singleton = (type: string) => {
    const title = SINGLETON_TITLES[type];
    const id = ids[type];
    return S.listItem()
      .title(title)
      .id(type)
      .child(
        id
          ? S.document().documentId(id).schemaType(type).title(title)
          : // No document yet: fall back to the type's list so one can be created.
            S.documentTypeList(type).title(title),
      );
  };

  return S.list()
    .title('Contenido')
    .items([
      S.documentTypeListItem('page')
        .title('Páginas')
        .child(
          S.documentTypeList('page')
            .title('Páginas')
            .defaultOrdering([{ field: 'slug', direction: 'asc' }]),
        ),

      S.divider(),

      ...SINGLETON_TYPES.map(singleton),

      S.divider(),

      orderableDocumentListDeskItem({ type: 'service', title: 'Servicios', S, context }),
      orderableDocumentListDeskItem({ type: 'course', title: 'Cursos ASSE 6000', S, context }),
      orderableDocumentListDeskItem({ type: 'certification', title: 'Normativas y estándares', S, context }),
      orderableDocumentListDeskItem({ type: 'project', title: 'Proyectos', S, context }),

      S.documentTypeListItem('testimonial').title('Testimonios'),
    ]);
};
