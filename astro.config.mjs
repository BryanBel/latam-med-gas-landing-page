// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import sanity from '@sanity/astro';

// astro.config.mjs runs in plain Node, so .env values must be loaded explicitly
// (import.meta.env inside components is populated by Vite separately).
const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = loadEnv(
  process.env.NODE_ENV ?? 'development',
  process.cwd(),
  '',
);

// https://astro.build/config
export default defineConfig({
  site: 'https://latammedgas.com',
  integrations: [
    react(),
    // The Studio is an admin surface behind auth and is disallowed in robots.txt — listing
    // it in the sitemap contradicts that and wastes crawl budget.
    sitemap({ filter: (page) => !page.includes('/studio') }),
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET || 'production',
      studioBasePath: '/studio',
      // The site is fully static, so this client only runs at build time — read fresh from the
      // live API rather than the CDN, which otherwise serves a stale cached result for the
      // fixed query strings (getProjects etc.) until its TTL expires, so a rebuild after a
      // Sanity change could still ship the old content.
      useCdn: false,
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
