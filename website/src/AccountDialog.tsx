import { useEffect, useRef, useState } from 'react';
import type { Language } from './direction-engine';
import { t, type Localized } from './i18n/localized';
import { closeSignIn, dismissSignIn, deleteAccount, sendSignInLink, signInWithGoogle, signOut, useAccountState } from './account';
import { localePath } from './i18n/locale-route';
import { SignInButton } from './AccountSlot';
// The sign-in dialog and the signed-in account menu (src/account.ts), loaded on demand by AccountSlot.tsx when accounts are on.
const m = {
  title: { zh: '登录 Variant Design', en: 'Sign in to Variant Design' },
  save: { zh: '登录后就能收藏这条参考。收藏和你写的笔记保存在账号里，换一台设备也在。', en: 'Sign in to save this reference. Your saves and notes stay with your account, on any device.' },
  brief: { zh: '登录后就能生成参考指令。', en: 'Sign in to generate a brief.' },
  header: { zh: '收藏参考、写笔记和生成参考指令都需要登录。浏览和搜索不用。', en: 'Saving references, writing notes and generating briefs need an account. Browsing and search do not.' },
  google: { zh: '使用 Google 登录', en: 'Continue with Google' },
  or: { zh: '或者用邮箱', en: 'or use your email' },
  email: { zh: '邮箱', en: 'Email' },
  send: { zh: '发送登录链接', en: 'Email me a sign-in link' },
  sending: { zh: '正在发送…', en: 'Sending…' },
  sent: { zh: (email: string) => `登录链接已发到 ${email}。请在这台设备上打开邮件里的链接。`, en: (email: string) => `A sign-in link is on its way to ${email}. Open it on this device.` },
  other: { zh: '换一个邮箱', en: 'Use another email' },
  failed: { zh: '没能完成登录，请稍后再试。', en: 'Sign-in did not go through. Please try again.' },
  privacy: { zh: '我们只保存你的邮箱（用 Google 登录时还有名字和头像）以及你收藏的参考和笔记，用来让你登录、同步收藏，不发营销邮件。可以随时在账号菜单里删除账号。', en: 'We keep only your email (and, with Google, your name and picture) plus the references and notes you save, to sign you in and sync your saves, never for marketing email. You can delete your account any time from the account menu.' },
  privacyLink: { zh: '隐私说明', en: 'Privacy' },
  close: { zh: '关闭', en: 'Close' },
  account: { zh: '账号', en: 'Account' },
  signOut: { zh: '退出登录', en: 'Sign out' },
  remove: { zh: '删除账号', en: 'Delete account' },
  confirm: { zh: '确认删除账号和全部收藏', en: 'Delete my account and all saves' },
  removeNote: { zh: '账号和收藏会立即删除，不能恢复。', en: 'Your account and saves are deleted at once and cannot be restored.' },
  removeFailed: { zh: '没能删除账号，请稍后再试。', en: 'Could not delete the account. Please try again.' },
} satisfies Record<string, Localized<unknown>>;

export function AccountDialog({ language }: { language: Language }) {
  const { account, dialog } = useAccountState();
  const l = (k: Exclude<keyof typeof m, 'sent'>) => t(m[k] as Localized, language);
  const ref = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState(''), [sent, setSent] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (dialog && !d.open) { setError(account.error ? l('failed') : ''); d.showModal(); }
    if (!dialog && d.open) d.close();
  }, [dialog]);
  async function run(task: () => Promise<void>) {
    setBusy(true); setError('');
    try { await task(); } catch { setError(l('failed')); } finally { setBusy(false); }
  }
  return <dialog ref={ref} className="account-dialog" aria-labelledby="account-title" onClose={closeSignIn} onCancel={dismissSignIn}>
    <button type="button" className="account-close" onClick={dismissSignIn} aria-label={l('close')}><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg></button>
    <h2 id="account-title">{l('title')}</h2>
    <p>{l(dialog ?? 'header')}</p>
    <button type="button" className="account-primary" disabled={busy} onClick={() => run(signInWithGoogle)}>{l('google')}</button>
    <p className="account-or">{l('or')}</p>
    {sent
      ? <p role="status" className="account-sent">{t(m.sent, language)(sent)} <button type="button" className="account-link" onClick={() => setSent('')}>{l('other')}</button></p>
      : <form onSubmit={e => { e.preventDefault(); const value = email.trim(); if (value) void run(async () => { await sendSignInLink(value); setSent(value); }); }}>
        <label htmlFor="account-email">{l('email')}</label>
        <input id="account-email" type="email" required autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)}/>
        <button type="submit" className="account-secondary" disabled={busy}>{busy ? l('sending') : l('send')}</button>
      </form>}
    {error && <p role="alert" className="account-error">{error}</p>}
    <p className="account-privacy">{l('privacy')} <a href={localePath('/privacy', language)}>{l('privacyLink')}</a></p>
  </dialog>;
}

// A signed-in visitor's menu; signed out (or while the session loads) it is the plain sign-in button (AccountSlot.tsx).
export function AccountMenu({ language }: { language: Language }) {
  const { account } = useAccountState();
  const l = (k: Exclude<keyof typeof m, 'sent'>) => t(m[k] as Localized, language);
  const [open, setOpen] = useState(false), [confirming, setConfirming] = useState(false), [error, setError] = useState('');
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', key); };
  }, [open]);
  useEffect(() => { if (!open) { setConfirming(false); setError(''); } }, [open]);
  if (account.status !== 'signed-in' || !account.user)
    return <SignInButton language={language} busy={account.status === 'loading'}/>;
  const u = account.user, initial = (u.name || u.email || '?').trim().charAt(0).toUpperCase();
  return <div className="site-account-menu" ref={box}>
    <button type="button" className="site-language site-account" aria-expanded={open} aria-haspopup="true" aria-label={`${l('account')}: ${u.email}`} onClick={() => setOpen(v => !v)}>
      {u.avatar ? <img src={u.avatar} alt="" width="24" height="24" referrerPolicy="no-referrer"/> : <span aria-hidden="true">{initial}</span>}
    </button>
    {open && <div className="site-account-panel">
      <p>{u.email}</p>
      <button type="button" onClick={() => { setOpen(false); void signOut(); }}>{l('signOut')}</button>
      {confirming
        ? <><p className="account-error">{l('removeNote')}</p><button type="button" className="account-danger" onClick={() => deleteAccount().then(() => setOpen(false), () => setError(l('removeFailed')))}>{l('confirm')}</button></>
        : <button type="button" onClick={() => setConfirming(true)}>{l('remove')}</button>}
      {error && <p role="alert" className="account-error">{error}</p>}
    </div>}
  </div>;
}
