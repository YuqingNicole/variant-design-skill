-- Search terms behind the trending list on the phone search sheet (website/src/SearchSheet.tsx, docs/accounts.md).
-- A submitted search adds one row: the term (lower-cased, spaces collapsed), the time and the interface language. No account,
-- IP address or other identifier is stored, and nobody can read the rows through the public API: visitors can only add a term
-- through log_search() and read totals through top_searches(). Rows older than 30 days are deleted as new ones arrive.

create table public.search_terms (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  term text not null check (char_length(term) between 2 and 40),
  language text not null default 'zh' check (language in ('zh', 'en'))
);
create index search_terms_created_at on public.search_terms (created_at);

-- Row-level security on and no policies: the anon and authenticated roles can neither read nor write the table directly.
alter table public.search_terms enable row level security;

-- The only way in. A site-wide cap of 2000 terms an hour bounds a flood from a script; over the cap a term is dropped quietly,
-- since a search must never fail because it could not be counted.
create or replace function public.log_search(p_term text, p_language text)
returns void
language plpgsql
security definer
set search_path = ''
as $body$
declare
  cleaned text := lower(btrim(regexp_replace(coalesce(p_term, ''), '\s+', ' ', 'g')));
begin
  if char_length(cleaned) < 2 or char_length(cleaned) > 40 then return; end if;
  if (select count(*) from public.search_terms where created_at > now() - interval '1 hour') >= 2000 then return; end if;
  delete from public.search_terms where created_at < now() - interval '30 days';
  insert into public.search_terms (term, language) values (cleaned, case when p_language = 'en' then 'en' else 'zh' end);
end;
$body$;
revoke all on function public.log_search(text, text) from public;
grant execute on function public.log_search(text, text) to anon, authenticated;

-- Totals only: the terms searched at least p_min times (never fewer than 3) in the last p_days days (1 to 30), most first.
create or replace function public.top_searches(p_days integer default 7, p_limit integer default 10, p_min integer default 3)
returns table (term text, searches bigint)
language sql
stable
security definer
set search_path = ''
as $body$
  select s.term, count(*) as searches
  from public.search_terms s
  where s.created_at > now() - make_interval(days => least(greatest(coalesce(p_days, 7), 1), 30))
  group by s.term
  having count(*) >= greatest(coalesce(p_min, 3), 3)
  order by searches desc, s.term
  limit least(greatest(coalesce(p_limit, 10), 1), 20);
$body$;
revoke all on function public.top_searches(integer, integer, integer) from public;
grant execute on function public.top_searches(integer, integer, integer) to anon, authenticated;
