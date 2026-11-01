import { useEffect, useState } from 'react';
// Shared pieces for the reference motion studies.
export type Copy=[string,string];
export const still=()=>typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
// Advances 0…count-1 every `ms` while playing, starting over each time play starts. Paused or with reduced
// motion it rests on `rest`, the state that explains the idea best, so grid thumbnails are never blank.
export function useStep(play:boolean,count:number,ms:number,rest=count-1){const [step,setStep]=useState(0);const reduced=still();
 useEffect(()=>{if(reduced||!play)return;setStep(0);const id=setInterval(()=>setStep(s=>(s+1)%count),ms);return()=>clearInterval(id)},[play,count,ms,reduced]);return reduced||!play?rest:step}
export const Check=()=><svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.5 5 9l4.5-6"/></svg>;
