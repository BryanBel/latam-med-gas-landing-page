// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import sanity from '@sanity/astro';

// astro.config.mjs runs in plain Node, so .env values must be loaded explicitly
// (import.meta.env inside components is populated by Vite separately).
const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  site: 'https://latammedgas.com',
  integrations: [
    react(),
    sitemap(),
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET || 'production',
      studioBasePath: '/studio',
      useCdn: true,
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
