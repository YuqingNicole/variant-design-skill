import { useState } from 'react';
type Role = 'Owner' | 'Admin' | 'Editor' | 'Viewer';
type Member = { name: string; email: string; role: Role; lastActive: string };
const initial: Member[] = [
  { name: 'Mei Lin', email: 'mei@harbor.dev', role: 'Owner', lastActive: 'Today' },
  { name: 'Jonas Berg', email: 'jonas@harbor.dev', role: 'Admin', lastActive: 'Yesterday' },
  { name: 'Ama Owusu', email: 'ama@harbor.dev', role: 'Editor', lastActive: '3 days ago' },
  { name: 'Ravi Shah', email: 'ravi@harbor.dev', role: 'Viewer', lastActive: '2 weeks ago' },
];
// Harbor: a shared workspace for small product teams. This page manages who can do what.
export function MembersPage() {
  const [members, setMembers] = useState(initial);
  const [pending, setPending] = useState<string[]>(['lea@studio.io']);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Editor');
  const invite = (e: React.FormEvent) => { e.preventDefault(); if (!/^\S+@\S+\.\S+$/.test(email)) return; setPending([...pending, email]); setEmail(''); };
  return (
    <main>
      <h1>Members</h1>
      <p>Manage who can access the Harbor workspace and what they can change.</p>
      <form onSubmit={invite} aria-label="Invite a member">
        <label>Email <input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Role <select value={role} onChange={e => setRole(e.target.value as Role)}>{['Admin', 'Editor', 'Viewer'].map(r => <option key={r}>{r}</option>)}</select></label>
        <button type="submit">Send invite</button>
      </form>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Last active</th><th></th></tr></thead>
        <tbody>{members.map(m => (
          <tr key={m.email}><td>{m.name}</td><td>{m.email}</td>
            <td><select aria-label={`Role for ${m.name}`} value={m.role} disabled={m.role === 'Owner'} onChange={e => setMembers(members.map(x => x.email === m.email ? { ...x, role: e.target.value as Role } : x))}>{['Owner', 'Admin', 'Editor', 'Viewer'].map(r => <option key={r}>{r}</option>)}</select></td>
            <td>{m.lastActive}</td>
            <td>{m.role !== 'Owner' && <button onClick={() => setMembers(members.filter(x => x.email !== m.email))}>Remove</button>}</td></tr>))}
        </tbody>
      </table>
      <h2>Pending invites</h2>
      <ul>{pending.map(p => <li key={p}>{p} <button onClick={() => setPending(pending.filter(x => x !== p))}>Revoke</button></li>)}</ul>
      <p>Owners can transfer ownership from workspace settings.</p>
    </main>
  );
}
