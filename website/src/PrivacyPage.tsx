import { useEffect, type ReactNode } from 'react';
import type { Language } from './direction-engine';
import { t, type Localized } from './i18n/localized';
import { SiteHeader, SiteFooter } from './SiteChrome';
import './content-pages.css';
import './home.css';
import { useLocale } from './i18n/LocaleProvider';
// What the site keeps and requests, checked against the code (docs/drafts/measurement-method.md §5, docs/accounts.md).
// When accounts, storage keys, analytics or third-party requests change, change this page in the same commit.
const updated = '2026-11-18';
const issues = 'https://github.com/YuqingNicole/variant-design-skill/issues/new';
const m={
 title:{zh:'隐私说明',en:'Privacy'},
 lead:{zh:'Variant Design 网站收集什么、存在哪里、用来做什么。不登录也能浏览、搜索和查看所有参考；只有收藏和生成参考指令需要账号。',en:'What the Variant Design site collects, where it is kept and what it is used for. Browsing, search and every reference detail work without an account; only saving and generating briefs need one.'},
 updated:{zh:`更新于 ${updated}`,en:`Updated ${updated}`},
 account:{zh:'账号',en:'Your account'},
 browser:{zh:'存在浏览器里的',en:'In your browser'},
 others:{zh:'第三方服务',en:'Third-party services'},
 tracking:{zh:'统计和广告',en:'Analytics and ads'},
 contact:{zh:'联系与变更',en:'Contact and changes'},
 metaTitle:{zh:'隐私说明 — Variant Design',en:'Privacy — Variant Design'},
 metaDescription:{zh:'Variant Design 网站收集什么、存在哪里、用来做什么，以及怎样删除账号。',en:'What the Variant Design site collects, where it is kept, what it is used for and how to delete your account.'},
} satisfies Record<string,Localized>;
type Row={title:Localized;text:Localized};
const account:Row[]=[
 {title:{zh:'保存什么',en:'What we keep'},text:{zh:'你的邮箱；用 Google 登录时，还有 Google 提供的名字和头像；你收藏的参考和写的笔记。为了登录安全，Supabase 还会记录登录时间和 IP 地址等日志。',en:'Your email; with Google sign-in, the name and picture Google provides; the references you save and the notes you write. For sign-in security, Supabase also logs details such as sign-in times and IP addresses.'}},
 {title:{zh:'用来做什么',en:'What it is for'},text:{zh:'让你登录，并在不同设备上同步收藏。我们可能看不对应到个人的汇总数字（比如一条参考被收藏了多少次）来改进灵感库。不用你的邮箱发营销邮件，不出售，也不交给赞助方。',en:'Signing you in and syncing your saves across devices. We may look at totals that do not identify anyone (such as how many times a reference was saved) to improve the library. Your email is not used for marketing, not sold and not given to sponsors.'}},
 {title:{zh:'存在哪里',en:'Where it is kept'},text:{zh:'维护者的 Supabase 项目。数据库按账号隔离：每个账号只能读写自己的收藏。',en:'In the maintainer’s Supabase project. The database separates accounts: each account can read and write only its own saves.'}},
 {title:{zh:'删除',en:'Deleting it'},text:{zh:'在页头的账号菜单里选“删除账号”，账号和全部收藏会立即删除，无法恢复。',en:'Choose “Delete account” in the account menu in the header. The account and all its saves are deleted at once and cannot be restored.'}},
];
const browser:Row[]=[
 {title:{zh:'参考包',en:'Reference pack'},text:{zh:'没登录时，参考包和笔记只存在这个浏览器里（`variant-inspiration-pack-v1`）。第一次登录时它们合并进账号，然后从浏览器删除。',en:'Without an account, the pack and its notes live only in this browser (`variant-inspiration-pack-v1`). On your first sign-in they are merged into the account, then removed from the browser.'}},
 {title:{zh:'登录状态',en:'Sign-in'},text:{zh:'登录后，Supabase 把登录凭证存在浏览器里（以 `sb-` 开头的一项）。`variant-account-pending` 记住登录前想收藏的那条参考，一小时后失效。',en:'Once you sign in, Supabase keeps the session in the browser (an item starting with `sb-`). `variant-account-pending` remembers the reference you wanted to save before signing in, and expires after an hour.'}},
 {title:{zh:'偏好和实验室',en:'Preferences and the lab'},text:{zh:'语言选择（`variant-language`）；`/lab` 的画布和工作台把你的项目存在这个浏览器里，不上传。',en:'Your language choice (`variant-language`); the canvas and workbench at `/lab` keep your projects in this browser and do not upload them.'}},
 {title:{zh:'离线缓存',en:'Offline cache'},text:{zh:'网站注册了一个 service worker（`/sw.js`），在你的设备上存三类东西：离线提示页、带版本号的构建文件，以及你最近打开过的最多 40 个页面，仅在断网时用来显示。它不缓存其他网站的内容，不缓存带查询参数的地址（登录回调就带），也不碰 `/api/`；清除站点数据即可删除。',en:'The site registers a service worker (`/sw.js`) that keeps three things on your device: an offline notice page, build files whose names carry a version hash, and up to 40 pages you opened recently, used only when the network is down. It stores nothing from other sites, no address with a query string (sign-in callbacks have one), and nothing from `/api/`. Clearing site data removes it.'}},
 {title:{zh:'Cookie',en:'Cookies'},text:{zh:'网站代码不设置 cookie。',en:'The site’s code sets no cookies.'}},
];
const others:Row[]=[
 {title:{zh:'Vercel',en:'Vercel'},text:{zh:'网站托管在 Vercel。和所有网站一样，服务器会收到你的访问请求，其中包括 IP 地址。网站预览图大多经 Vercel 的图片服务从来源网站取；来源网站不在它的名单里，或者缩小失败时，浏览器会直接从来源网站加载，这时来源网站也会收到你的请求和 IP 地址。',en:'The site is hosted on Vercel. As with any website, the servers receive your requests, including your IP address. Most website previews are fetched from their source sites through Vercel’s image service; when a source site is not on its list, or resizing fails, your browser loads the image straight from the source site, which then also receives your request and IP address.'}},
 {title:{zh:'X',en:'X'},text:{zh:'来自 X 的视频和图片从 X 的服务器加载；点“从 X 加载帖子”时还会加载 X 的嵌入脚本。X 可能记录这些访问。',en:'Videos and images from X load from X’s servers, and pressing “Load the post from X” also loads X’s embed script. X may record these visits.'}},
 {title:{zh:'Threads 上的公开帖子',en:'Public posts on Threads'},text:{zh:'每周一次，我们通过 Threads 官方接口按设计相关的关键词搜索公开帖子，用来发现值得收录的网站。我们只保存帖子的链接、作者用户名、发帖时间、帖子附带的网址和前 280 个字，存在本项目公开的代码仓库里；不复制帖子里的图片和视频，不抓取 Threads 页面，也不涉及本站读者的任何信息。想让自己的帖子从中去掉，在 GitHub 上开一个 Issue。',en:'Once a week we search public Threads posts for design-related keywords through Threads’ official API, to find sites worth adding. We keep only a post’s link, the author’s username, its time, the web address it carries and its first 280 characters, in this project’s public code repository. We do not copy a post’s images or videos, do not scrape Threads pages, and this involves no information about readers of this site. To have your post removed from it, open an issue on GitHub.'}},
 {title:{zh:'Google',en:'Google'},text:{zh:'选择用 Google 登录时，Google 会知道你登录了本站。',en:'If you choose Google sign-in, Google knows you signed in to this site.'}},
 {title:{zh:'Supabase',en:'Supabase'},text:{zh:'提供登录、发送登录邮件和保存收藏。',en:'Provides sign-in, sends sign-in emails and stores your saves.'}},
];
const tracking:Row[]=[
 {title:{zh:'访问统计',en:'Analytics'},text:{zh:'网站现在不加载任何统计或广告追踪脚本。以后加访问统计，会选不识别个人的工具，并先更新这一页。',en:'The site loads no analytics or ad-tracking scripts today. If we add analytics, it will be a tool that does not identify people, and this page will change first.'}},
 {title:{zh:'赞助',en:'Sponsors'},text:{zh:'不向赞助方提供读者的个人数据。赞助页表单提交的品牌、名字、邮箱、网址和留言存在维护者的 Supabase 项目里，只用来回复那次咨询，不公开。',en:'No personal data about readers is shared with sponsors. What the sponsor form sends (brand, name, email, URL and message) is kept in the maintainer’s Supabase project, used only to reply to that inquiry and never published.'}},
];
const contact:Row[]=[
 {title:{zh:'有问题',en:'Questions'},text:{zh:'在 GitHub 上开一个 Issue。Issue 是公开的，不要在里面写邮箱等个人信息。',en:'Open an issue on GitHub. Issues are public, so do not put your email or other personal details in it.'}},
 {title:{zh:'变更',en:'Changes'},text:{zh:'这一页有改动时，顶部的日期会更新，改动也会写进更新记录。',en:'When this page changes, the date at the top changes and the change is noted in the changelog.'}},
];
const inline=(text:string):ReactNode[]=>text.split(/`([^`]+)`/).map((part,i)=>i%2?<code key={i}>{part}</code>:part);
function Rows({rows,language}:{rows:Row[];language:Language}){
 return <ul className="sponsor-rows">{rows.map(r=><li key={r.title.en}><strong>{t(r.title,language)}</strong><p>{inline(t(r.text,language))}</p></li>)}</ul>;
}
export function PrivacyPage(){
 const language=useLocale();const l=(k:keyof typeof m)=>t(m[k],language);
 useEffect(()=>{document.title=l('metaTitle');document.documentElement.lang=t({zh:'zh-CN',en:'en'},language);document.querySelector('meta[name="description"]')?.setAttribute('content',l('metaDescription'));},[language]);
 const section=(id:string,key:keyof typeof m,rows:Row[],extra?:ReactNode)=><section className="site-shell sponsor-section" id={id} aria-labelledby={`privacy-${id}`}><h2 id={`privacy-${id}`}>{l(key)}</h2><div><Rows rows={rows} language={language}/>{extra}</div></section>;
 return <main className="content-page sponsor-page privacy-page"><SiteHeader language={language}/>
  <header className="content-hero site-shell sponsor-hero"><h1>{l('title')}</h1><p>{l('lead')}</p><p className="privacy-updated"><time dateTime={updated}>{l('updated')}</time></p></header>
  {section('account','account',account)}
  {section('browser','browser',browser)}
  {section('services','others',others)}
  {section('tracking','tracking',tracking)}
  {section('contact','contact',contact,<div className="home-actions"><a className="home-action-secondary" href={issues} target="_blank" rel="noreferrer">GitHub Issues ↗</a></div>)}
  <SiteFooter language={language}/></main>;
}
