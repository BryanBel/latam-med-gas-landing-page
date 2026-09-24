# Working on this project

Marketing site for Latam Med Gas USA LLC. **Live in production at https://latammedgas.com** since 2026-08-14. Nothing here is a prototype: real client, real traffic, and the domain carries the company's working email.

Project notes — task status, the DNS cutover runbook and the branding rationale — are kept outside this repository.

---

## Rules that have already cost time

**Never cancel the registrar's hosting.** The domain carries the company's live mailboxes. The site running on Cloudflare makes that hosting look redundant. It is not.

**Always deploy edge functions with `--no-verify-jwt` — both of them, for different reasons:**

```sh
npx supabase functions deploy notify-lead --project-ref xsdmvvsksddnvvclndvu --no-verify-jwt
npx supabase functions deploy submit-lead --project-ref xsdmvvsksddnvvclndvu --no-verify-jwt
```

Supabase puts a JWT gate in front of edge functions by default. `notify-lead` is triggered by a Database Webhook that sends no `Authorization` header. `submit-lead` is called by a browser, but this project's publishable key is the new `sb_publishable_` format, which is not a JWT, so the gateway rejects it too. Either way the call is refused at the gateway with a 401 that never reaches the function and never surfaces as a failure. Auth is the `x-webhook-secret` header for the first and the Turnstile token for the second.

**Supabase migrations must be named `<14-digit timestamp>_name.sql`.** The CLI lists any other name in `migration list` and then skips it, so `db push` reports "Remote database is up to date" without having applied anything. `0001_`/`0002_` prefixes looked fine and did nothing for a month.

**Never let `anon` write to `leads` again.** Every insert fires the webhook that emails the client, so one unauthenticated POST equals one email to the company's working mailbox, from `send.latammedgas.com`. Writes go through `submit-lead`, which checks a Turnstile token and inserts with the service role. If that path ever has to be rolled back, restore the policy first and revert the frontend second — never leave the form pointing at a function that cannot write, because it still says "Gracias" while losing every lead.

**Revoking a policy is not revoking a grant.** `20260923190000` dropped the RLS policy and stopped there, so for a day `anon` and `authenticated` still held INSERT, SELECT, UPDATE, DELETE, TRUNCATE and REFERENCES on `public.leads` — Supabase grants those by default to everything created in the public schema. Nothing was exploitable, because RLS with zero policies denies regardless, but the whole defence hung on one flag: disable RLS to debug something, or add a permissive policy later for another purpose, and a key that ships in the bundle can empty the customer table. `20260924030000` revokes them. When locking a table down, check `information_schema.role_table_grants`, not just `pg_policies`, and never revoke from `service_role` — the edge function writes with it.

**`PUBLIC_TURNSTILE_SITE_KEY` must be set on BOTH Cloudflare Workers**, or `astro.config.mjs` fails the build on purpose. Absent, the widget never renders and the contact form silently takes nothing.

This repository feeds two Workers — the live site and the preview deployment — so every build variable has to be added twice. Setting this one on production only left preview failing every build for three and a half hours on 2026-09-23 while it served a stale copy. Same key both places; it is public, and the Turnstile widget already lists both hostnames.

**Cloudflare's git hook does not always fire.** The same day, a pushed commit simply never appeared in the Worker's deployment list. "Retry build" does not help — it rebuilds the commit that already ran, which is an older one. Push another commit, which is what the Sanity rebuild workflow does anyway.

**Sanity content overrides the code.** Every section falls back to `src/lib/content.ts`, but a populated Sanity field always wins. A test value published in Studio once became the site's live `<meta name="description">`. When copy on the live site does not match `content.ts`, the answer is in Studio, not the code.

**The Studio is served from the site itself, at `/studio`, and stays there.** Taking it out of the production build was tried on 2026-09-24 — it is ~9 MB of JavaScript, two thirds of the deploy — and reverted the same day: the client edits through that address and `latammedgas.com/studio` reads as more theirs than a `sanity.studio` URL. The weight is deploy size, not visitor cost, since nobody browsing the site ever downloads it, and Sanity asks for credentials before showing anything. It is `Disallow`ed in `robots.txt` and filtered out of the sitemap. If the deploy size ever has to come down, `npx sanity deploy` hosts a Studio at `<project>.sanity.studio` — but that trades away the URL, which is the whole reason it is here.

**The Studio does not run under `astro dev`. Edit through `npx sanity dev` instead**, which serves it on `localhost:3333` from Sanity's own CLI and its own Vite config. `localhost:4321/studio/` loads the HTML and then renders a blank page.

The cause is not fixable from this repository. Vite 8 pre-bundles dependencies with Rolldown, which resolves every import against the package's `exports` map, and `sanity/lib/structure.js` re-exports symbols — `CommandList`, `ContextMenuButton`, `DEFAULT_STUDIO_CLIENT_OPTIONS` and others — that `sanity`'s own `package.json` does not declare. Optimization aborts with a few hundred `MISSING_EXPORT` errors and the island never hydrates.

