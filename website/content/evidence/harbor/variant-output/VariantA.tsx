// Variant A — Access Ledger. Editorial direction: every permission change is
// staged inline and shows what the person gains or loses before it is applied.
import { useState, type FormEvent } from 'react';
import { ASSIGNABLE, CURRENT_USER, ROLE_INFO, roleDiff, useMembers, type Member, type Role } from './shared/members';
import './VariantA.css';

type Staged = { email: string; kind: 'role'; to: Role } | { email: string; kind: 'remove' };

export default function VariantA() {
  const store = useMembers();
  const [staged, setStaged] = useState<Staged | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Editor');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true); setFeedback(null);
    const result = await store.invite(email, role);
    setSending(false);
    if (result.ok) { setEmail(''); setFeedback({ tone: 'success', text: `Invite sent to ${result.sent.join(', ')} as ${role}. It appears under Pending below.` }); }
    else setFeedback({ tone: 'error', text: result.error });
  };

  const commit = () => {
    if (!staged) return;
    if (staged.kind === 'role') store.changeRole(staged.email, staged.to);
    else store.remove(staged.email);
    setStaged(null);
  };

  return (
    <div className="va">
      <header className="va-mast" data-zone="header">
        <p className="va-kicker">Harbor workspace · Settings</p>
        <h1>Members</h1>
        <p className="va-lede">Who can open this workspace, and what each person is allowed to change.</p>
      </header>

      <div className="va-grid">
        {/* zone:legend:start */}
        <aside className="va-legend" data-zone="sidebar" aria-labelledby="va-roles">
          <h2 id="va-roles">What each role can do</h2>
          <dl>
            {(Object.keys(ROLE_INFO) as Role[]).map(r => (
              <div key={r} className="va-role">
                <dt>{r}</dt>
                <dd>{ROLE_INFO[r].summary}</dd>
              </div>
            ))}
          </dl>
          <p className="va-note">Ownership can only be transferred from <strong>Workspace settings</strong>.</p>
        </aside>
        {/* zone:legend:end */}

        <div className="va-main">
          {/* zone:invite:start */}
          <section data-zone="form" aria-labelledby="va-invite-title" className="va-invite">
            <h2 id="va-invite-title">Invite someone</h2>
            <form onSubmit={submit} noValidate>
              <label className="va-field va-field-grow">
                <span>Email</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" autoComplete="email"
                  aria-invalid={feedback?.tone === 'error'} aria-describedby="va-invite-feedback" />
              </label>
              <label className="va-field">
                <span>Role</span>
                <select value={role} onChange={e => setRole(e.target.value as Role)}>
                  {ASSIGNABLE.map(r => <option key={r}>{r}</option>)}
                </select>
              </label>
              <button type="submit" className="va-btn va-btn-ink" disabled={sending} aria-busy={sending}>
                {sending ? 'Sending…' : 'Send invite'}
              </button>
            </form>
            <p className="va-hint">{role}: {ROLE_INFO[role].summary}</p>
            <p id="va-invite-feedback" role={feedback?.tone === 'error' ? 'alert' : 'status'} className={`va-feedback ${feedback?.tone ?? ''}`}>{feedback?.text}</p>
          </section>
          {/* zone:invite:end */}

          {/* zone:ledger:start */}
          <section data-zone="data" aria-labelledby="va-ledger-title">
            <div className="va-section-head">
              <h2 id="va-ledger-title">People with access</h2>
              <span className="va-count">{store.loading ? '—' : store.members.length}</span>
            </div>
            {store.loading ? (
              <ol className="va-ledger" aria-busy="true" aria-label="Loading members">
                {[0, 1, 2].map(i => <li key={i} className="va-row va-skeleton"><span /><span /></li>)}
              </ol>
            ) : (
              <ol className="va-ledger">
                {store.members.map((m, i) => (
                  <LedgerRow key={m.email} index={i + 1} member={m} staged={staged?.email === m.email ? staged : null}
                    onStage={setStaged} onCancel={() => setStaged(null)} onCommit={commit} />
                ))}
              </ol>
            )}
          </section>
          {/* zone:ledger:end */}

          {/* zone:pending:start */}
          <section data-zone="pending" aria-labelledby="va-pending-title">
            <div className="va-section-head">
              <h2 id="va-pending-title">Pending invites</h2>
              <span className="va-count">{store.loading ? '—' : store.pending.length}</span>
            </div>
            {!store.loading && store.pending.length === 0 ? (
              <p className="va-empty">No one is waiting to join. Invites you send appear here until they're accepted.</p>
            ) : (
              <ul className="va-pending">
                {store.pending.map(p => (
                  <li key={p.email}>
                    <span className="va-email">{p.email}</span>
                    <span className="va-meta">{p.role} · sent {p.sent.toLowerCase()}</span>
                    <button type="button" className="va-link" onClick={() => store.revoke(p.email)} aria-label={`Revoke invite to ${p.email}`}>Revoke</button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {/* zone:pending:end */}

          <details className="va-demo">
            <summary>Sample data</summary>
            <p>This preview uses sample members and no real email is sent.</p>
            <label><input type="checkbox" checked={store.simulateOutage} onChange={e => store.setSimulateOutage(e.target.checked)} /> Simulate a mail service outage</label>
          </details>
        </div>
      </div>

      <div className="va-toast-slot" role="status" aria-live="polite">
        {store.undo && (
          <div className="va-toast">
            <p>{store.undo.message}{store.undo.detail && <span> {store.undo.detail}</span>}</p>
            <button type="button" className="va-btn va-btn-ink" onClick={store.runUndo}>Undo</button>
            <button type="button" className="va-link" onClick={store.dismissUndo} aria-label="Dismiss">Dismiss</button>
          </div>
        )}
      </div>
    </div>
  );
}

function LedgerRow({ index, member: m, staged, onStage, onCancel, onCommit }: {
  index: number; member: Member; staged: Staged | null;
  onStage: (s: Staged) => void; onCancel: () => void; onCommit: () => void;
}) {
  const isOwner = m.role === 'Owner';
  const pendingRole = staged?.kind === 'role' ? staged.to : m.role;
  const diff = staged?.kind === 'role' ? roleDiff(m.role, staged.to) : null;
  return (
    <li className={`va-row ${staged ? 'is-staged' : ''}`}>
      <span className="va-index" aria-hidden="true">{String(index).padStart(2, '0')}</span>
      <div className="va-person">
        <span className="va-name">{m.name}{m.email === CURRENT_USER && <em className="va-you"> (you)</em>}</span>
        <span className="va-email">{m.email}</span>
      </div>
      <span className="va-active">{m.lastActive}</span>
      <div className="va-role-cell">
        {isOwner ? (
          <span className="va-owner">Owner</span>
        ) : (
          <select aria-label={`Role for ${m.name}`} value={pendingRole}
            onChange={e => { const to = e.target.value as Role; if (to === m.role) onCancel(); else onStage({ email: m.email, kind: 'role', to }); }}>
            {ASSIGNABLE.map(r => <option key={r}>{r}</option>)}
          </select>
        )}
      </div>
      <div className="va-actions">
        {!isOwner && <button type="button" className="va-link va-danger" onClick={() => onStage({ email: m.email, kind: 'remove' })}>Remove</button>}
      </div>

      {staged && (
        <div className="va-stage" role="group" aria-label={staged.kind === 'remove' ? `Confirm removing ${m.name}` : `Confirm role change for ${m.name}`}>
          {staged.kind === 'remove' ? (
            <p><strong>Remove {m.name}?</strong> They lose access immediately. Their documents stay in the workspace, and you can undo for a few seconds.</p>
          ) : (
            <div>
              <p><strong>{m.role} → {staged.to}.</strong> {m.name} will:</p>
              <ul className="va-diff">
                {diff!.gains.map(g => <li key={g} className="gain"><span aria-hidden="true">+</span> gain: {g}</li>)}
                {diff!.loses.map(l => <li key={l} className="lose"><span aria-hidden="true">−</span> lose: {l}</li>)}
              </ul>
            </div>
          )}
          <div className="va-stage-actions">
            <button type="button" className={`va-btn ${staged.kind === 'remove' ? 'va-btn-danger' : 'va-btn-ink'}`} onClick={onCommit} autoFocus>
              {staged.kind === 'remove' ? `Remove ${m.name.split(' ')[0]}` : 'Apply change'}
            </button>
            <button type="button" className="va-btn" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      )}
    </li>
  );
}
