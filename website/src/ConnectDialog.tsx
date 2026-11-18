import { useEffect, useRef, useState } from 'react';
import type { Language } from './direction-engine';
import { t, type Localized } from './i18n/localized';
import { localePath } from './i18n/locale-route';
import { installCommand, prompts, repository } from './docs-content';

// Styles are in connect.css, loaded with the other site styles (site-styles.ts) so no stylesheet is added by this lazy chunk.
// "Connect" in the header: pick an agent, copy one command, paste one prompt. The commands are the README's (Claude Code plugin
// marketplace, Codex skills directory); /docs/install stays the full guide and /install/agent.md the hands-off route.
const agentGuide='https://variantdesign.xyz/install/agent.md';
const claudeCommand=`claude plugin marketplace add ${repository.replace('https://github.com/','')}\nclaude plugin install variant-design@variant-design`;
const m={
 title:{zh:'接入技能',en:'Connect the skill'},
 lead:{zh:'选你用的智能体，复制一条命令，再贴一条指令。装的是完整目录，装好后新开一个会话。',en:'Pick your agent, copy one command, paste one prompt. It installs the complete directory; open a new session afterwards.'},
 close:{zh:'关闭',en:'Close'},
 choose:{zh:'选择智能体',en:'Choose your agent'},
 step1:{zh:'1. 在终端运行',en:'1. Run in your terminal'},
 step2:{zh:'2. 在你的项目里新开会话，贴上这条',en:'2. Open a new session in your project and paste'},
 copy:{zh:'复制',en:'Copy'},
 copied:{zh:'已复制',en:'Copied'},
 manual:{zh:'无法访问剪贴板，请选中文字手动复制。',en:'Clipboard unavailable. Select the text and copy it manually.'},
 or:{zh:'或者让智能体自己装：对它说“读 ' + agentGuide + '”。',en:'Or let your agent do it: tell it to read ' + agentGuide + '.'},
 guide:{zh:'完整安装指南',en:'Full install guide'},
 codexNote:{zh:'技能目录不是默认位置的话，换成你自己的路径。',en:'If your skills root is elsewhere, use that path instead.'},
} satisfies Record<string,Localized>;
const agents=[{id:'claude',label:'Claude Code',command:claudeCommand},{id:'codex',label:'Codex',command:installCommand}] as const;

export default function ConnectDialog({language,onClose}:{language:Language;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 const [agent,setAgent]=useState<(typeof agents)[number]['id']>('claude');
 const [notice,setNotice]=useState('');
 useEffect(()=>{const d=ref.current;if(d&&!d.open)d.showModal()},[]);
 const current=agents.find(a=>a.id===agent)!;
 async function copy(value:string,what:string){try{await navigator.clipboard.writeText(value);setNotice(`${t(m.copied,language)}: ${what}`)}catch{setNotice(t(m.manual,language))}}
 return <dialog ref={ref} className="connect-dialog" aria-labelledby="connect-title" onClose={onClose} onClick={e=>{if(e.target===ref.current)ref.current?.close()}}>
  <button type="button" className="account-close" onClick={()=>ref.current?.close()} aria-label={t(m.close,language)}><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/></svg></button>
  <h2 id="connect-title">{t(m.title,language)}</h2>
  <p>{t(m.lead,language)}</p>
  <div className="connect-agents" role="group" aria-label={t(m.choose,language)}>{agents.map(a=><button key={a.id} type="button" aria-pressed={a.id===agent} onClick={()=>{setAgent(a.id);setNotice('')}}>{a.label}</button>)}</div>
  <h3>{t(m.step1,language)}</h3>
  <pre className="connect-code" tabIndex={0}>{current.command}</pre>
  {agent==='codex'&&<p className="connect-note">{t(m.codexNote,language)}</p>}
  <button type="button" className="connect-copy" onClick={()=>copy(current.command,current.label)}>{t(m.copy,language)}</button>
  <h3>{t(m.step2,language)}</h3>
  <pre className="connect-code" tabIndex={0}>{t(prompts.check,language)}</pre>
  <button type="button" className="connect-copy" onClick={()=>copy(t(prompts.check,language),'prompt')}>{t(m.copy,language)}</button>
  <p role="status" className="connect-status">{notice}</p>
  <p className="connect-foot">{t(m.or,language)} <button type="button" className="account-link" onClick={()=>copy(agentGuide,'URL')}>{t(m.copy,language)}</button> · <a href={localePath('/docs/install',language)}>{t(m.guide,language)}</a></p>
 </dialog>;
}