Three things were tried on 2026-09-24 and none worked, so do not spend the afternoon again:

- **Upgrading Sanity.** 6.9.1 → 6.16.0 fails identically; the package still under-declares its own exports.
- **`optimizeDeps.exclude` on the Sanity packages.** Takes it from ~469 optimizer errors to one runtime `SyntaxError`, then to the next one. Whack-a-mole.
- **Downgrading Vite.** Not available: `astro@7.3.4` depends on `vite@^8.0.13`, and going back to astro 7.2 reopens the critical AVIF remote-code-execution advisory closed the same day.

**Production is unaffected** and always was — the build bundles from source rather than pre-bundling dependencies, so `latammedgas.com/studio/` works and `pnpm build` has never failed on this.

**The Studio needs its origin in Sanity's CORS allowlist.** Until 2026-09-24 the only entry was `http://localhost:3333`, which is why the standalone CLI was the only place it had ever run — `latammedgas.com/studio/` would have shown the client a blank page. `http://localhost:4321`, `https://latammedgas.com` and the preview Worker are now allowed, all with `--credentials` because the Studio authenticates by cookie. Check with `npx sanity cors list` before concluding the Studio is broken.

**In Sanity, Publish is what makes content live** — saving only updates a draft. The site is static, so a publish also needs a rebuild, which the GitHub workflow triggers automatically. Changes appear a couple of minutes later, not instantly.

**Run `git fetch` and rebase before every push.** That same Sanity workflow pushes empty rebuild commits, so `origin/master` moves without warning.

**Commits are authored solely as Bryan** (`bryanbelandriav@gmail.com`). No `Co-Authored-By`, no AI attribution anywhere in messages or PRs.

**Anything involving Resend goes on the `send.latammedgas.com` subdomain, never the root.** The root already publishes an SPF record for the company's mailboxes; a second SPF record there invalidates both and breaks mail people depend on.

## Design decisions that are settled

Do not revert these without being asked. They were deliberate choices, and at least one of them contradicts what a design skill will recommend:

- The **diagonal wedge** across every section seam, the **full-screen sections**, and the **alternating navy** stay, even though `design-taste-frontend`'s Page Theme Lock rule argues against the alternation.
- **Eyebrows are capped at 2** on the home page on purpose. Do not add one per section.
- **The bare domain is canonical.** `astro.config.mjs` `site` reflects this and feeds the canonical tags, sitemap and OG URLs. Note that `www` does **not** redirect — it serves the same site at 200. Both copies emit a canonical pointing at the bare domain, so search engines consolidate them and the practical SEO cost is nil, but this file claimed a redirect that has never existed. A Cloudflare redirect rule would make it true; until then, do not assume it.
- **Type scale and shape system are tokenized** in `src/styles/global.css`. Use `text-sm` / `text-2xl` etc., never arbitrary `text-[15px]`. Interactive elements are fully round, surfaces 16px, nested elements 8px.
- The client has delegated visual judgment to Bryan, so design choices do not need client sign-off.

## Verifying changes

Production is the fastest check now that the site is live:

```sh
curl -sS https://latammedgas.com | grep -o '<title>[^<]*</title>'
```

For local work, `astro preview` on port 4322 via `C:\dev\.claude\launch.json`. Port 4321 often holds a stale dev server from an earlier session.

The in-app Browser pane has quirks worth knowing: it does not composite unless displayed (screenshots time out, `innerWidth` is 0 — use `resize_window` with explicit dimensions and assert via DOM), `document.visibilityState` is `hidden` so `client:visible` islands never hydrate, and plain reloads serve cached HTML — use `location.replace('/?v='+Date.now())`.

## Commands

```sh
pnpm dev            # local dev server
pnpm build          # static build to ./dist
npx astro check     # types, expect 0/0/0
pnpm exec eslint .  # lint
pnpm exec prettier --write <files>
pnpm backup         # snapshot the Sanity dataset to ../sanity-backups
```

Reading the leads table — `anon` can neither select nor insert, so this is the way in:

```sh
npx supabase db query "select count(*) from public.leads" --linked --project-ref xsdmvvsksddnvvclndvu
```

`--project-ref` requires `--linked`; on its own it errors. Rows hold real customer contact
details once the site starts converting, so select the columns you need rather than `*`, and
look before deleting anything.

## Astro reference

- [Routing and pages](https://docs.astro.build/en/guides/routing/)
- [Components](https://docs.astro.build/en/basics/astro-components/)
- [Framework components / islands](https://docs.astro.build/en/guides/framework-components/)
- [Styling and Tailwind](https://docs.astro.build/en/guides/styling/)
