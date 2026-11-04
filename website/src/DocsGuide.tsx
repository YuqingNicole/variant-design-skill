import { useState } from 'react';
import type { Language } from './direction-engine';
import { agents, clone, deliver, faq, handoff, installCommand, nav, otherUses, outcomes, prerequisites, prompts, refine, repository, systemChecks, text, verify } from './docs-content';
import { t, type Localized } from './i18n/localized';
import { localePath } from './i18n/locale-route';
const m={copiedRunThisIn:{zh:'已复制。请在你的项目中执行。',en:'Copied. Run this in your project.'},
 sharedDependencyCoverage:{zh:'验证记录和接入计划会绑定已跟踪的共享源码、样式、资源与配置。它们变化后需要重新检查或准备计划；无法识别的依赖和缺失工具必须明确标为未验证。',en:'Verification records and integration plans bind tracked shared source, styles, assets and configuration. Changes require fresh checks or plans; unresolved dependencies and missing tools must remain explicitly unverified.'},
 previewOwnership:{zh:'预览重建和清理会保留已有文件及你后来修改过的文件。发生冲突时，让 Agent 保留旧文件并选择新的预览路径；交付时请它一并提供清理方式。',en:'Preview rebuilds and cleanup preserve existing files and your later edits. If a conflict occurs, ask your agent to keep the old files and use a fresh preview path, and include cleanup instructions with the handoff.'},
 clipboardUnavailableSelectAnd:{zh:'无法访问剪贴板，请选择文本框中的内容手动复制。',en:'Clipboard unavailable. Select and copy the text manually.'},
 chooseYourAgent:{zh:'选择 Agent',en:'Choose your agent'},
 otherAgents:{zh:'其他 Agent',en:'Other agents'},
 installCommand:{zh:'安装命令',en:'Install command'},
 copyInstallCommand:{zh:'复制安装命令',en:'Copy install command'},
 checkCommand:{zh:'检查命令',en:'Check command'},
 checkPrompt:{zh:'确认指令',en:'Check prompt'},
 copyCheckPrompt:{zh:'复制确认指令',en:'Copy check prompt'},
 repositoryInstallationNotes:{zh:'仓库安装说明 ↗',en:'Repository installation notes ↗'},
 firstProjectPrompt:{zh:'首次生成指令',en:'First project prompt'},
 copyFirstPrompt:{zh:'复制首次指令',en:'Copy first prompt'},
 integrationPrompt:{zh:'接入指令',en:'Integration prompt'},
 copyIntegrationPrompt:{zh:'复制接入指令',en:'Copy integration prompt'},
 seeThisSiteGo:{zh:'看本站走完整个流程的记录 ↗',en:'See this site go through the whole loop ↗'}} satisfies Record<string,Localized>;
function Commands({rows,language}:{rows:[string|Localized,Localized][];language:Language}){return <div className="docs-commands">{rows.map(([c,d])=>{const label=typeof c==='string'?c:t(c,language);return <div className="docs-command" key={label}><code>{label}</code><p>{t(d,language)}</p></div>})}</div>}
export function DocsGuide({language}:{language:Language}){
 const [agent,setAgent]=useState('codex');const [notice,setNotice]=useState('');const current=agents.find(a=>a.id===agent)!;
 const install=agent==='codex'?installCommand:clone(current.path);const [firstPrompt,checkPrompt,exportPrompt]=[t(prompts.first,language),t(prompts.check,language),t(prompts.integrate,language)];
 async function copy(value:string){try{await navigator.clipboard.writeText(value);setNotice(t(m.copiedRunThisIn,language))}catch{setNotice(t(m.clipboardUnavailableSelectAnd,language))}}
 return <div className="site-shell docs-layout"><aside>{nav.map(([id,l],i)=><a key={id} href={`#${id}`}>{id==='faq'?'—':`0${i}`} / {t(l,language)}</a>)}</aside><div className="content-reading">
 <section id="before"><h2>{t(text.before,language)}</h2><ul>{prerequisites.map(p=><li key={p.en}>{t(p,language)}</li>)}</ul></section>
 <section id="install"><h2>{t(text.install,language)}</h2><p>{t(text.installIntro,language)}</p><div className="docs-tabs" role="group" aria-label={t(m.chooseYourAgent,language)}>{agents.map(a=><button key={a.id} aria-pressed={agent===a.id} onClick={()=>setAgent(a.id)}>{a.label||(t(m.otherAgents,language))}</button>)}</div><textarea readOnly aria-label={t(m.installCommand,language)} value={install} rows={3}/><button className="content-button" onClick={()=>copy(install)}>{t(m.copyInstallCommand,language)}</button><p>{t(current.note,language)}</p><h3>{t(text.confirm,language)}</h3><p>{t(text.confirmNode,language)}</p><textarea readOnly aria-label={t(m.checkCommand,language)} value={verify(current.path,language==='zh')} rows={2}/><p>{t(text.confirmPrompt,language)}</p><textarea readOnly aria-label={t(m.checkPrompt,language)} value={checkPrompt} rows={2}/><button className="content-button" onClick={()=>copy(checkPrompt)}>{t(m.copyCheckPrompt,language)}</button><p className="content-link"><a href={`${repository}#installation`} target="_blank" rel="noreferrer">{t(m.repositoryInstallationNotes,language)}</a></p></section>
 <section id="first-project"><h2>{t(text.firstProject,language)}</h2><p>{t(text.firstIntro,language)}</p><textarea readOnly aria-label={t(m.firstProjectPrompt,language)} value={firstPrompt} rows={7}/><button className="content-button" onClick={()=>copy(firstPrompt)}>{t(m.copyFirstPrompt,language)}</button><h3>{t(text.outcomes,language)}</h3><ul>{outcomes.map(o=><li key={o.en}>{t(o,language)}</li>)}</ul></section>
 <section id="refine"><h2>{t(text.refine,language)}</h2><p>{t(text.refineIntro,language)}</p><p>{t(m.previewOwnership,language)}</p><Commands rows={refine} language={language}/></section>
 <section id="deliver"><h2>{t(text.deliver,language)}</h2><Commands rows={deliver} language={language}/><p>{t(systemChecks,language)}</p><p>{t(m.sharedDependencyCoverage,language)}</p><p>{t(text.integrate,language)}</p><textarea readOnly aria-label={t(m.integrationPrompt,language)} value={exportPrompt} rows={3}/><button className="content-button" onClick={()=>copy(exportPrompt)}>{t(m.copyIntegrationPrompt,language)}</button><h3>{t(text.handoff,language)}</h3><ul>{handoff.map(h=><li key={h.en}>{t(h,language)}</li>)}</ul><p className="content-link"><a href={localePath('/d/variant-site',language)}>{t(m.seeThisSiteGo,language)}</a></p></section>
 <section id="more"><h2>{t(text.more,language)}</h2><p>{t(text.moreIntro,language)}</p><Commands rows={otherUses} language={language}/></section>
 <section id="faq"><h2>{t(text.faq,language)}</h2>{faq.map(([q,a])=><details key={q.en}><summary>{t(q,language)}</summary><p>{t(a,language)}</p></details>)}</section><p role="status" className="docs-notice">{notice}</p></div></div>
}
