import { SubmissionForm } from './SubmissionForm';
import { t, type Localized } from './i18n/localized';
import { useEffect } from 'react';
import { SiteHeader, SiteFooter } from './SiteChrome';
import './content-pages.css';
import { useLocale } from './i18n/LocaleProvider';
const m={submissionsPermissionsVariantDesign:{zh:'投稿与授权 — Variant Design',en:'Submissions & permissions — Variant Design'},
 howTheVariantDesign:{zh:'Variant Design 方向库的收录、授权与撤下规则。',en:'How the Variant Design direction library accepts, licenses and removes work.'},
 submissionsPermissions:{zh:'投稿与授权',en:'Submissions & permissions'},
 theDirectionLibraryShows:{zh:'方向库只展示我们自己做的作品、作者授权的作品，以及只附链接的外部参考。',en:'The direction library shows our own work, work its authors have licensed, and external references shown only as links.'},
 threeKindsOfEntries:{zh:'三类作品',en:'Three kinds of entries'},
 aPermissionIncludes:{zh:'授权需要包含',en:'A permission includes'},
 howToSubmit:{zh:'如何投稿',en:'How to submit'},
 takedownRequests:{zh:'撤下请求',en:'Takedown requests'},
 submitOnGithub:{zh:'在 GitHub 提交 ↗',en:'Submit on GitHub ↗'}} satisfies Record<string,Localized>;
const repo='https://github.com/YuqingNicole/variant-design-skill';
// Public content policy for the direction library (RFC-002 §5). Keep in step with docs/rfc/002-direction-library.md.
const sources:{id:string;name:Localized;rule:Localized;images:Localized}[]=[
 {id:'own',name:{zh:'自产作品',en:'Our own work'},rule:{zh:'用 Variant Design 在示例项目里实际跑出来的方向，附带产出记录作为证据。',en:'Directions actually produced with Variant Design in a sample project, with the output history as evidence.'},images:{zh:'可以托管',en:'Hosted'}},
 {id:'permission',name:{zh:'授权投稿',en:'Licensed submissions'},rule:{zh:'作者明确授权在本站展示的作品。授权记录随作品一起保存。',en:'Work whose author has granted permission to show it here. The permission is stored with the entry.'},images:{zh:'从作者提供的地址加载，仅限本站展示',en:'Loaded from the author’s URL for display on this site'}},
 {id:'link-only',name:{zh:'外部参考',en:'External references'},rule:{zh:'公开作品，只有我们自己写的分析和原站链接。',en:'Public work, shown only through our own notes and a link to the source.'},images:{zh:'不转存对方的截图、商标或素材；网站显示其公开分享预览，X 卡片直接加载帖子视频，详情用官方嵌入；媒体失效时保留封面或分析卡',en:'No screenshots, marks or assets are copied into this repository. Sites use their published previews; X cards load post video and details use the official embed. Media failures retain a poster or analysis card'}},
];
const permission:Localized[]=[
 {zh:'授权人姓名或团队名称，以及你有权授权这件作品的说明',en:'Your name or team, and why you hold the rights to grant permission'},
 {zh:'作品名称和原始链接',en:'The work’s title and original link'},
 {zh:'授权范围：在本站作品流和详情展示；不包含下载、复用或商业使用',en:'Scope: display in the feed and detail pages; no download, reuse or commercial-use rights'},
 {zh:'署名方式：希望显示的名字和链接',en:'Credit: the name and link you want shown'},
 {zh:'授权日期。你可以随时撤回授权',en:'Date of permission. You can withdraw it at any time'},
];
const steps:Localized[]=[
 {zh:'用上方表单准备投稿，或直接在 GitHub 选择「作品投稿」模板，填上媒体地址、署名和授权。',en:'Prepare a draft above, or open the “Submission” GitHub template with your media URLs, credit and permission details.'},
 {zh:'我们会审核作品是否符合收录标准：能作为一个清晰的设计方向，并且可以写出它优化什么、牺牲什么、适合什么场景。',en:'We review whether it works as a clear design direction we can describe: what it optimizes, what it trades off and where it fits.'},
 {zh:'收录后，编辑笔记、授权证据和审核记录经代码评审加入登记；媒体保留在作者提供的地址，修改历史公开可查。',en:'Accepted entries, permission evidence and review records enter the registry through code review. Media stays at the supplied URL; the record has a public history.'},
];
const takedown:Localized[]=[
 {zh:'如果本站展示了你的作品而你不同意，请开一个「撤下请求」Issue，写明作品链接和你的身份。',en:'If this site shows your work without your agreement, open a “Takedown request” issue with the link and who you are.'},
 {zh:'我们会先下线相关内容，再核实；处理结果在 Issue 里回复并留档。',en:'We take the content down first and verify afterwards; the outcome is recorded in the issue.'},
];
export function SubmitPage(){
 const language = useLocale();const zh=language==='zh';
 useEffect(()=>{document.title=t(m.submissionsPermissionsVariantDesign,language);document.documentElement.lang=t({zh:'zh-CN',en:'en'},language);document.querySelector('meta[name="description"]')?.setAttribute('content',t(m.howTheVariantDesign,language));},[language,zh]);
 return <main className="content-page submit-page"><SiteHeader language={language}/>
  <header className="content-hero site-shell"><h1>{t(m.submissionsPermissions,language)}</h1><p>{t(m.theDirectionLibraryShows,language)}</p></header>
  <section className="content-reading site-shell">
   <SubmissionForm/>
   <h2>{t(m.threeKindsOfEntries,language)}</h2>
   <ul className="submit-sources">{sources.map(s=><li key={s.id} data-source={s.id}><strong>{t(s.name,language)}</strong> — {t(s.rule,language)} <em>{t(s.images,language)}</em></li>)}</ul>
   <h2>{t(m.aPermissionIncludes,language)}</h2><ul>{permission.map((p,i)=><li key={i}>{t(p,language)}</li>)}</ul>
   <h2>{t(m.howToSubmit,language)}</h2><ol>{steps.map((p,i)=><li key={i}>{t(p,language)}</li>)}</ol>
   <h2>{t(m.takedownRequests,language)}</h2><ul>{takedown.map((p,i)=><li key={i}>{t(p,language)}</li>)}</ul>
   <a href={`${repo}/issues/new/choose`} target="_blank" rel="noreferrer">{t(m.submitOnGithub,language)}</a>
  </section><SiteFooter language={language}/></main>;
}
