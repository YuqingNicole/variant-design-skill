import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import data from '@/review-data.json';
type WorkspaceId=keyof typeof data.workspaces;
function useReviewState(){
 const [id,setId]=useState<WorkspaceId>('studio'),[values,setValues]=useState(data.workspaces),frame=useRef<number|undefined>(undefined);
 const workspace=values[id],canAnimate=workspace.role==='owner';
 const progress=(value:number)=>setValues(prev=>({...prev,[id]:{...prev[id],progress:value}}));
 useEffect(()=>{const preference=matchMedia('(prefers-reduced-motion: reduce)'),settle=()=>{if(preference.matches){cancelAnimationFrame(frame.current??0);progress(100)}};preference.addEventListener('change',settle);return()=>{preference.removeEventListener('change',settle);cancelAnimationFrame(frame.current??0)}},[id]);
 const start=()=>{if(!canAnimate)return;cancelAnimationFrame(frame.current??0);if(matchMedia('(prefers-reduced-motion: reduce)').matches){progress(100);return}const tick=()=>{progress(50);frame.current=requestAnimationFrame(tick)};tick()};
 const inspect=()=>setValues(prev=>({...prev,[id]:{...prev[id],activity:prev[id].activity+1}}));
 const switchWorkspace=(next:string)=>{if(next==='studio'||next==='archive'){cancelAnimationFrame(frame.current??0);setId(next)}};
 return {title:data.title,id,workspace,canAnimate,start,inspect,switchWorkspace,workspaces:data.workspaces};
}
const ReviewContext=createContext<ReturnType<typeof useReviewState>|null>(null);
export function ReviewProvider({children}:{children:ReactNode}){return <ReviewContext.Provider value={useReviewState()}>{children}</ReviewContext.Provider>}
export function useReview(){const value=useContext(ReviewContext);if(!value)throw new Error('Original ReviewProvider required');return value}
