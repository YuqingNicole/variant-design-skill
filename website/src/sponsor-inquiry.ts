// Sends a sponsorship inquiry to the maintainer's Supabase project (supabase/migrations/20261116000000_sponsor_inquiries.sql).
// A plain fetch to the RPC endpoint with the public key, so the page does not load the Supabase library.
// Without a project configured at build time the form is not offered and the page links to GitHub instead.
declare const __SUPABASE__: { url: string; key: string } | undefined;
const config = typeof __SUPABASE__ === 'undefined' ? undefined : __SUPABASE__;
export const inquiriesEnabled = Boolean(config?.url && config?.key);
export type Inquiry = { brand: string; contact_name: string; email: string; product_url: string; message: string; language: 'zh' | 'en' };
export async function sendInquiry(inquiry: Inquiry) {
  if (!config) throw new Error('not_configured');
  const response = await fetch(`${config.url}/rest/v1/rpc/submit_sponsor_inquiry`, {
    method: 'POST', headers: { apikey: config.key, 'content-type': 'application/json' }, body: JSON.stringify(inquiry),
  });
  if (!response.ok) throw new Error(`inquiry_${response.status}`);
}
