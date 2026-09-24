# submit-lead

Receives the contact form, verifies a Cloudflare Turnstile token, and only then writes to
`public.leads` using the service role.

## Why it exists

The browser used to insert straight into PostgREST with the anon key. That key is public by
design — it ships in the site bundle — and the RLS policy allowed `insert` to `anon` with
`with check (true)`. Anyone could copy it and write rows.

That is worse than junk rows, because every insert fires the Database Webhook that emails
through Resend. **One unauthenticated POST equalled one email** to the company's working mailbox,
sent from `send.latammedgas.com`. Flooding it would have burned that subdomain's sending
reputation, and the subdomain exists specifically to keep the root domain's SPF intact for mail
people depend on.

`notify-lead`'s spam scoring bounds the volume. This function closes the door.

## How the pieces fit

```
browser  ──POST {lead, turnstileToken}──▶  submit-lead
                                              │
                                              ├─▶ challenges.cloudflare.com/siteverify
                                              │      (rejects ⇒ 403, nothing written)
                                              │
                                              └─▶ PostgREST, service role  ⇒  leads
                                                                               │
                                                             Database Webhook  ▼
                                                                          notify-lead
                                                                               │
                                                                    Resend  ───▶ inbox
```

`anon` has no insert policy any more (migration `20260923190000`), so this function is the only
way in. Service role bypasses RLS, which is the point.

## One-time setup

1. **Turnstile widget** — Cloudflare dashboard → Turnstile → Add widget.
   - Hostnames: `latammedgas.com`, the preview worker, and `localhost` for local work.
   - Mode: **Managed**. The client renders with `appearance: 'interaction-only'`, so the widget
     stays invisible unless Cloudflare decides a challenge is warranted. The old "Invisible"
     widget mode is deprecated in favour of exactly this combination — do not use it.
   - **Pre-clearance: off.** It would issue a `cf_clearance` cookie, and the privacy policy
     states the site sets no tracking cookies; Cloudflare Web Analytics was chosen precisely
     because it is cookieless, which is what saves us a consent banner. There are also no WAF
     rules here for pre-clearance to bypass, so it would be a cost with no benefit.

2. **Site key** (public, ships in the bundle) — `.env` as `PUBLIC_TURNSTILE_SITE_KEY`, and the
   same key in Cloudflare → Workers → `latam-med-gas-web` → Settings → Variables. Without it
   `astro.config.mjs` refuses to build, on purpose: absent, the widget never renders, the form
   never gets a token, and every submission is rejected — a contact form that looks fine and
   silently takes no leads.

3. **Secret key** — a Supabase secret, never in `.env` and never in the bundle:

   ```
   npx supabase secrets set TURNSTILE_SECRET_KEY=<secret> --project-ref xsdmvvsksddnvvclndvu
   ```

4. **Deploy:**

   ```
   npx supabase functions deploy submit-lead --project-ref xsdmvvsksddnvvclndvu --no-verify-jwt
   ```

   **`--no-verify-jwt` is required here too, for a different reason than `notify-lead`'s.** That
   one is called by a webhook that sends no `Authorization` header. This one is called by a
   browser — but this project's publishable key is the new `sb_publishable_` format, which is
   not a JWT, so the gateway would reject the call before it reached this code. Same invisible
   401, different cause. **The Turnstile token is this function's authentication**, not the
   project key.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected into every edge function; they do
not need to be set.

## Order matters when changing this

Deploy the function, then ship the frontend that calls it, then revoke `anon`'s insert. Revoking
first stops leads being recorded while the form still says "Gracias" — a failure with no visible
symptom. To roll back in a hurry, restore the policy:

```sql
create policy "anon can submit leads" on public.leads
  for insert to anon with check (true);
```

## Testing without sending email or writing rows

Cloudflare publishes test keys, so the whole path can be exercised before the real widget exists:

| Key                                   | Behaviour      |
| ------------------------------------- | -------------- |
| `1x00000000000000000000AA` (site)     | always passes  |
| `2x00000000000000000000AB` (site)     | always blocks  |
| `1x0000000000000000000000000000000AA` | secret, passes |
| `2x0000000000000000000000000000000AA` | secret, blocks |

Two probes that write nothing:

- **Which secret is live** — POST a garbage token with an invalid payload (an empty `name`).
  Turnstile is checked before the payload, so `403` means the real secret, `400` means a test
  one. Neither writes.
- **Is `anon` still locked out** — insert straight into PostgREST with the anon key. Expect
  `401` / `42501`.

Verifying the success path requires a real token, which only a browser produces. Submit the form
on the live site and confirm the email arrives.
