**English** | [Español](README.es.md)

# Latam Med Gas — Landing Page

Marketing site for **Latam Med Gas USA LLC**, a Miami-based provider of medical gas system inspection, design, maintenance, and ASSE 6000 / NFPA 99 certification training for hospitals and clinics across Latin America.

**Live at [latammedgas.com](https://latammedgas.com)** since August 2026, with the client's real branding, photography and contact details in place.

## Stack

| Layer         | Choice                                                    | Why                                                                                                                                                                          |
| ------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework     | [Astro](https://astro.build) (static output)              | Ships zero JS by default; only the parts that need interactivity hydrate                                                                                                     |
| Interactivity | [React](https://react.dev) islands                        | Used in exactly one place ([`ContactForm.tsx`](src/components/ContactForm.tsx)) — everything else is plain `.astro`                                                          |
| Styling       | [Tailwind CSS v4](https://tailwindcss.com)                | Design tokens (`--color-ink`, `--color-accent*`) centralized in [`src/styles/global.css`](src/styles/global.css) so swapping in real brand colors later is a one-file change |
| CMS           | [Sanity](https://sanity.io), embedded Studio at `/studio` | Client edits content directly on the deployed site — no separate CMS host to manage or pay for                                                                               |
| Backend       | [Supabase](https://supabase.com)                          | Contact form leads only, insert-only RLS policy — no read access from the client                                                                                             |
| Hosting       | [Cloudflare Workers](https://workers.cloudflare.com)      | Free tier, git-push deploys, global CDN                                                                                                                                      |
| DNS           | Cloudflare                                                | Registrar unchanged; it also hosts the company mailboxes                                                                                                    |
| Language      | TypeScript (strict)                                       | `astro check` runs clean across the whole project                                                                                                                            |

## Features

- **CMS-driven with safe fallback** — every section (hero, services, certifications, projects) fetches from Sanity at build time and falls back to seed copy in [`src/lib/content.ts`](src/lib/content.ts) if the CMS is empty or unreachable, so the site never ships blank.
- **Tokenized design system** — a 9-step type scale and one documented corner-radius rule live in [`src/styles/global.css`](src/styles/global.css); components use `text-sm` / `text-2xl`, never arbitrary pixel values, so typography can only change in one place.
- **Spam-guarded lead capture** — the contact form uses a honeypot field and Supabase row-level security that only allows `insert`, never `select`/`update`/`delete`, from the public anon key.
- **Accessible by audit, not by assumption** — the site was reviewed against the Web Interface Guidelines and fixed: a real `<button>` mobile menu with `aria-expanded` and Escape-to-close (the earlier CSS-only version was unreachable by keyboard), `tel:`/`mailto:` links, dimensioned images, an eager LCP image, inline form errors announced via `aria-live`, a skip link, and visible focus rings throughout.
- **Spanish content, inherited technical vocabulary** — copy is in Spanish for the LATAM audience; industry terms (ASSE, NFPA, DISS, CGA) stay untranslated since that's how the industry refers to them.

## Project Structure

```text
.
├── astro.config.mjs          # Astro + React + Tailwind + Sanity integration wiring
├── sanity.config.ts           # Embedded Sanity Studio config (schemas, plugins)
├── src/
│   ├── components/            # Astro sections (Header, Hero, Services, ...) + ContactForm.tsx (the one React island)
│   ├── layouts/Layout.astro   # <head>, fonts, SEO/OG meta
│   ├── lib/
│   │   ├── content.ts          # Seed/fallback copy, sourced from client-assets/
│   │   ├── sanityQueries.ts    # Typed GROQ fetchers used at build time
│   │   └── supabase.ts         # Supabase client (anon key)
│   ├── sanity/schemaTypes/    # CMS content model (siteSettings, heroSection, service, certification, project, testimonial)
│   └── pages/index.astro      # Assembles all sections
└── supabase/migrations/       # SQL migration for the `leads` table + RLS policy
```

## Getting Started

```sh
pnpm install
cp .env.example .env   # fill in Sanity + Supabase credentials, see below
pnpm dev                # http://localhost:4321
```

### Environment variables

| Variable                   | Where to get it                                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_SANITY_PROJECT_ID` | [sanity.io/manage](https://sanity.io/manage) → your project                                                                              |
| `PUBLIC_SANITY_DATASET`    | Usually `production`                                                                                                                     |
| `PUBLIC_SUPABASE_URL`      | [supabase.com/dashboard](https://supabase.com/dashboard) → Project Settings → API                                                        |
| `PUBLIC_SUPABASE_ANON_KEY` | Same page — the public/anon key, never the service role key                                                                              |
| `PUBLIC_CF_BEACON_TOKEN`   | Cloudflare → Analytics & Logs → Web Analytics. Public identifier, not a secret. Leave blank locally so dev traffic stays out of the data |

## Scripts

| Command            | Action                                                     |
| ------------------ | ---------------------------------------------------------- |
| `pnpm dev`         | Start the local dev server                                 |
| `pnpm build`       | Build the static site to `./dist/`                         |
| `pnpm preview`     | Preview the production build locally                       |
| `pnpm astro check` | Type-check the whole project                               |
| `pnpm lint`        | ESLint (flat config: JS + TypeScript + Astro rules)        |
| `pnpm format`      | Prettier, with Tailwind class sorting and `.astro` support |

## Editing Content

Content editors log into `/studio` on the deployed site — no code, no git, no local setup. The content model lives in [`src/sanity/schemaTypes/`](src/sanity/schemaTypes/):

- **Site Settings** — name, tagline, phone, email, address, socials
- **Hero Section** — headline, subheading, CTA
- **Service** — the services grid (title, description, order)
- **Certification** — ASSE/NFPA credential cards
- **Project** — client case studies
- **Testimonial** — quotes (not yet wired into a page section)

## Contact Form → Leads

Submissions insert directly into a Supabase `leads` table ([migration](supabase/migrations/0001_create_leads.sql)) from the browser using the public anon key. Row-level security restricts the anon role to `insert` only — leads can only be read from the Supabase dashboard, never from the public site. A hidden honeypot field filters out basic bots before any request is sent.

Each insert fires a Supabase Database Webhook into the [`notify-lead`](supabase/functions/notify-lead/) edge function, which emails the company via Resend. It sends from a verified subdomain (`send.latammedgas.com`) so the notification reaches the inbox rather than spam, and the subdomain matters: the root domain already publishes an SPF record for the company mailboxes, and a second one there would invalidate both.

## Deployment

1. **Cloudflare Workers** — the repo is connected; build command `pnpm build`, output `dist`. Push to `master` to deploy. `wrangler.jsonc` sets `not_found_handling: "404-page"`, without which unknown paths return an empty 404 instead of the styled page.
2. **Domain** — done. Nameservers point at Cloudflare and Custom Domains are attached for the apex and `www`. See [`docs/guides/cutover.md`](docs/guides/cutover.md) for the runbook and the traps it surfaced.
3. **Environment variables** — set the same keys from `.env` in the Cloudflare project settings, including `PUBLIC_CF_BEACON_TOKEN`. A missing beacon token builds without analytics and without an error.
4. **Lead notifications** — the Supabase Edge Function must be deployed with `--no-verify-jwt`, or the Database Webhook is rejected before reaching it. See [`supabase/functions/notify-lead/README.md`](supabase/functions/notify-lead/README.md).
