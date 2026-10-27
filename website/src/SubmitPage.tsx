import { useEffect, useState } from 'react';
import type { Language } from './direction-engine';
import { SiteHeader, SiteFooter } from './SiteChrome';
import './content-pages.css';
const repo='https://github.com/YuqingNicole/variant-design-skill';
type Copy=[string,string];
// Public content policy for the direction library (RFC-002 §5). Keep in step with docs/rfc/002-direction-library.md.
const sources:{id:string;name:Copy;rule:Copy;images:Copy}[]=[
 {id:'own',name:['自产作品','Our own work'],rule:['用 Variant Design 在示例项目里实际跑出来的方向，附带产出记录作为证据。','Directions actually produced with Variant Design in a sample project, with the output history as evidence.'],images:['可以托管','Hosted']},
 {id:'permission',name:['授权投稿','Licensed submissions'],rule:['作者明确授权在本站展示的作品。授权记录随作品一起保存。','Work whose author has granted permission to show it here. The permission is stored with the entry.'],images:['按授权范围托管','Hosted within the granted scope']},
 {id:'link-only',name:['外部参考','External references'],rule:['公开作品，只有我们自己写的分析和原站链接。','Public work, shown only through our own notes and a link to the source.'],images:['不托管对方的截图、商标或素材','None of their screenshots, marks or assets are hosted']},
];
const permission:Copy[]=[
 ['授权人姓名或团队名称，以及你有权授权这件作品的说明','Your name or team, and why you hold the rights to grant permission'],
 ['作品名称和原始链接','The work’s title and original link'],
 ['授权范围：在本站作品页、分类页和分享卡片中展示','Scope: shown on this site’s entry, category pages and share cards'],
 ['署名方式：希望显示的名字和链接','Credit: the name and link you want shown'],
 ['授权日期。你可以随时撤回授权','Date of permission. You can withdraw it at any time'],
];
const steps:Copy[]=[
 ['在 GitHub 开一个 Issue，选择「作品投稿」模板，填写作品信息和上面的授权内容。','Open a GitHub issue with the “Submission” template, including the work and the permission details above.'],
 ['我们会审核作品是否符合收录标准：能作为一个清晰的设计方向，并且可以写出它优化什么、牺牲什么、适合什么场景。','We review whether it works as a clear design direction we can describe: what it optimizes, what it trades off and where it fits.'],
 ['收录后，作品和授权记录会以代码评审的方式加入仓库，修改历史公开可查。','Accepted entries and their permission records are added through code review, with a public history.'],
];
const takedown:Copy[]=[
 ['如果本站展示了你的作品而你不同意，请开一个「撤下请求」Issue，写明作品链接和你的身份。','If this site shows your work without your agreement, open a “Takedown request” issue with the link and who you are.'],
 ['我们会先下线相关内容，再核实；处理结果在 Issue 里回复并留档。','We take the content down first and verify afterwards; the outcome is recorded in the issue.'],
];
export function SubmitPage(){
 const [language,setLanguage]=useState<Language>(()=>localStorage.getItem('variant-language')==='en'?'en':'zh');const zh=language==='zh',ix=zh?0:1;
 useEffect(()=>{document.title=zh?'投稿与授权 — Variant Design':'Submissions & permissions — Variant Design';document.documentElement.lang=zh?'zh-CN':'en';localStorage.setItem('variant-language',language);document.querySelector('meta[name="description"]')?.setAttribute('content',zh?'Variant Design 方向库的收录、授权与撤下规则。':'How the Variant Design direction library accepts, licenses and removes work.');},[language,zh]);
 return <main className="content-page submit-page"><SiteHeader language={language} onLanguage={()=>setLanguage(zh?'en':'zh')}/>
  <header className="content-hero site-shell"><p className="content-kicker">SUBMISSIONS / PERMISSIONS</p><h1>{zh?'投稿与授权':'Submissions & permissions'}</h1><p>{zh?'方向库只展示我们自己做的作品、作者授权的作品，以及只附链接的外部参考。':'The direction library shows our own work, work its authors have licensed, and external references shown only as links.'}</p></header>
  <section className="content-reading site-shell">
   <h2>{zh?'三类作品':'Three kinds of entries'}</h2>
   <ul className="submit-sources">{sources.map(s=><li key={s.id} data-source={s.id}><strong>{s.name[ix]}</strong> — {s.rule[ix]} <em>{s.images[ix]}</em></li>)}</ul>
   <h2>{zh?'授权需要包含':'A permission includes'}</h2><ul>{permission.map((p,i)=><li key={i}>{p[ix]}</li>)}</ul>
   <h2>{zh?'如何投稿':'How to submit'}</h2><ol>{steps.map((p,i)=><li key={i}>{p[ix]}</li>)}</ol>
   <h2>{zh?'撤下请求':'Takedown requests'}</h2><ul>{takedown.map((p,i)=><li key={i}>{p[ix]}</li>)}</ul>
   <a href={`${repo}/issues/new/choose`} target="_blank" rel="noreferrer">{zh?'在 GitHub 提交 ↗':'Submit on GitHub ↗'}</a>
  </section><SiteFooter language={language}/></main>;
}
