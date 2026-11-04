import { createContext, useContext, useState, type ReactNode } from 'react';
import workspaces from '@/workspaces.json';
type WorkspaceId=keyof typeof workspaces;
function useWorkspaceState(){
 const [id,setId]=useState<WorkspaceId>('north'),[paid,setPaid]=useState<string[]>([]),[query,setQuery]=useState(''),[status,setStatus]=useState('all');
 const workspace=workspaces[id],canPay=workspace.role==='owner';
 const invoices=workspace.invoices.map(i=>({...i,status:paid.includes(i.id)?'paid':i.status}));
 const rows=invoices.filter(i=>(status==='all'||i.status===status)&&[i.id,i.client].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 const switchWorkspace=(next:string)=>{if(next==='north'||next==='south'){setId(next);setQuery('');setStatus('all')}};
 const markPaid=(invoiceId:string)=>{if(canPay&&invoices.some(i=>i.id===invoiceId&&i.status==='open'))setPaid(p=>p.includes(invoiceId)?p:[...p,invoiceId])};
 return {id,workspace,invoices,rows,query,setQuery,status,setStatus,switchWorkspace,canPay,markPaid,openTotal:invoices.filter(i=>i.status==='open').reduce((n,i)=>n+i.cents,0)};
}
const WorkspaceContext=createContext<ReturnType<typeof useWorkspaceState>|null>(null);
export function WorkspaceProvider({children}:{children:ReactNode}){return <WorkspaceContext.Provider value={useWorkspaceState()}>{children}</WorkspaceContext.Provider>}
export function useDesk(){const value=useContext(WorkspaceContext);if(!value)throw new Error('Workshop Ledger requires the original WorkspaceProvider');return value}
export const money=(cents:number)=>`${__APP_CURRENCY__} ${(cents/100).toFixed(2)}`;
