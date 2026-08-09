create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  company text,
  message text not null
);

alter table public.leads enable row level security;

-- Anonymous visitors may only insert (submit the form) — never read, update, or delete.
create policy "anon can submit leads"
  on public.leads
  for insert
  to anon
  with check (true);
