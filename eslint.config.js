// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['*.config.{js,mjs,ts}', 'scripts/**/*.{js,mjs,ts}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // `.sanity/` lo escribe `npx sanity dev` al arrancar el Studio suelto; es código
    // generado, no fuente.
    ignores: ['dist/', '.astro/', '.sanity/', 'node_modules/', 'supabase/functions/**'],
  },
];
