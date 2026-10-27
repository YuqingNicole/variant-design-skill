// Variant C — Crew Board. Warm, invite-first direction: roles are chosen from
// plain-language cards, people are grouped by what they can do, and every change
// to one person happens in a single focused dialog.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ASSIGNABLE, CURRENT_USER, ROLE_INFO, initials, roleDiff, useMembers, type Member, type Role } from './shared/members';
import './VariantC.css';

const COLUMNS: Role[] = ['Owner', 'Admin', 'Editor', 'Viewer'];

export default function VariantC() {
  const store = useMembers();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Editor');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [managing, setManaging] = useState<Member | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true); setFeedback(null);
    const result = await store.invite(email, role);
    setSending(false);
    if (result.ok) { setEmail(''); setFeedback({ tone: 'success', text: `Invite on its way to ${result.sent.join(', ')}. They'll join as ${role === 'Admin' ? 'an' : 'a'} ${role}.` }); }
    else setFeedback({ tone: 'error', text: result.error });
  };

  return (
    <div className="vc">
      <header className="vc-head" data-zone="header">
        <span className="vc-logo" aria-hidden="true">H</span>
        <div>
          <p className="vc-eyebrow">Harbor · Members</p>
          <h1>Your crew</h1>
        </div>
      </header>

      {/* zone:hero:start */}
      <section className="vc-hero" data-zone="hero" aria-labelledby="vc-invite-title">
        <h2 id="vc-invite-title">Bring someone aboard</h2>
        <form onSubmit={submit} noValidate>
          <label className="vc-email">
            <span>Their work email</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sam@yourteam.com" autoComplete="email"
              aria-invalid={feedback?.tone === 'error'} aria-describedby="vc-feedback" />
          </label>
          <fieldset className="vc-roles">
            <legend>What should they be able to do?</legend>
            {ASSIGNABLE.map(r => (
              <label key={r} className={`vc-role-card vc-tone-${r.toLowerCase()}`}>
                <input type="radio" name="vc-role" value={r} checked={role === r} onChange={() => setRole(r)} />
                <span className="vc-role-name">{r}</span>
                <span className="vc-role-desc">{ROLE_INFO[r].summary}</span>
              </label>
            ))}
          </fieldset>
          <div className="vc-submit">
            <button type="submit" className="vc-btn vc-btn-primary" disabled={sending} aria-busy={sending}>
              {sending ? 'Sending invite…' : `Invite as ${role}`}
            </button>
            <p id="vc-feedback" role={feedback?.tone === 'error' ? 'alert' : 'status'} className={`vc-feedback ${feedback?.tone ?? ''}`}>{feedback?.text}</p>
          </div>
        </form>
      </section>
      {/* zone:hero:end */}

      {/* zone:board:start */}
      <section className="vc-board" data-zone="cards" aria-label="Members by role" aria-busy={store.loading}>
        {COLUMNS.map(col => {
          const people = store.members.filter(m => m.role === col);
          return (
            <div key={col} className={`vc-col vc-tone-${col.toLowerCase()}`}>
              <h2>{col}s <span>{store.loading ? '' : people.length}</span></h2>
              <p className="vc-col-desc">{ROLE_INFO[col].summary}</p>
              <ul>
                {store.loading && <li className="vc-card vc-skel" aria-hidden="true" />}
                {!store.loading && people.length === 0 && <li className="vc-empty">No one here yet.</li>}
                {people.map(m => (
                  <li key={m.email} className="vc-card">
                    <span className="vc-avatar" aria-hidden="true">{initials(m.name)}</span>
                    <span className="vc-who">
                      <strong>{m.name}{m.email === CURRENT_USER && ' (you)'}</strong>
                      <span>{m.email}</span>
                      <span className="vc-seen">Active {m.lastActive.toLowerCase()}</span>
                    </span>
                    {m.role === 'Owner'
                      ? <span className="vc-lock">Transfer in settings</span>
                      : <button type="button" className="vc-btn vc-btn-quiet" onClick={() => setManaging(m)} aria-label={`Manage ${m.name}`}>Manage</button>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        <div className="vc-col vc-col-pending" data-zone="pending">
          <h2>On the way <span>{store.loading ? '' : store.pending.length}</span></h2>
          <p className="vc-col-desc">Invited, not joined yet.</p>
          <ul>
            {!store.loading && store.pending.length === 0 && <li className="vc-empty">No open invites. Use the form above to bring someone aboard.</li>}
            {store.pending.map(p => (
              <li key={p.email} className="vc-card vc-card-pending">
                <span className="vc-avatar" aria-hidden="true">✉</span>
                <span className="vc-who">
                  <strong>{p.email}</strong>
                  <span>{p.role} · sent {p.sent.toLowerCase()}</span>
                </span>
                <button type="button" className="vc-btn vc-btn-quiet" onClick={() => store.revoke(p.email)} aria-label={`Revoke invite to ${p.email}`}>Revoke</button>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {/* zone:board:end */}

      <details className="vc-demo">
        <summary>About this preview</summary>
        <p>Sample people only; no email is sent.</p>
        <label><input type="checkbox" checked={store.simulateOutage} onChange={e => store.setSimulateOutage(e.target.checked)} /> Simulate a mail service outage</label>
      </details>

      <ManageDialog member={managing} onClose={() => setManaging(null)}
        onRole={(m, r) => { store.changeRole(m.email, r); setManaging(null); }}
        onRemove={m => { store.remove(m.email); setManaging(null); }} />

      <div className="vc-toast-slot" role="status" aria-live="polite">
        {store.undo && (
          <div className="vc-toast">
            <p>{store.undo.message}{store.undo.detail && <> {store.undo.detail}</>}</p>
            <button type="button" className="vc-btn vc-btn-primary" onClick={store.runUndo}>Undo</button>
            <button type="button" className="vc-btn vc-btn-quiet" onClick={store.dismissUndo}>Dismiss</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ManageDialog({ member, onClose, onRole, onRemove }: {
  member: Member | null; onClose: () => void; onRole: (m: Member, r: Role) => void; onRemove: (m: Member) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [choice, setChoice] = useState<Role>('Editor');
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (member) { setChoice(member.role); setConfirmRemove(false); if (!d.open) d.showModal(); }
    else if (d.open) d.close();
  }, [member]);

  const diff = member && choice !== member.role ? roleDiff(member.role, choice) : null;
  return (
    <dialog ref={ref} className="vc-dialog" onClose={onClose} aria-labelledby="vc-dialog-title">
      {member && (
        <div>
          <div className="vc-dialog-head">
            <span className="vc-avatar" aria-hidden="true">{initials(member.name)}</span>
            <div>
              <h2 id="vc-dialog-title">{member.name}</h2>
              <p>{member.email}</p>
            </div>
          </div>
          <fieldset className="vc-roles vc-roles-compact">
            <legend>Role</legend>
            {ASSIGNABLE.map(r => (
              <label key={r} className={`vc-role-card vc-tone-${r.toLowerCase()}`}>
                <input type="radio" name="vc-manage-role" value={r} checked={choice === r} onChange={() => setChoice(r)} />
                <span className="vc-role-name">{r}{r === member.role && ' · current'}</span>
                <span className="vc-role-desc">{ROLE_INFO[r].summary}</span>
              </label>
            ))}
          </fieldset>
          {diff && (
            <div className="vc-diff" role="status">
              {diff.gains.length > 0 && <p><strong>Will be able to:</strong> {diff.gains.join(', ').toLowerCase()}.</p>}
              {diff.loses.length > 0 && <p><strong>Will no longer:</strong> {diff.loses.join(', ').toLowerCase()}.</p>}
            </div>
          )}
          <div className="vc-dialog-actions">
            <button type="button" className="vc-btn vc-btn-quiet" onClick={onClose}>Cancel</button>
            <button type="button" className="vc-btn vc-btn-primary" disabled={!diff} onClick={() => onRole(member, choice)}>
              {diff ? `Make ${member.name.split(' ')[0]} ${choice === 'Admin' ? 'an' : 'a'} ${choice}` : 'Choose a new role'}
            </button>
          </div>
          <div className="vc-danger">
            {!confirmRemove ? (
              <button type="button" className="vc-btn vc-btn-danger-quiet" onClick={() => setConfirmRemove(true)}>Remove from workspace…</button>
            ) : (
              <div role="group" aria-label="Confirm removal">
                <p>{member.name} will lose access right away. Their documents stay, and you can undo for a few seconds.</p>
                <div className="vc-dialog-actions">
                  <button type="button" className="vc-btn vc-btn-quiet" onClick={() => setConfirmRemove(false)} autoFocus>Keep {member.name.split(' ')[0]}</button>
                  <button type="button" className="vc-btn vc-btn-danger" onClick={() => onRemove(member)}>Remove {member.name.split(' ')[0]}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
