// Shared task contract for variants A/B/C — identical data, rules and actions.
// Sample data mirrors src/MembersPage.tsx. Role capabilities are inferred from
// "manage who can access the workspace and what they can change"; confirm them
// against Harbor's real permission model before shipping.
import { useCallback, useEffect, useRef, useState } from 'react';

export type Role = 'Owner' | 'Admin' | 'Editor' | 'Viewer';
export type Member = { name: string; email: string; role: Role; lastActive: string; idleDays: number };
export type Invite = { email: string; role: Role; sent: string };
export type InviteResult = { ok: true; sent: string[] } | { ok: false; error: string };
export type Undoable = { message: string; detail?: string; restore: () => void };

export const ASSIGNABLE: Role[] = ['Admin', 'Editor', 'Viewer'];
export const CURRENT_USER = 'mei@harbor.dev';

export const ROLE_INFO: Record<Role, { summary: string; can: string[] }> = {
  Owner: { summary: 'Full control, including billing and deleting the workspace.', can: ['Everything an Admin can do', 'Manage billing', 'Transfer ownership', 'Delete the workspace'] },
  Admin: { summary: 'Manages people and settings.', can: ['Invite and remove members', 'Change member roles', 'Edit workspace settings', 'Create and edit content'] },
  Editor: { summary: 'Creates and edits work, but not people.', can: ['Create and edit content'] },
  Viewer: { summary: 'Can see everything, change nothing.', can: ['View content'] },
};

const RANK: Record<Role, number> = { Viewer: 0, Editor: 1, Admin: 2, Owner: 3 };
export const isEscalation = (from: Role, to: Role) => RANK[to] > RANK[from];

/** Capabilities gained and lost when moving between two roles. */
export function roleDiff(from: Role, to: Role) {
  const all = (r: Role) => ASSIGNABLE.filter(x => RANK[x] <= RANK[r]).flatMap(x => ROLE_INFO[x].can.filter(c => !c.startsWith('Everything')));
  const a = new Set(all(from)), b = new Set(all(to));
  return { gains: [...b].filter(c => !a.has(c)), loses: [...a].filter(c => !b.has(c)) };
}

export const initials = (name: string) => name.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();

const SEED_MEMBERS: Member[] = [
  { name: 'Mei Lin', email: 'mei@harbor.dev', role: 'Owner', lastActive: 'Today', idleDays: 0 },
  { name: 'Jonas Berg', email: 'jonas@harbor.dev', role: 'Admin', lastActive: 'Yesterday', idleDays: 1 },
  { name: 'Ama Owusu', email: 'ama@harbor.dev', role: 'Editor', lastActive: '3 days ago', idleDays: 3 },
  { name: 'Ravi Shah', email: 'ravi@harbor.dev', role: 'Viewer', lastActive: '2 weeks ago', idleDays: 14 },
];
const SEED_INVITES: Invite[] = [{ email: 'lea@studio.io', role: 'Editor', sent: '2 days ago' }];
const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

/** Splits "a@x.io, b@y.io" so every variant validates batches the same way. */
export const parseEmails = (raw: string) => raw.split(/[\s,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean);

export function useMembers() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [pending, setPending] = useState<Invite[]>([]);
  const [undo, setUndo] = useState<Undoable | null>(null);
  const [simulateOutage, setSimulateOutage] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  // Sample fetch so each variant shows its loading state.
  useEffect(() => {
    const t = window.setTimeout(() => { setMembers(SEED_MEMBERS); setPending(SEED_INVITES); setLoading(false); }, 450);
    return () => window.clearTimeout(t);
  }, []);

  const offerUndo = useCallback((u: Undoable) => {
    window.clearTimeout(timer.current);
    setUndo(u);
    timer.current = window.setTimeout(() => setUndo(null), 8000);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const invite = useCallback(async (raw: string, role: Role): Promise<InviteResult> => {
    const emails = [...new Set(parseEmails(raw))];
    if (!emails.length) return { ok: false, error: 'Enter an email address to send an invite.' };
    const bad = emails.find(e => !EMAIL.test(e));
    if (bad) return { ok: false, error: `“${bad}” isn't a complete email address. Check for a missing @ or domain.` };
    const member = emails.find(e => members.some(m => m.email === e));
    if (member) return { ok: false, error: `${member} is already a member. Change their role in the list instead.` };
    const dup = emails.find(e => pending.some(p => p.email === e));
    if (dup) return { ok: false, error: `${dup} already has a pending invite. Revoke it first to resend with a different role.` };
    await new Promise(r => window.setTimeout(r, 700));
    if (simulateOutage) return { ok: false, error: "Harbor couldn't reach the mail service, so no invite was sent. Try again in a minute." };
    setPending(p => [...p, ...emails.map(email => ({ email, role, sent: 'Just now' }))]);
    return { ok: true, sent: emails };
  }, [members, pending, simulateOutage]);

  const changeRole = useCallback((email: string, role: Role) => {
    const before = members.find(m => m.email === email);
    if (!before || before.role === 'Owner' || role === 'Owner' || before.role === role) return;
    setMembers(ms => ms.map(m => (m.email === email ? { ...m, role } : m)));
    offerUndo({
      message: `${before.name} is now ${role === 'Admin' ? 'an' : 'a'} ${role}.`,
      restore: () => setMembers(ms => ms.map(m => (m.email === email ? { ...m, role: before.role } : m))),
    });
  }, [members, offerUndo]);

  const remove = useCallback((email: string) => {
    const index = members.findIndex(m => m.email === email);
    const target = members[index];
    if (!target || target.role === 'Owner') return;
    setMembers(ms => ms.filter(m => m.email !== email));
    offerUndo({
      message: `${target.name} was removed and can no longer open this workspace.`,
      detail: 'Their documents stay in the workspace.',
      restore: () => setMembers(ms => { const next = [...ms]; next.splice(index, 0, target); return next; }),
    });
  }, [members, offerUndo]);

  const revoke = useCallback((email: string) => {
    const index = pending.findIndex(p => p.email === email);
    const target = pending[index];
    if (!target) return;
    setPending(ps => ps.filter(p => p.email !== email));
    offerUndo({
      message: `Invite to ${email} revoked. The link in their email no longer works.`,
      restore: () => setPending(ps => { const next = [...ps]; next.splice(index, 0, target); return next; }),
    });
  }, [pending, offerUndo]);

  const runUndo = useCallback(() => { undo?.restore(); window.clearTimeout(timer.current); setUndo(null); }, [undo]);
  const dismissUndo = useCallback(() => { window.clearTimeout(timer.current); setUndo(null); }, []);

  return { loading, members, pending, invite, changeRole, remove, revoke, undo, runUndo, dismissUndo, simulateOutage, setSimulateOutage };
}
