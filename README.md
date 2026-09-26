**English** | [Español](README.es.md)

# Latam Med Gas — Marketing Site

Site for **Latam Med Gas USA LLC**, a Miami company that inspects, designs, installs and verifies
medical gas systems for hospitals across Latin America, and trains their staff toward ASSE 6000
certification.

**Live at [latammedgas.com](https://latammedgas.com)** since August 2026 — a paying client, real
traffic, and a domain that also carries the company's working email. Nothing here is a prototype.

![The Latam Med Gas home page](docs/home.webp)

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

Analytics is Cloudflare Web Analytics, which sets no cookies. The contact map is an OpenStreetMap
embed, which sets none either and is disclosed in the privacy policy; Google Maps is only a link.
Turnstile loads from Cloudflare when the contact form is on screen. No third party sets a cookie,
so the site has no consent banner because there is nothing to consent to — not a banner that lies.

### Lead capture that cannot leak, and cannot be used as a mail cannon

Leads live in a Supabase `leads` table whose row-level security grants no `select`, `update` or
`delete` to anyone public — they are readable only from the Supabase dashboard.

Writing used to be open, though, and that mattered more than it looked. The browser inserted
straight into PostgREST with the anon key, which is public by design: it ships in the bundle.
Anyone could copy it and write rows — and since every row fires a webhook that sends an email,
**one unauthenticated POST equalled one email** to the company's working mailbox. The damage
was never junk rows; it was flooding that inbox and burning the sending reputation of
`send.latammedgas.com`.

So the browser no longer writes to the table at all. It posts to
[`submit-lead`](supabase/functions/submit-lead/), which verifies a Cloudflare Turnstile token
and only then inserts with the service role. `anon` has no insert policy any more, so that
function is the only way in. Turnstile tokens are single-use, the widget is reset before every
submission, and the function revalidates every field — whoever calls it has no obligation to
have come through our form.

Each insert fires a Database Webhook into [`notify-lead`](supabase/functions/notify-lead/),
which emails through Resend from a verified **subdomain** (`send.latammedgas.com`): the root
already publishes an SPF record for the company mailboxes, and a second SPF record there would
invalidate both and break mail people depend on. That function scores spam signals rather than
counting volume, so a real enquiry that happens to include a link still gets delivered, while
the row is stored either way — a false positive costs a notification, never a lead.

### Type scale in one place

A 9-step scale and one documented corner-radius rule live in
[`src/styles/global.css`](src/styles/global.css). Components use `text-sm` / `text-2xl`, never
arbitrary pixel values. When the body size needed to go from 15 px to 16 px for readability, it
was a four-token change that lifted the whole site at once.

## Stack

| Layer         | Choice                                                                 | Why                                                                                                          |
| ------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Framework     | [Astro](https://astro.build), static output                            | Ships zero JS by default; only what needs interactivity hydrates                                             |
| Interactivity | [React](https://react.dev) islands                                     | On the public pages, exactly one ([`ContactForm.tsx`](src/components/ContactForm.tsx)); the rest is `.astro` |
| Styling       | [Tailwind CSS v4](https://tailwindcss.com)                             | Design tokens centralized in [`global.css`](src/styles/global.css)                                           |
| CMS           | [Sanity](https://sanity.io), Studio embedded at `/studio`              | Client edits on the deployed site; no separate CMS host to run or pay for                                    |
| Backend       | [Supabase](https://supabase.com)                                       | Contact leads only; nothing public may read or write the table — writes go through an edge function          |
| Bot defence   | [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) | Invisible unless challenged; its token is what authorises a lead write                                       |
| Hosting       | [Cloudflare Workers](https://workers.cloudflare.com)                   | Free tier, git-push deploys, global CDN                                                                      |
| Language      | TypeScript, strict                                                     | `astro check` runs clean across the project                                                                  |

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
│   │   └── leads.ts           # Contact form → submit-lead edge function
│   ├── pages/                 # index, nosotros, servicios, cursos, trayectoria, contacto, privacidad, 404
│   ├── sanity/schemaTypes/    # Content model
│   ├── scripts/site.ts        # All client interactions; re-runs on astro:page-load
│   └── styles/global.css      # Design tokens, keyframes
└── supabase/
    ├── functions/submit-lead/ # Edge function: Turnstile check → insert (service role)
    ├── functions/notify-lead/ # Edge function: webhook → branded email, spam-scored
    └── migrations/            # `leads` table, length limits, anon policy and grants revoked
```

## Getting started

```sh
pnpm install
cp .env.example .env   # Sanity + Supabase values, and PUBLIC_TURNSTILE_SITE_KEY or it won't start
pnpm dev               # http://localhost:4321
```

| Variable                    | Where to get it                                                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_SANITY_PROJECT_ID`  | [sanity.io/manage](https://sanity.io/manage) → your project                                                                                                     |
| `PUBLIC_SANITY_DATASET`     | Usually `production`                                                                                                                                            |
| `PUBLIC_SUPABASE_URL`       | [supabase.com/dashboard](https://supabase.com/dashboard) → Project Settings → API                                                                               |
| `PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare → Turnstile → your widget. Public, ships in the bundle. **The build fails without it**, on purpose: absent, the contact form silently takes no leads |
| `PUBLIC_CF_BEACON_TOKEN`    | Cloudflare → Web Analytics. Public identifier, not a secret. Leave blank locally so dev traffic stays out of the data                                           |

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

One trap that is easy to walk into from the Studio: collection fallbacks fire only when a
type is **entirely empty** (`courses.length > 0 ? courses : DEFAULT_COURSES`). Creating one
course in a type that had none would have replaced ten rendered courses with one. Every
collection with a seed is populated now, so the seed is a genuine last resort rather than a live
dependency. Testimonials have no seed: with none published, that section simply does not render.

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
3. **Both edge functions need `--no-verify-jwt`**, for different reasons. `notify-lead` is
   called by a Database Webhook that sends no `Authorization` header. `submit-lead` is called
   by a browser that sends no key and no `Authorization` header at all, so the gateway would
   reject it before it reached the code. Either way the
   failure is an invisible 401 that never surfaces as a broken form. See
   [`submit-lead`](supabase/functions/submit-lead/README.md) and
   [`notify-lead`](supabase/functions/notify-lead/README.md).
4. **Supabase migrations must be named with a 14-digit timestamp.** The CLI lists any other
   name and then skips it, and `db push` answers "Remote database is up to date" without
   having applied anything.
5. **Before every push** — `git fetch` and rebase. The Sanity rebuild workflow pushes empty
   commits, so `origin/master` moves without warning.
6. **Content backups** — `pnpm backup` snapshots the dataset into `../sanity-backups`, which is
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
| `PUBLIC_SANITY_PREVIEW_ORIGIN` | optional; defaults to the preview Worker's workers.dev URL     |

With the flag set, `astro build` switches to `output: 'server'` and pulls in the Cloudflare
adapter; without it the build is byte-identical to what it was before any of this existed.

Two things worth knowing before touching it:

- The adapter (`^14.3`) only loads when `PUBLIC_SANITY_PREVIEW=true`. From 14.3.0 it imports
  `renderForPrerender` from `astro/app`, which only exists from astro 7.3, so Astro cannot go
  back below 7.3 without taking the adapter with it.
- The preview Worker is **public**: it is not behind the Cloudflare Access gate that covers
  latammedgas.com, it renders drafts, and its contact form writes real leads.
- `SANITY_VIEWER_TOKEN` is read at build time and lands in the preview's **server** bundle. It
  is never in the client bundle, but it is in a build artefact, which is why it should be a
  read-only token and never the one with write access.
