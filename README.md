**English** | [Español](README.es.md)

# Latam Med Gas — Marketing Site

Site for **Latam Med Gas USA LLC**, a Miami company that inspects, designs, installs and verifies
medical gas systems for hospitals across Latin America, and trains their staff toward ASSE 6000
certification.

**Live at [latammedgas.com](https://latammedgas.com)** since August 2026 — a paying client, real
traffic, and a domain that also carries the company's working email. Nothing here is a prototype.

## Measured

Lighthouse, mobile profile, against production. All six pages:

|                | Home | Servicios | Nosotros | Cursos | Trayectoria | Contacto |
| -------------- | ---- | --------- | -------- | ------ | ----------- | -------- |
| Performance    | 90   | 98        | 96       | 97     | 97          | 97       |
| Accessibility  | 100  | 100       | 100      | 100    | 100         | 100      |
| Best Practices | 100  | 100       | 100      | 100    | 100         | 100      |
| SEO            | 100  | 100       | 100      | 100    | 100         | 100      |

**Total Blocking Time 0 ms. Cumulative Layout Shift 0.** LCP 2.1–2.5 s.

Those numbers are the result of three fixes, each of which had been invisible because the site
looked fine in all three cases:

- The seed photos were reaching browsers as raw PNGs — `sharp` was never installed, so Astro's
  image service passed them straight through without ever erroring. The hero alone was 1.1 MB.
- Canonical URLs used the trailing-slash form but internal links did not, so every in-site
  navigation spent a 307 redirect — 1.4 s on mobile — before the page began loading.
- `/contacto` scored 92 on accessibility because the contact rows nested `<dt>` and `<dd>` two
  divs deep inside the `<dl>`, which breaks the label/value pairing for screen readers.

## Engineering decisions

### Content the client edits without a deploy, and a site that never ships blank

Every section reads from Sanity at build time and falls back to seed copy in
[`src/lib/content.ts`](src/lib/content.ts) when a document type is empty. The client edits at
`/studio` on the deployed site; a webhook triggers a rebuild. No CMS host to run, no git, no
handover friction.

The tradeoff is real and worth stating: content then lives in two places, and **a populated Sanity
document always beats the seed**. Editing the seed alone changes nothing on a live site whose CMS
is already filled — which is exactly how a stale hero CTA survived a restructure here, pointing at
an anchor that no longer existed. The scripts under [`scripts/`](scripts/) exist to patch the
dataset when that happens.

### Images: 1.1 MB → 26 KB

Local seed photos go through `astro:assets`, not a bare URL: WebP, a three-width srcset, and a
crop to the ratio the CSS box actually shows — these are portrait source images in landscape
boxes, so `object-cover` was discarding close to half of every one. Sanity images keep using
Sanity's own derivatives. No PNG is referenced from the built HTML.

### Accessibility verified, not assumed

100 on every page, reached by auditing and fixing rather than by declaring it. A real `<button>`
mobile menu with `aria-expanded` and Escape-to-close (the earlier CSS-only version was
unreachable by keyboard), `tel:`/`mailto:` links, dimensioned images, an eager LCP image, inline
form errors announced through `aria-live`, a skip link, and visible focus rings throughout.
Motion respects `prefers-reduced-motion`; the card tilt filters on `pointerType` per event rather
than on a media query, because a touchscreen laptop with a mouse attached matches
`pointer: coarse` and would otherwise lose the effect entirely.

### Privacy without a cookie banner

Analytics is Cloudflare Web Analytics, which sets no cookies. The contact page links out to Google
Maps behind a static card instead of embedding an iframe, so no third party is contacted before a
visitor asks for it. The result is a site with no consent banner, because there is nothing to
consent to — not a banner that lies.

### Lead capture that cannot leak

The form inserts into a Supabase `leads` table using the public anon key, with row-level security
that permits `insert` and nothing else — no `select`, `update` or `delete`. Leads are readable
only from the Supabase dashboard. A honeypot field filters basic bots before any request is sent.

Each insert fires a Database Webhook into the [`notify-lead`](supabase/functions/notify-lead/)
edge function, which emails the company through Resend. It sends from a verified **subdomain**
(`send.latammedgas.com`): the root domain already publishes an SPF record for the company
mailboxes, and a second SPF record there would invalidate both and break mail people depend on.

### Type scale in one place

A 9-step scale and one documented corner-radius rule live in
[`src/styles/global.css`](src/styles/global.css). Components use `text-sm` / `text-2xl`, never
arbitrary pixel values. When the body size needed to go from 15 px to 16 px for readability, it
was a four-token change that lifted the whole site at once.

## Stack

| Layer         | Choice                                                    | Why                                                                                                   |
| ------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Framework     | [Astro](https://astro.build), static output               | Ships zero JS by default; only what needs interactivity hydrates                                      |
| Interactivity | [React](https://react.dev) islands                        | Exactly one ([`ContactForm.tsx`](src/components/ContactForm.tsx)) — everything else is plain `.astro` |
| Styling       | [Tailwind CSS v4](https://tailwindcss.com)                | Design tokens centralized in [`global.css`](src/styles/global.css)                                    |
| CMS           | [Sanity](https://sanity.io), Studio embedded at `/studio` | Client edits on the deployed site; no separate CMS host to run or pay for                             |
| Backend       | [Supabase](https://supabase.com)                          | Contact leads only, insert-only RLS                                                                   |
| Hosting       | [Cloudflare Workers](https://workers.cloudflare.com)      | Free tier, git-push deploys, global CDN                                                               |
| Language      | TypeScript, strict                                        | `astro check` runs clean across the project                                                           |

## Project structure

```text
.
├── astro.config.mjs           # Astro + React + Tailwind + Sanity wiring; trailingSlash: 'always'
├── sanity.config.ts           # Embedded Studio config
├── scripts/                   # One-off Sanity migrations, run with `npx sanity exec`
├── src/
│   ├── components/            # Astro sections + ContactForm.tsx, the one React island
│   ├── layouts/Layout.astro   # <head>, fonts, SEO/OG meta, JSON-LD
│   ├── lib/
│   │   ├── content.ts         # Seed/fallback copy
│   │   ├── sanityQueries.ts   # Typed GROQ fetchers, build time
│   │   └── supabase.ts        # Supabase client, anon key
│   ├── pages/                 # index, nosotros, servicios, cursos, trayectoria, contacto, privacidad, 404
│   ├── sanity/schemaTypes/    # Content model
│   ├── scripts/site.ts        # All client interactions; re-runs on astro:page-load
│   └── styles/global.css      # Design tokens, keyframes
└── supabase/
    ├── functions/notify-lead/ # Edge function: webhook → branded email
    └── migrations/            # `leads` table + RLS policy
```

## Getting started

```sh
pnpm install
cp .env.example .env   # fill in Sanity + Supabase values
pnpm dev               # http://localhost:4321
```

| Variable                   | Where to get it                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_SANITY_PROJECT_ID` | [sanity.io/manage](https://sanity.io/manage) → your project                                                           |
| `PUBLIC_SANITY_DATASET`    | Usually `production`                                                                                                  |
| `PUBLIC_SUPABASE_URL`      | [supabase.com/dashboard](https://supabase.com/dashboard) → Project Settings → API                                     |
| `PUBLIC_SUPABASE_ANON_KEY` | Same page — the anon key, never the service role key                                                                  |
| `PUBLIC_CF_BEACON_TOKEN`   | Cloudflare → Web Analytics. Public identifier, not a secret. Leave blank locally so dev traffic stays out of the data |

| Command            | Action                                               |
| ------------------ | ---------------------------------------------------- |
| `pnpm dev`         | Local dev server                                     |
| `pnpm build`       | Static build to `./dist/`                            |
| `pnpm preview`     | Serve the production build                           |
| `pnpm astro check` | Type-check                                           |
| `pnpm lint`        | ESLint (JS + TypeScript + Astro)                     |
| `pnpm format`      | Prettier, Tailwind class sorting, `.astro` support   |
| `pnpm backup`      | Snapshot the Sanity dataset into `../sanity-backups` |

## Editing content

Editors log into `/studio` on the deployed site — no code, no git, no local setup. The model lives
in [`src/sanity/schemaTypes/`](src/sanity/schemaTypes/): site settings, hero, services,
certifications, courses, projects, testimonials.

A second one, which is easy to walk into from the Studio: collection fallbacks fire only when a
type is **entirely empty** (`courses.length > 0 ? courses : DEFAULT_COURSES`). Creating one
course in a type that had none would have replaced ten rendered courses with one. Every
collection is populated now, so the seed is a genuine last resort rather than a live dependency.

One rule for anyone scripting against the dataset: **never give a Sanity document an `_id`
containing a dot.** Sanity treats those as private and serves them only to authenticated requests,
so the public API — which the build uses — sees nothing. Thirteen imported projects were invisible
for a month that way, and the seed fallback rendered the same thirteen, so nothing looked wrong.

## Deployment

1. **Cloudflare Workers** — repo connected; build `pnpm build`, output `dist`. Push to `master`.
   `wrangler.jsonc` sets `not_found_handling: "404-page"`, without which unknown paths return an
   empty 404 instead of the styled one.
2. **Environment variables** — set the same keys in the Cloudflare project settings. A missing
   beacon token builds without analytics and without an error.
3. **Lead notifications** — the edge function must be deployed with `--no-verify-jwt`, or the
   Database Webhook is rejected before reaching it. See
   [`supabase/functions/notify-lead/README.md`](supabase/functions/notify-lead/README.md).
4. **Before every push** — `git fetch` and rebase. The Sanity rebuild workflow pushes empty
   commits, so `origin/master` moves without warning.
5. **Content backups** — `pnpm backup` snapshots the dataset into `../sanity-backups`, which is
   [a private repository](https://github.com/BryanBel/latam-med-gas-sanity-backups) outside this
   one, with a scheduled job of its own that runs the same snapshot daily. Document history on the current Sanity plan is short: on
   2026-09-20 the oldest transaction still held for `siteSettings` was from the previous day,
   though the document was created on 2026-08-09. Run it before any migration script.

### The preview deployment

Visual editing — click a heading on the page, land on that field in the Studio — needs the
rendered HTML to carry stega: invisible markers inside every string saying which field produced
it. Those markers cannot go near production, because they end up inside the meta description,
the JSON-LD and the `tel:` links. So preview is a **second Cloudflare Worker** built from this
same repository, and the whole difference is three environment variables:

| Variable                       | Value                                                          |
| ------------------------------ | -------------------------------------------------------------- |
| `PUBLIC_SANITY_PREVIEW`        | `true`                                                         |
| `SANITY_VIEWER_TOKEN`          | a Sanity token with the **viewer** role, from sanity.io/manage |
| `PUBLIC_SANITY_PREVIEW_ORIGIN` | set on the **production** project, to the preview Worker's URL |

With the flag set, `astro build` switches to `output: 'server'` and pulls in the Cloudflare
adapter; without it the build is byte-identical to what it was before any of this existed.

Two things worth knowing before touching it:

- The adapter is pinned to **14.2.6**. From 14.3.0 it imports `renderForPrerender` from
  `astro/app`, which `astro@7.2.0` does not export. Upgrading the adapter means upgrading Astro,
  which is the framework that builds the live site — not a trade worth making for a preview.
- `SANITY_VIEWER_TOKEN` is read at build time and lands in the preview's **server** bundle. It
  is never in the client bundle, but it is in a build artefact, which is why it should be a
  read-only token and never the one with write access.
