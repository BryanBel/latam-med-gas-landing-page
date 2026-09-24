// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import sanity from '@sanity/astro';

// astro.config.mjs runs in plain Node, so .env values must be loaded explicitly
// (import.meta.env inside components is populated by Vite separately).
const {
  PUBLIC_SANITY_PROJECT_ID,
  PUBLIC_SANITY_DATASET,
  PUBLIC_SANITY_PREVIEW,
  SANITY_VIEWER_TOKEN,
  PUBLIC_TURNSTILE_SITE_KEY,
} = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

// Sin esta clave el widget de Turnstile no se dibuja, el formulario no consigue token y la
// edge function rechaza todo envío: el formulario de contacto queda inservible. Es una variable
// que solo existe si alguien la dio de alta en el proyecto de Cloudflare, así que es justo el
// tipo de cosa que se olvida y que no se nota hasta que un cliente no puede escribir. Que falle
// aquí, ruidosamente, en vez de desplegar un formulario roto.
//
// **Son DOS Workers**, y este repositorio alimenta a los dos. Darla de alta solo en el de
// producción dejó el preview construyendo en rojo tres horas y media el 23/09, sirviendo una
// versión vieja sin que nadie lo notara: la guarda hizo su trabajo, pero las instrucciones
// nombraban un único destino.
if (!PUBLIC_TURNSTILE_SITE_KEY) {
  throw new Error(
    'Falta PUBLIC_TURNSTILE_SITE_KEY. El formulario de contacto la necesita para dibujar el ' +
      'widget de Turnstile y obtener el token que exige la edge function submit-lead.\n' +
      '  · Local: añádela a .env (clave de prueba: 1x00000000000000000000AA).\n' +
      '  · Cloudflare → Workers & Pages → Settings → Variables, en LOS DOS Workers que\n' +
      '    construyen este repositorio: el del sitio y el de la vista previa. La misma clave\n' +
      '    sirve para ambos; es pública y el widget ya tiene los dos dominios autorizados.',
  );
}

// The preview deployment is this same repository built with PUBLIC_SANITY_PREVIEW=true, as a
// second Cloudflare Worker. It renders on the server so a saved draft shows immediately, and it
// emits stega — invisible markers inside every string that tell the Presentation tool which
// field produced which text. Those markers cannot go anywhere near production: they would land
// inside the meta description, the JSON-LD and the tel: links.
//
// Everything below is a no-op when the flag is unset, so the production build is unchanged.
const isPreview = PUBLIC_SANITY_PREVIEW === 'true';

// El Studio se monta en desarrollo y en la vista previa, nunca en el sitio público. Iba en los
// tres: `/studio` respondía 200 en latammedgas.com y arrastraba ~9 MB de JavaScript —dos tercios
// del despliegue— para una superficie de administración que el cliente todavía no usa. No era
// una brecha, porque Sanity autentica, pero era peso muerto en cada build y una puerta de admin
// en el dominio con el que la empresa vende. Nada del sitio enlaza a /studio, así que quitarlo
// de producción no deja ningún enlace roto.
//
// Si algún día hace falta una URL estable para editar, `npx sanity deploy` la publica en
// <proyecto>.sanity.studio, hospedada por Sanity, sin que este repositorio cargue con ella.
const isProdBuild = (process.env.NODE_ENV ?? 'development') === 'production' && !isPreview;

// Imported dynamically rather than at the top: a static import would make the adapter a hard
// requirement of every build, including the static one that has no use for it.
const adapter = isPreview ? (await import('@astrojs/cloudflare')).default() : undefined;

if (isPreview && !SANITY_VIEWER_TOKEN) {
  throw new Error(
    'PUBLIC_SANITY_PREVIEW=true necesita SANITY_VIEWER_TOKEN. Sin token la vista previa lee ' +
      'solo contenido publicado, que es justo lo que no sirve para previsualizar.',
  );
}

// https://astro.build/config
export default defineConfig({
  site: 'https://latammedgas.com',
  output: isPreview ? 'server' : 'static',
  ...(adapter ? { adapter } : {}),
  // Canonicals and the sitemap have always emitted the trailing-slash form, but internal
  // links did not, so every in-site navigation paid a 307 — 1.4s on mobile. Setting this
  // makes the dev server 404 on the slashless form, so the mismatch shows up locally.
  trailingSlash: 'always',
  integrations: [
    react(),
    // The Studio is an admin surface behind auth and is disallowed in robots.txt — listing
    // it in the sitemap contradicts that and wastes crawl budget.
    sitemap({ filter: (page) => !page.includes('/studio') }),
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET || 'production',
      ...(isProdBuild ? {} : { studioBasePath: '/studio' }),
      // The site is fully static, so this client only runs at build time — read fresh from the
      // live API rather than the CDN, which otherwise serves a stale cached result for the
      // fixed query strings (getProjects etc.) until its TTL expires, so a rebuild after a
      // Sanity change could still ship the old content.
      useCdn: false,
      ...(isPreview
        ? {
            token: SANITY_VIEWER_TOKEN,
            // Drafts win over their published version, which is the whole point of a preview.
            perspective: 'drafts',
            // `enabled` is what actually turns the markers on; `studioUrl` only says where a
            // click should land. Setting the second without the first produces a preview that
            // looks right and cannot be clicked into.
            stega: { enabled: true, studioUrl: '/studio' },
          }
        : {}),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
