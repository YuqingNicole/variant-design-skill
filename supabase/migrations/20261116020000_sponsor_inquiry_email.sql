-- Email the maintainer when a sponsorship inquiry arrives (docs/accounts.md → 赞助咨询表单).
-- An insert into sponsor_inquiries queues one request to Resend's API through pg_net. pg_net sends it after the insert
-- commits and never blocks or fails the insert: if Resend is down or the key is wrong, the inquiry is still saved.
-- Settings live in Supabase Vault, not in this file, so the key and the address stay out of the repository:
--   resend_api_key        required; without it nothing is sent
--   sponsor_notify_to     required; the address that receives the notice
--   sponsor_notify_from   optional; defaults to Resend's test sender, which can only mail the Resend account's own address

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_sponsor_inquiry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  key text; recipient text; sender text;
begin
  select decrypted_secret into key from vault.decrypted_secrets where name = 'resend_api_key';
  select decrypted_secret into recipient from vault.decrypted_secrets where name = 'sponsor_notify_to';
  select decrypted_secret into sender from vault.decrypted_secrets where name = 'sponsor_notify_from';
  if key is null or recipient is null then return new; end if;
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', coalesce(sender, 'Variant Design <onboarding@resend.dev>'),
      'to', jsonb_build_array(recipient),
      'reply_to', new.email,
      'subject', '赞助咨询 / Sponsor inquiry: ' || left(new.brand, 120),
      'text', concat_ws(E'\n',
        '品牌 Brand: ' || new.brand,
        '名字 Name: ' || nullif(new.contact_name, ''),
        '邮箱 Email: ' || new.email,
        '网址 URL: ' || new.product_url,
        '语言 Language: ' || new.language,
        '时间 Time: ' || to_char(new.created_at at time zone 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI') || ' (UTC+8)',
        '',
        new.message,
        '',
        '直接回复这封邮件即可回复对方。Reply to this email to answer them.')
    )
  );
  return new;
end;
$$;
revoke all on function public.notify_sponsor_inquiry() from public, anon, authenticated;

create trigger sponsor_inquiry_email
  after insert on public.sponsor_inquiries
  for each row execute function public.notify_sponsor_inquiry();
