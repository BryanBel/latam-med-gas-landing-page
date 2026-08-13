# notify-lead

Sends an email to `bryanbelandriav@gmail.com` every time someone submits the contact
form (a new row lands in `public.leads`). Interim recipient until the client has a real
company inbox — see `BRANDING.md` for the address/email situation.

## One-time setup

1. **Resend account** — sign up at [resend.com](https://resend.com) with the same email
   above (Resend's sandbox mode only sends to the account's own address until a sending
   domain is verified — fine for now, no domain to verify yet). Grab an API key from
   Resend → API Keys.

2. **Deploy the function** — this must happen *before* the webhook below, or the
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
   npx supabase secrets set RESEND_API_KEY=re_xxxxxxxx
   npx supabase secrets set LEAD_NOTIFY_EMAIL=bryanbelandriav@gmail.com
   npx supabase secrets set LEAD_WEBHOOK_SECRET=<any random string you make up>
   ```

4. **Wire the trigger** — Dashboard → **Integrations → Database Webhooks** (it is *not*
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
     returns 401 on every call.
   - HTTP Parameters: leave empty — the payload arrives in the body, not the query string.

5. Submit the contact form on the live site once to confirm the email arrives.

Swap `LEAD_NOTIFY_EMAIL` to the client's real inbox once one exists — no code change,
just update the secret.
