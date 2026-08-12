# notify-lead

Sends an email to `bryanbelandriav@gmail.com` every time someone submits the contact
form (a new row lands in `public.leads`). Interim recipient until the client has a real
company inbox — see `BRANDING.md` for the address/email situation.

## One-time setup

1. **Resend account** — sign up at [resend.com](https://resend.com) with the same email
   above (Resend's sandbox mode only sends to the account's own address until a sending
   domain is verified — fine for now, no domain to verify yet). Grab an API key from
   Resend → API Keys.

2. **Deploy the function:**

   ```
   npx supabase login
   npx supabase link --project-ref mms9p1ms   # match your Supabase project ref, not Sanity's
   npx supabase functions deploy notify-lead
   ```

3. **Set secrets** (Supabase Dashboard → Edge Functions → notify-lead → Secrets, or CLI):

   ```
   npx supabase secrets set RESEND_API_KEY=re_xxxxxxxx
   npx supabase secrets set LEAD_NOTIFY_EMAIL=bryanbelandriav@gmail.com
   npx supabase secrets set LEAD_WEBHOOK_SECRET=<any random string you make up>
   ```

4. **Wire the trigger** — Supabase Dashboard → Database → Webhooks → Create a new hook:
   - Table: `leads`
   - Events: `INSERT`
   - Type: `HTTP Request`
   - URL: the function URL shown after deploy (`https://<project-ref>.functions.supabase.co/notify-lead`)
   - HTTP Headers: add `x-webhook-secret: <same random string from step 3>`

5. Submit the contact form on the live site once to confirm the email arrives.

Swap `LEAD_NOTIFY_EMAIL` to the client's real inbox once one exists — no code change,
just update the secret.
