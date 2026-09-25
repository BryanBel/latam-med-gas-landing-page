# notify-lead

Emails the company every time a row lands in `public.leads`, unless the row scores as spam.

Recipient is the `LEAD_NOTIFY_EMAIL` secret, today `administracion@latammedgas.com` — the
client's own inbox. It was `bryanbelandriav@gmail.com` while none existed, and this file still
said so long after the secret had moved on. Worth remembering before trusting a recipient
written down anywhere other than the secret itself.

Rows reach `leads` through [`submit-lead`](../submit-lead/), which is now the only way in:
`anon` lost its insert policy in migration `20260923190000`.

## Spam scoring

Every insert fires this function and this function sends an email, so anyone able to write rows
could flood the company's mailbox and burn the sending reputation of `send.latammedgas.com`.
Turnstile stops that at the door now; this is the second bound, and it stays because defence in
depth is cheap here.

It scores signals rather than counting volume. An hourly cap would also stop a flood, but it
would silence the legitimate customer who writes during one. Scoring lets them through: a real
enquiry that happens to link their hospital's site scores 1 and is delivered, while a link plus
a spam keyword, or a non-Latin alphabet, scores 2 and is held. **The row is always stored** —
this only decides whether anyone is told — so a false positive costs a notification, never a
lead. Held rows are logged with their score and the reasons.

## One-time setup

1. **Resend account** — [resend.com](https://resend.com), with `send.latammedgas.com` verified
   as the sending domain. That verification is what lets the function send to any recipient:
   until a domain is verified, Resend's sandbox only delivers to the account's own address.
   Grab an API key from Resend → API Keys.

   The sending domain is a **subdomain** on purpose. The root already publishes an SPF record
   for the company mailboxes, and a second SPF record there would invalidate both and break
   mail people depend on.

2. **Deploy the function** — this must happen _before_ the webhook below, or the
   dashboard's edge function dropdown shows "No edge functions created yet":

   ```
   npx supabase login
   npx supabase functions deploy notify-lead --project-ref xsdmvvsksddnvvclndvu --no-verify-jwt
   ```

   **`--no-verify-jwt` is required, not optional.** By default Supabase puts a JWT gate in
   front of the function, and a Database Webhook of type `HTTP Request` sends no
   `Authorization` header — so every notification is rejected at the gateway with a 401 that
   never reaches this code and never shows up as a failed email. Auth for this endpoint is
   the `x-webhook-secret` check below instead, which is why `LEAD_WEBHOOK_SECRET` must
   always be set. Re-deploying without this flag silently breaks notifications again.

   `link` is not needed — passing `--project-ref` avoids the interactive database-password
   prompt.

3. **Set secrets** (Supabase Dashboard → Edge Functions → notify-lead → Secrets, or CLI):

   ```
   npx supabase secrets set RESEND_API_KEY=re_xxxxxxxx --project-ref xsdmvvsksddnvvclndvu
   npx supabase secrets set LEAD_NOTIFY_EMAIL=administracion@latammedgas.com --project-ref xsdmvvsksddnvvclndvu
   npx supabase secrets set LEAD_WEBHOOK_SECRET=<any random string you make up> --project-ref xsdmvvsksddnvvclndvu
   ```

4. **Wire the trigger** — Dashboard → **Integrations → Database Webhooks** (it is _not_
   under Database → Triggers, which is raw Postgres triggers, and on this project it is not
   under Database → Webhooks either). Create a new hook:
   - Table: `public.leads`
   - Events: `INSERT` only
   - Type: `Supabase Edge Functions`, method `POST`, function `notify-lead` — the dropdown
     is only populated once step 2 has actually deployed. Otherwise use `HTTP Request` with
     `https://xsdmvvsksddnvvclndvu.functions.supabase.co/notify-lead`.
   - Timeout: raise from the default `5000` to `10000` ms. The function cold-starts and then
     calls Resend; a timeout here means a silently lost notification.
   - HTTP Headers: keep the default `Content-type: application/json`, and add
     `x-webhook-secret: <same random string from step 3>`. Without that header the function
     returns 401 on every call, and with `LEAD_WEBHOOK_SECRET` unset it returns 500 on every
     call — it refuses rather than sending mail unauthenticated.
   - HTTP Parameters: leave empty — the payload arrives in the body, not the query string.

5. Submit the contact form on the live site once to confirm the email arrives.

`LEAD_NOTIFY_EMAIL` is a secret, so changing who gets notified is one command and no deploy.
Update this README when you do — it drifted once already, and a stale recipient in the docs
sends you looking in the wrong inbox when something appears to be broken.
