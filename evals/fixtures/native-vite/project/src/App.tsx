import { useDesk, money } from '@/workspace';
import logo from '@/workshop-mark.svg';
export default function App(){
 const d=useDesk();return <main className="desk"><header className="desk-header"><img src={logo} alt="Workshop mark" width="32" height="32"/><div><p>Workshop Ledger</p><h1><span data-testid="workspace-name">{d.workspace.name}</span> invoices</h1></div><label>Workspace<select aria-label="Workspace" value={d.id} onChange={e=>d.switchWorkspace(e.target.value)}><option value="north">North Studio</option><option value="south">South Field</option></select></label></header>
  <section className="desk-summary"><h2>Collect what is due</h2><p>Open balance <strong data-testid="open-total">{money(d.openTotal)}</strong></p><p data-testid="workspace-role">{d.canPay?'Owner':'Read only'}</p></section>
  <div className="desk-tools"><label>Search invoices<input aria-label="Search invoices" value={d.query} onChange={e=>d.setQuery(e.target.value)}/></label><label>Status<select aria-label="Status" value={d.status} onChange={e=>d.setStatus(e.target.value)}><option value="all">All</option><option value="open">Open</option><option value="paid">Paid</option></select></label></div>
  <section aria-label="Invoice list">{d.rows.length?d.rows.map(i=><article className="invoice-row" data-testid="invoice-row" data-invoice-id={i.id} key={i.id}><div><strong>{i.client}</strong><p>{i.id}</p></div><span>{money(i.cents)}</span><span data-testid="invoice-status">{i.status==='paid'?'Paid':'Open'}</span>{i.status==='open'&&<button disabled={!d.canPay} onClick={()=>d.markPaid(i.id)} aria-label={`Mark ${i.id} paid`}>Mark paid</button>}</article>):<p data-testid="empty-state">No matching invoices. Clear your search or filter.</p>}</section>
 </main>;
}
