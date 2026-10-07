import { useEffect, useState } from 'react';
import { CapabilityShowcase, type ShowcaseDirection } from './CapabilityShowcase';
export function ShowcasePage(){
 const params=new URLSearchParams(location.search);const language=params.get('language')==='en'?'en':'zh';const value=params.get('direction');const direction:ShowcaseDirection=value==='B'||value==='C'?value:'A';
 const [scale,setScale]=useState(Math.min(1,innerWidth/1200));
 useEffect(()=>{document.documentElement.lang=language==='zh'?'zh-CN':'en';document.title='Forma — Design study';const resize=()=>setScale(Math.min(1,innerWidth/1200));window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)},[language]);
 return <main style={{background:'#fbfcf9',minHeight:'100vh',overflow:'hidden'}}><div style={{width:1200,height:760,transform:`scale(${scale})`,transformOrigin:'top left',marginBottom:760*(scale-1)}}><CapabilityShowcase direction={direction} language={language}/></div></main>
}
