-- Sponsorship inquiries from the form on /sponsor (website/src/SponsorInquiry.tsx, docs/accounts.md).
-- Visitors do not need an account. They can only add an inquiry through submit_sponsor_inquiry(); nobody can read the
-- table through the public API. The maintainer reads it in the Supabase dashboard (Table Editor → sponsor_inquiries).

create table public.sponsor_inquiries (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  brand text not null check (char_length(brand) between 1 and 200),
  contact_name text not null default '' check (char_length(contact_name) <= 200),
  email text not null check (char_length(email) <= 320 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  product_url text not null check (char_length(product_url) <= 2000 and product_url ~ '^https?://'),
  message text not null check (char_length(message) between 1 and 4000),
  language text not null default 'zh' check (language in ('zh', 'en'))
);

-- Row-level security on and no policies: the anon and authenticated roles can neither read nor write the table directly.
alter table public.sponsor_inquiries enable row level security;

-- The only way in. Security definer so it can insert past RLS. A site-wide cap of 20 inquiries an hour bounds a flood
-- from a script; real inquiries are a handful a month. Over the cap it raises, and the form tells the visitor to use GitHub.
create or replace function public.submit_sponsor_inquiry(
  brand text, contact_name text, email text, product_url text, message text, language text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.sponsor_inquiries where created_at > now() - interval '1 hour') >= 20 then
    raise exception 'too_many_inquiries';
  end if;
  insert into public.sponsor_inquiries (brand, contact_name, email, product_url, message, language)
  values (trim(brand), trim(coalesce(contact_name, '')), trim(email), trim(product_url), trim(message), coalesce(language, 'zh'));
end;
$$;
revoke all on function public.submit_sponsor_inquiry(text, text, text, text, text, text) from public;
grant execute on function public.submit_sponsor_inquiry(text, text, text, text, text, text) to anon, authenticated;
