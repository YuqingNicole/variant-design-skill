import { useSyncExternalStore } from 'react';
import type { SupabaseClient, Session } from '@supabase/supabase-js';
// Accounts (maintainer, 2026-11-15): saving references and generating briefs need a signed-in account, held by Supabase
// (Google or an emailed sign-in link). Setup is in docs/accounts.md. Without a project URL and public key at build time
// accounts are off and the site behaves as before: the pack stays in this browser and nothing asks for sign-in.
// The Supabase library (about 50 KB) is fetched only when someone signs in or already has a session in this browser.
declare const __SUPABASE__: { url: string; key: string } | undefined;
const config = typeof __SUPABASE__ === 'undefined' ? undefined : __SUPABASE__;
export const accountsEnabled = Boolean(config?.url && config?.key);

export type User = { id: string; email: string; name?: string; avatar?: string };
export type Account = { status: 'off' | 'loading' | 'signed-out' | 'signed-in'; user: User | null; error: string };
type Reason = 'save' | 'brief' | 'header';
type State = { account: Account; dialog: Reason | null };

let state: State = { account: { status: accountsEnabled ? 'loading' : 'off', user: null, error: '' }, dialog: null };
const server = state, listeners = new Set<() => void>();
const set = (next: Partial<State>) => { state = { ...state, ...next }; listeners.forEach(fn => fn()); };
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const useAccountState = () => useSyncExternalStore(subscribe, () => state, () => server);
export const useAccount = () => useAccountState().account;
export const openSignIn = (reason: Reason) => set({ dialog: reason });
export const closeSignIn = () => set({ dialog: null });
// The visitor closed the dialog without signing in: the action that opened it is not resumed later.
export const dismissSignIn = () => { try { localStorage.removeItem('variant-account-pending'); } catch { /* nothing to forget */ } closeSignIn(); };

let client: Promise<SupabaseClient> | null = null;
function getClient() {
  return client ??= import('@supabase/supabase-js').then(({ createClient }) => {
    const c = createClient(config!.url, config!.key, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } });
    c.auth.onAuthStateChange((_event, session) => apply(session));
    return c;
  });
}
function apply(session: Session | null) {
  if (!session) { set({ account: { status: 'signed-out', user: null, error: state.account.error } }); return; }
  const u = session.user, meta = u.user_metadata ?? {};
  set({ account: { status: 'signed-in', error: '', user: { id: u.id, email: u.email ?? '', name: meta.full_name ?? meta.name, avatar: meta.avatar_url } }, dialog: null });
}
// Supabase keeps the session under `sb-<project>-auth-token`; its presence is the only reason to load the library on a plain visit.
const stored = () => { try { return Object.keys(localStorage).some(k => k.startsWith('sb-') && k.includes('-auth-token')); } catch { return false; } };
const callbackKeys = ['code', 'error', 'error_code', 'error_description'];
const returning = () => { const p = new URLSearchParams(location.search); return callbackKeys.some(k => p.has(k)); };
// Back from Google or the emailed link: the library exchanges `?code=` for a session; the address is then put back as it was.
function cleanAddress() {
  const u = new URL(location.href); let error = '';
  for (const k of callbackKeys) { if (k === 'error_description') error = u.searchParams.get(k) ?? ''; u.searchParams.delete(k); }
  if (u.href !== location.href) history.replaceState(history.state, '', u.href);
  return error;
}
if (accountsEnabled && typeof window !== 'undefined') {
  if (stored() || returning()) {
    const back = returning();
    getClient().then(c => c.auth.getSession()).then(({ data }) => {
      const error = back ? cleanAddress() : '';
      apply(data.session);
      if (error) set({ account: { ...state.account, error }, dialog: data.session ? null : 'header' });
    }).catch(() => set({ account: { status: 'signed-out', user: null, error: '' } }));
  } else state = { ...state, account: { status: 'signed-out', user: null, error: '' } };
}

const returnTo = () => { const u = new URL(location.href); for (const k of callbackKeys) u.searchParams.delete(k); return u.href; };
export async function signInWithGoogle() {
  const { error } = await (await getClient()).auth.signInWithOAuth({ provider: 'google', options: { redirectTo: returnTo() } });
  if (error) throw error;
}
export async function sendSignInLink(email: string) {
  const { error } = await (await getClient()).auth.signInWithOtp({ email, options: { emailRedirectTo: returnTo(), shouldCreateUser: true } });
  if (error) throw error;
}
export async function signOut() { await (await getClient()).auth.signOut(); }

// One row per user: the whole pack as JSON (row-level security limits every query to the caller's own row).
export async function readPack(userId: string): Promise<unknown> {
  const { data, error } = await (await getClient()).from('reference_packs').select('selection').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data?.selection ?? null;
}
export async function writePack(userId: string, selection: unknown) {
  const { error } = await (await getClient()).from('reference_packs').upsert({ user_id: userId, selection, updated_at: new Date().toISOString() });
  if (error) throw error;
}
// Removes the user from auth.users through a database function that can only delete the caller; the pack row goes with it.
export async function deleteAccount() {
  const c = await getClient();
  const { error } = await c.rpc('delete_my_account');
  if (error) throw error;
  await c.auth.signOut();
}

// The action that asked for sign-in, resumed after the round trip to Google or the emailed link (which may open in a new
// tab, so this is localStorage, not sessionStorage). It expires after an hour.
const pendingKey = 'variant-account-pending';
export function rememberPending(id: string) { try { localStorage.setItem(pendingKey, JSON.stringify({ id, at: Date.now() })); } catch { /* the action is simply not resumed */ } }
export function takePending(): string | null {
  try {
    const raw = localStorage.getItem(pendingKey); localStorage.removeItem(pendingKey);
    const p = raw ? JSON.parse(raw) as { id?: unknown; at?: unknown } : null;
    return p && typeof p.id === 'string' && typeof p.at === 'number' && Date.now() - p.at < 3_600_000 ? p.id : null;
  } catch { return null; }
}
