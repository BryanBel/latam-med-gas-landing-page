# keepalive

Queries the database every three days so the free-plan project never pauses, and turns a failed
ping into an email.

## Why it exists

The free Supabase plan pauses a project after **7 days without activity**, and a paused project
**does not wake up on traffic** — it has to be restored by hand from the dashboard.

That makes the failure mode silent and expensive. A quiet week, the project pauses, a hospital
writes through the contact form, gets an error, and the lead is gone with nobody told. It is not
hypothetical: `shield-link-db`, in the same Supabase account, is already `INACTIVE`.

When this was written the exposure was concrete. The last lead had arrived on 25 September —
five in total, all of them inside the 24th–25th review window — so no organic traffic was
holding the project open. What had been keeping it awake were the queries run while working on
it, which stop when the work stops.

## How the pieces fit

```
GitHub Actions (cron, every 3 days)
        │  x-keepalive-secret
        ▼
    keepalive  ──service role──▶  PostgREST  ──▶  leads
        │                                          (counted, not read)
        │ 200 {ok, leads}          ✗ anything else
        ▼                               │
    job passes                     job fails ──▶ GitHub emails the repo owner
```

**It counts rows rather than reading them.** `limit=0` with `Prefer: count=exact` returns the
total in the `Content-Range` header and not a single row of data, so the query genuinely reaches
Postgres while nobody's contact details leave Supabase.

Reaching Postgres is the point. Invoking an edge function that never touches the database would
prove nothing, because the pause is decided on **database** activity.

## One-time setup

1. **The shared secret**, which lives in two places and must match in both. Generate it once and
   never print it:

   ```sh
   npx supabase secrets set KEEPALIVE_SECRET=<value> --project-ref xsdmvvsksddnvvclndvu
   gh secret set KEEPALIVE_SECRET --repo BryanBel/latam-med-gas-landing-page
   ```

   If the two ever drift, the ping starts failing — which is exactly when the alert earns its
   keep.

2. **Deploy:**

   ```sh
   npx supabase functions deploy keepalive --project-ref xsdmvvsksddnvvclndvu --no-verify-jwt
   ```

   `--no-verify-jwt` for the same family of reasons as the other two functions, and a different
   specific one: the caller is a GitHub Actions runner that sends only its own secret header, no
   `Authorization`. **The shared secret is this function's authentication.**

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected into every edge function and do not
need setting.

## The schedule, and why the workflow also pushes a commit

`.github/workflows/supabase-keepalive.yml` runs every three days against a seven-day budget. The
margin is not decoration: GitHub delays scheduled runs under load and admits it may drop them, so
losing one cannot cost the project.

The workflow also pushes an empty commit, but **only once the repository has been quiet for 40
days**. GitHub disables scheduled workflows after 60 days of repository inactivity, and this repo
only receives commits when someone publishes in Sanity — so the keepalive could have died of the
same silence it exists to prevent.

That step is deliberately separate from the ping. Pushing on every run would mean about ten
pointless Cloudflare rebuilds a month, plus the noise in the history and the deployment list.

## Testing

Run it by hand from the **Actions** tab (Supabase keepalive → Run workflow) rather than waiting
three days for the cron.

Against the function directly, all three cases are safe — nothing is written and no email is
sent:

| Request        | Expected                           |
| -------------- | ---------------------------------- |
| No header      | `401`                              |
| Wrong secret   | `401`                              |
| Correct secret | `200` with `{"ok":true,"leads":N}` |

`N` should match the real table, which is the proof the query reached Postgres rather than
stopping at the gateway:

```sh
npx supabase db query "select count(*) from public.leads" --linked --project-ref xsdmvvsksddnvvclndvu
```

## What it does not cover

If the project pauses for a different reason — the spend cap, something at the organisation
level — the ping cannot prevent it. The alert still fires, which is more than existed before.

And the alert reaches whoever receives GitHub notifications for the repository, today one person.
If that stops being enough, add a second destination rather than assuming someone is watching.
