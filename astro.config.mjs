// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import sanity from '@sanity/astro';

// https://astro.build/config
export default defineConfig({
  site: 'https://latammedgas.com',
  integrations: [
    react(),
    sitemap(),
    sanity({
      projectId: process.env.PUBLIC_SANITY_PROJECT_ID || 'placeholder',
      dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
      studioBasePath: '/studio',
      useCdn: true,
    }),
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});