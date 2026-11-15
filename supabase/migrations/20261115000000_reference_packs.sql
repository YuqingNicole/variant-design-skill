-- Accounts for variantdesign.xyz (website/src/account.ts, docs/accounts.md).
-- One row per signed-in user: their reference pack, the same JSON shape the site used to keep in localStorage:
-- { "<reference id>": { "use": "...", "avoid": "..." }, ... }

create table public.reference_packs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  selection jsonb not null default '{}'::jsonb
    check (jsonb_typeof(selection) = 'object' and pg_column_size(selection) < 262144),
  updated_at timestamptz not null default now()
);

-- Row-level security: a signed-in user reads and writes only their own row; anonymous callers see nothing.
alter table public.reference_packs enable row level security;
create policy "read own pack" on public.reference_packs for select to authenticated using ((select auth.uid()) = user_id);
create policy "create own pack" on public.reference_packs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own pack" on public.reference_packs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own pack" on public.reference_packs for delete to authenticated using ((select auth.uid()) = user_id);

-- "Delete account" in the site's account menu. Security definer so it may delete from auth.users, but it can only ever
-- delete the caller; the pack row goes with it through the foreign key.
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid());
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
