// Variant B — Roster Console. Technical direction for access reviews: search,
// role filters with counts, idle flags, batch invites. Escalations and removals
// go through a dialog; downgrades apply at once with undo.
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ASSIGNABLE, CURRENT_USER, ROLE_INFO, isEscalation, parseEmails, roleDiff, useMembers, type Member, type Role } from './shared/members';
import './VariantB.css';

type Filter = 'All' | Role | 'Idle';
type Sort = 'name' | 'role' | 'idle';
type Confirm = { member: Member; kind: 'remove' } | { member: Member; kind: 'role'; to: Role };
const IDLE_DAYS = 7;
const ROLE_ORDER: Role[] = ['Owner', 'Admin', 'Editor', 'Viewer'];

export default function VariantB() {
  const store = useMembers();
  const [tab, setTab] = useState<'members' | 'pending'>('members');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [sort, setSort] = useState<Sort>('role');
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState<Role>('Editor');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  // "/" jumps to search, like most consoles.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) { e.preventDefault(); setTab('members'); search.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (confirm && !d.open) d.showModal();
    if (!confirm && d.open) d.close();
  }, [confirm]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: store.members.length, Idle: store.members.filter(m => m.idleDays >= IDLE_DAYS).length };
    ROLE_ORDER.forEach(r => { c[r] = store.members.filter(m => m.role === r).length; });
    return c;
  }, [store.members]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.members
      .filter(m => filter === 'All' || (filter === 'Idle' ? m.idleDays >= IDLE_DAYS : m.role === filter))
      .filter(m => !q || m.name.toLowerCase().includes(q) || m.email.includes(q))
      .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name)
        : sort === 'idle' ? b.idleDays - a.idleDays
        : ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
  }, [store.members, filter, query, sort]);

  const batch = parseEmails(emails);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true); setFeedback(null);
    const result = await store.invite(emails, role);
    setSending(false);
    if (result.ok) {
      setEmails('');
      setFeedback({ tone: 'success', text: `${result.sent.length} invite${result.sent.length > 1 ? 's' : ''} sent as ${role}.` });
    } else setFeedback({ tone: 'error', text: result.error });
  };

  const requestRole = (m: Member, to: Role) => {
    if (isEscalation(m.role, to)) setConfirm({ member: m, kind: 'role', to });
    else store.changeRole(m.email, to);
  };
  const applyConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === 'remove') store.remove(confirm.member.email);
    else store.changeRole(confirm.member.email, confirm.to);
    setConfirm(null);
  };
  const sortLabel = (key: Sort) => (sort === key ? 'ascending' : 'none') as 'ascending' | 'none';

  return (
    <div className="vb">
      <header className="vb-top" data-zone="header">
        <div className="vb-crumbs"><span>harbor</span><span aria-hidden="true">/</span><span>settings</span><span aria-hidden="true">/</span><strong>members</strong></div>
        <h1>Members &amp; access</h1>
        <dl className="vb-stats">
          <div><dt>Members</dt><dd>{store.loading ? '--' : counts.All}</dd></div>
          <div><dt>Admins</dt><dd>{store.loading ? '--' : counts.Owner + counts.Admin}</dd></div>
          <div><dt>Idle ≥{IDLE_DAYS}d</dt><dd className={counts.Idle ? 'warn' : ''}>{store.loading ? '--' : counts.Idle}</dd></div>
          <div><dt>Pending</dt><dd>{store.loading ? '--' : store.pending.length}</dd></div>
        </dl>
      </header>

      {/* zone:invite:start */}
      <form className="vb-invite" data-zone="form" onSubmit={submit} noValidate aria-label="Invite members">
        <label className="vb-invite-field">
          <span className="vb-label">Invite</span>
          <input value={emails} onChange={e => setEmails(e.target.value)} placeholder="ana@co.io, sam@co.io — paste several at once"
            aria-invalid={feedback?.tone === 'error'} aria-describedby="vb-invite-feedback" autoComplete="off" spellCheck={false} />
        </label>
        <label className="vb-select">
          <span className="vb-label">as</span>
          <select value={role} onChange={e => setRole(e.target.value as Role)} aria-label="Role for new invites">
            {ASSIGNABLE.map(r => <option key={r}>{r}</option>)}
          </select>
        </label>
        <button type="submit" className="vb-btn vb-btn-primary" disabled={sending} aria-busy={sending}>
          {sending ? 'Sending…' : batch.length > 1 ? `Send ${batch.length} invites` : 'Send invite'}
        </button>
        <p id="vb-invite-feedback" role={feedback?.tone === 'error' ? 'alert' : 'status'} className={`vb-feedback ${feedback?.tone ?? ''}`}>{feedback?.text}</p>
      </form>
      {/* zone:invite:end */}

      <div className="vb-tabs" role="tablist" aria-label="Access lists">
        <button role="tab" id="vb-tab-members" aria-selected={tab === 'members'} aria-controls="vb-panel-members" onClick={() => setTab('members')}>Members <span>{store.loading ? '--' : counts.All}</span></button>
        <button role="tab" id="vb-tab-pending" aria-selected={tab === 'pending'} aria-controls="vb-panel-pending" onClick={() => setTab('pending')}>Pending <span>{store.loading ? '--' : store.pending.length}</span></button>
      </div>

      {/* zone:table:start */}
      {tab === 'members' && (
        <section id="vb-panel-members" role="tabpanel" aria-labelledby="vb-tab-members" data-zone="data">
          <div className="vb-toolbar">
            <label className="vb-search">
              <span className="vb-sr">Search members</span>
              <input ref={search} type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or email" />
              <kbd aria-hidden="true">/</kbd>
            </label>
            <div className="vb-chips" role="group" aria-label="Filter by role">
              {(['All', ...ROLE_ORDER, 'Idle'] as Filter[]).map(f => (
                <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={f === 'Idle' ? 'is-idle' : ''}>
                  {f === 'Idle' ? `Idle ≥${IDLE_DAYS}d` : f} <span>{counts[f] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="vb-table-wrap">
            <table className="vb-table">
              <thead>
                <tr>
                  <th aria-sort={sortLabel('name')}><button type="button" onClick={() => setSort('name')}>Member</button></th>
                  <th aria-sort={sortLabel('role')}><button type="button" onClick={() => setSort('role')}>Role</button></th>
                  <th aria-sort={sortLabel('idle')}><button type="button" onClick={() => setSort('idle')}>Last active</button></th>
                  <th><span className="vb-sr">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {store.loading && [0, 1, 2, 3].map(i => (
                  <tr key={i} className="vb-skel" aria-hidden="true"><td colSpan={4}><span /></td></tr>
                ))}
                {!store.loading && rows.map(m => (
                  <tr key={m.email}>
                    <td data-label="Member">
                      <span className="vb-name">{m.name}{m.email === CURRENT_USER && <span className="vb-tag">you</span>}</span>
                      <span className="vb-mono vb-dim">{m.email}</span>
                    </td>
                    <td data-label="Role">
                      {m.role === 'Owner' ? <span className="vb-owner" title="Transfer ownership from Workspace settings">Owner · locked</span> : (
                        <select aria-label={`Role for ${m.name}`} value={m.role} onChange={e => requestRole(m, e.target.value as Role)}>
                          {ASSIGNABLE.map(r => <option key={r}>{r}</option>)}
                        </select>
                      )}
                    </td>
                    <td data-label="Last active" className="vb-mono">
                      {m.lastActive}{m.idleDays >= IDLE_DAYS && <span className="vb-tag vb-tag-warn">idle</span>}
                    </td>
                    <td className="vb-actions">
                      {m.role !== 'Owner' && <button type="button" className="vb-btn vb-btn-ghost" onClick={() => setConfirm({ member: m, kind: 'remove' })} aria-label={`Remove ${m.name}`}>Remove</button>}
                    </td>
                  </tr>
                ))}
                {!store.loading && rows.length === 0 && (
                  <tr><td colSpan={4} className="vb-empty">
                    No members match {query ? <>“{query}”</> : 'this filter'}.{' '}
                    <button type="button" className="vb-link" onClick={() => { setQuery(''); setFilter('All'); }}>Clear filters</button>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="vb-foot">Escalating to Admin asks for confirmation. Other role changes apply immediately and can be undone. Ownership transfers live in Workspace settings.</p>
        </section>
      )}

      {tab === 'pending' && (
        <section id="vb-panel-pending" role="tabpanel" aria-labelledby="vb-tab-pending" data-zone="pending">
          {store.loading ? (
            <p className="vb-empty" aria-busy="true">Loading invites…</p>
          ) : store.pending.length === 0 ? (
            <p className="vb-empty">No pending invites. Paste one or more emails in the invite bar above to add people.</p>
          ) : (
            <table className="vb-table">
              <thead><tr><th>Email</th><th>Role</th><th>Sent</th><th><span className="vb-sr">Actions</span></th></tr></thead>
              <tbody>
                {store.pending.map(p => (
                  <tr key={p.email}>
                    <td data-label="Email" className="vb-mono">{p.email}</td>
                    <td data-label="Role">{p.role}</td>
                    <td data-label="Sent" className="vb-mono vb-dim">{p.sent}</td>
                    <td className="vb-actions"><button type="button" className="vb-btn vb-btn-ghost" onClick={() => store.revoke(p.email)} aria-label={`Revoke invite to ${p.email}`}>Revoke</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
      {/* zone:table:end */}

      <details className="vb-demo">
        <summary>Sample data · no email is sent</summary>
        <label><input type="checkbox" checked={store.simulateOutage} onChange={e => store.setSimulateOutage(e.target.checked)} /> Simulate mail service outage</label>
      </details>

      <dialog ref={dialog} className="vb-dialog" onClose={() => setConfirm(null)} aria-labelledby="vb-dialog-title">
        {confirm && (
          <form method="dialog" onSubmit={e => { e.preventDefault(); applyConfirm(); }}>
            {confirm.kind === 'remove' ? (
              <>
                <h2 id="vb-dialog-title">Remove {confirm.member.name}?</h2>
                <p>{confirm.member.email} loses access to this workspace immediately. Their documents stay. You can undo for 8 seconds.</p>
              </>
            ) : (
              <>
                <h2 id="vb-dialog-title">Make {confirm.member.name} an {confirm.to}?</h2>
                <p>{ROLE_INFO[confirm.to].summary} They will gain:</p>
                <ul>{roleDiff(confirm.member.role, confirm.to).gains.map(g => <li key={g}>{g}</li>)}</ul>
              </>
            )}
            <div className="vb-dialog-actions">
              <button type="button" className="vb-btn vb-btn-ghost" onClick={() => setConfirm(null)} autoFocus>Cancel</button>
              <button type="submit" className={`vb-btn ${confirm.kind === 'remove' ? 'vb-btn-danger' : 'vb-btn-primary'}`}>
                {confirm.kind === 'remove' ? 'Remove access' : `Make ${confirm.to}`}
              </button>
            </div>
          </form>
        )}
      </dialog>

      <div className="vb-toast-slot" role="status" aria-live="polite">
        {store.undo && (
          <div className="vb-toast">
            <span>{store.undo.message}</span>
            <button type="button" className="vb-btn vb-btn-primary" onClick={store.runUndo}>Undo</button>
            <button type="button" className="vb-btn vb-btn-ghost" onClick={store.dismissUndo} aria-label="Dismiss notification">✕</button>
          </div>
        )}
      </div>
    </div>
  );
}
