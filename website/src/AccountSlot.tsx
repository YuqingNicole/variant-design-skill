import { lazy, Suspense, useEffect, useState } from 'react';
import type { Language } from './direction-engine';
import { t } from './i18n/localized';
import { openSignIn, useAccountState } from './account';
// The header's account control as the page first draws it (2026-11-28): a sign-in button, or a signed-in visitor's menu.
// The dialog and the menu (AccountDialog.tsx) load only when someone opens the dialog or is signed in, so a plain visit to
// the home does not carry them; a pointer over the button starts the fetch early.
const AccountDialog = lazy(() => import('./AccountDialog').then(m => ({ default: m.AccountDialog })));
const AccountMenu = lazy(() => import('./AccountDialog').then(m => ({ default: m.AccountMenu })));
const preload = () => { void import('./AccountDialog'); };
// The SSR build hands the module over up front, so the prerendered HTML keeps the closed dialog it always had (ssr-pages.tsx).
let eager: typeof import('./AccountDialog') | undefined;
export const provideAccountDialog = (parts: typeof import('./AccountDialog')) => { eager = parts; };
const signIn = { zh: '登录', en: 'Sign in' };

export function SignInButton({ language, busy }: { language: Language; busy: boolean }) {
  return <button type="button" className="site-language site-account" aria-busy={busy || undefined} onPointerEnter={preload} onFocus={preload} onClick={() => openSignIn('header')}>{t(signIn, language)}</button>;
}

// A stored session starts the menu's fetch while Supabase confirms it; until the menu is here a signed-in visitor sees their
// initial on a disabled button, never a sign-in button that would open the dialog.
export function AccountButton({ language }: { language: Language }) {
  const { account } = useAccountState();
  useEffect(() => { if (account.status === 'loading' || account.status === 'signed-in') preload(); }, [account.status]);
  if (account.status !== 'signed-in' || !account.user) return <SignInButton language={language} busy={account.status === 'loading'}/>;
  const u = account.user, waiting = <button type="button" className="site-language site-account" aria-busy disabled>{u.avatar ? <img src={u.avatar} alt="" width="24" height="24" referrerPolicy="no-referrer"/> : <span aria-hidden="true">{(u.name || u.email || '?').trim().charAt(0).toUpperCase()}</span>}</button>;
  return <Suspense fallback={waiting}><AccountMenu language={language}/></Suspense>;
}

// Mounted the first time the dialog is asked for and kept, so it opens itself (showModal) on that first render.
export function AccountDialogSlot({ language }: { language: Language }) {
  const { dialog } = useAccountState(), [wanted, setWanted] = useState(false);
  useEffect(() => { if (dialog) setWanted(true); }, [dialog]);
  if (eager) return <eager.AccountDialog language={language}/>;
  return wanted ? <Suspense fallback={null}><AccountDialog language={language}/></Suspense> : null;
}
