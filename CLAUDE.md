# Working on this project

Marketing site for Latam Med Gas USA LLC. **Live in production at https://latammedgas.com** since 2026-08-14. Nothing here is a prototype: real client, real traffic, and the domain carries the company's working email.

Project notes — task status, the DNS cutover runbook and the branding rationale — are kept outside this repository.

---

## Rules that have already cost time

**Never cancel the registrar's hosting.** The domain carries the company's live mailboxes. The site running on Cloudflare makes that hosting look redundant. It is not.

**Always deploy the edge function with `--no-verify-jwt`:**

```sh
npx supabase functions deploy notify-lead --project-ref xsdmvvsksddnvvclndvu --no-verify-jwt
```

Supabase puts a JWT gate in front of edge functions by default, and the Database Webhook that triggers this one sends no `Authorization` header. Without the flag every notification is rejected at the gateway with a 401 that never reaches the function and never surfaces as a failure. Auth is the `x-webhook-secret` header instead.

**Sanity content overrides the code.** Every section falls back to `src/lib/content.ts`, but a populated Sanity field always wins. A test value published in Studio once became the site's live `<meta name="description">`. When copy on the live site does not match `content.ts`, the answer is in Studio, not the code.

**In Sanity, Publish is what makes content live** — saving only updates a draft. The site is static, so a publish also needs a rebuild, which the GitHub workflow triggers automatically. Changes appear a couple of minutes later, not instantly.

**Run `git fetch` and rebase before every push.** That same Sanity workflow pushes empty rebuild commits, so `origin/master` moves without warning.

**Commits are authored solely as Bryan** (`bryanbelandriav@gmail.com`). No `Co-Authored-By`, no AI attribution anywhere in messages or PRs.

**Anything involving Resend goes on the `send.latammedgas.com` subdomain, never the root.** The root already publishes an SPF record for the company's mailboxes; a second SPF record there invalidates both and breaks mail people depend on.

## Design decisions that are settled

Do not revert these without being asked. They were deliberate choices, and at least one of them contradicts what a design skill will recommend:

- The **diagonal wedge** across every section seam, the **full-screen sections**, and the **alternating navy** stay, even though `design-taste-frontend`'s Page Theme Lock rule argues against the alternation.
- **Eyebrows are capped at 2** on the home page on purpose. Do not add one per section.
- **The bare domain is canonical**; `www` redirects to it. `astro.config.mjs` `site` reflects this and feeds the canonical tags, sitemap and OG URLs.
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
```

## Astro reference

- [Routing and pages](https://docs.astro.build/en/guides/routing/)
- [Components](https://docs.astro.build/en/basics/astro-components/)
- [Framework components / islands](https://docs.astro.build/en/guides/framework-components/)
- [Styling and Tailwind](https://docs.astro.build/en/guides/styling/)
