import { useState } from 'react';
import { transition } from './view-transition';
import type { Language } from './direction-engine';
import { fromPair, t, type Localized } from './i18n/localized';
import { XVideo, mediaOf } from './XVideo';
import type { Post } from './XPost';
import { entries, mediaUrl } from './library-data';
import { inspirationItems, inspirationSources, inspirationTopics } from './inspiration-data';
import { skills } from './SkillsPage';
import './home.css';
import { localePath } from './i18n/locale-route';
const m={apply:{zh:'用在：',en:'Apply: '},
 openSource:{zh:'打开来源',en:'Open source'},
 tryABC:{zh:'试一下 A/B/C',en:'Try A/B/C'},
 howWeTriedIt:{zh:'我们怎么试的',en:'How we tried it'},
 seeAllThree:{zh:'看三个方向',en:'See all three'},
 switchShowcase:{zh:'切换展示',en:'Switch showcase'},
 forPeopleBuildingProducts:{zh:'给用 AI 做产品的人：精选外部参考、实测过的设计技能和真实的 A/B/C 案例。参考写明来源、核对日期和还不知道的事，技能附实测记录，案例附产出记录。',en:'For people building products with AI: selected outside references, design skills we have actually tried, and recorded A/B/C cases. References state their source, when they were checked and what is still unknown; skills link their trial records and cases their output records.'},
 browseReferences:{zh:'浏览设计参考',en:'Browse references'},
 featuredSkillVariantDesign:{zh:'精选技能：Variant Design',en:'Featured skill: Variant Design'},
 startWithWhatYou:{zh:'从你要做的事开始。',en:'Start with what you need to do.'},
 featuredSkill:{zh:'精选技能：',en:'Featured skill: '},
 installGuide:{zh:'安装说明',en:'Install guide'},
 moreDesignDirectories:{zh:'更多设计目录',en:'More design directories'},
 outsideDirectoriesLinkedOnly:{zh:'这些是外部目录，只给链接，不代表我们试过或推荐其中的每一项。复用素材和代码前，请查看具体条目的许可。',en:'Outside directories, linked only. Listing one does not mean we tried or recommend everything in it. Check each item’s license before reusing assets or code.'}} satisfies Record<string,Localized>;
type Shelf = 'reference' | 'skill' | 'case';
// The home page is a design navigation site (RFC-004, revised 2026-10-29): references, tried skills and recorded cases.
// Every showcase value comes from the same data the section pages use; nothing here is written for the home page alone.
const verified = entries.filter(e => e.source === 'own' && e.kind === 'verified');
const topic = inspirationTopics[0], reference = inspirationItems.find(i => i.id === topic.items[0])!;
const skill = skills[0] as typeof skills[number] | undefined, pulse = verified.find(e => e.slug === 'pulse') ?? verified[0];
const facts = (list: string[]) => <p className="home-show-facts">{list.join(' · ')}</p>;

function Showcase({ shelf, language }: { shelf: Shelf; language: Language }) {
  if (shelf === 'reference') return <article className="home-show-card" data-shelf="reference">
    <h3>{reference.name}</h3><p className="home-show-body">{t(reference.focus, language)}</p><p className="home-show-body home-show-apply">{t(m.apply,language)}{t(reference.application, language)}</p>
    {facts(t({zh:[`${reference.publisher} 官网`, '仅链接', `核对于 ${reference.checkedAt}`, '设计者未知'],en:[`${reference.publisher} site`, 'Link only', `Checked ${reference.checkedAt}`, 'Designer unknown']},language))}
    <p className="home-show-links"><a href={reference.url} target="_blank" rel="noreferrer">{t(m.openSource,language)}</a><a href={localePath(`/inspiration?topic=${topic.id}`,language)}>{t({zh:`看「${topic.title.zh}」专题的 ${topic.items.length} 条`,en:`See all ${topic.items.length} in ${topic.title.en}`},language)}</a></p></article>;
  if (shelf === 'skill' && skill) return <article className="home-show-card" data-shelf="skill">
    <h3><code>{skill.name}</code></h3><p className="home-show-body">{t(fromPair(skill.summary),language)}</p>
    <code className="home-show-code">{skill.install}</code>
    {facts(t({zh:['在 Claude Code 和 Codex 中实测', `公开记录 ${skill.records.length} 份`],en:['Tried in Claude Code and Codex', `${skill.records.length} public records`]},language))}
    <p className="home-show-links"><a href="#featured-skill">{t(m.tryABC,language)}</a><a href={localePath('/skills',language)}>{t(m.howWeTriedIt,language)}</a></p></article>;
  const cover = pulse.directions.find(d => d.id === pulse.recommendation?.variant) ?? pulse.directions[0], image = cover.media[0];
  return <article className="home-show-card" data-shelf="case">
    <img src={mediaUrl(pulse, image.file)} width={image.width} height={image.height} alt={t(image.alt,language)}/>
    {facts(t({zh:[pulse.title.zh.split('：')[0], '技能产出，已验证', pulse.recommendation ? `推荐 ${pulse.recommendation.variant}，没有替你选定` : '未推荐'],en:[pulse.title.en.split(':')[0], 'Skill output, verified', pulse.recommendation ? `Recommends ${pulse.recommendation.variant}, not chosen for you` : 'No recommendation']},language))}
    <p className="home-show-links"><a href={localePath(`/d/${pulse.slug}`,language)}>{t(m.seeAllThree,language)}</a><a href="#works">{t({zh:`全部 ${entries.length} 个案例`,en:`All ${entries.length} cases`},language)}</a></p></article>;
}

const shelves: { id: Shelf; label: Localized }[] = [{ id: 'reference', label: { zh: '参考', en: 'References' } }, { id: 'skill', label: { zh: '技能', en: 'Skills' } }, { id: 'case', label: { zh: '案例', en: 'Cases' } }];
const tasks: { href: string; title: Localized; body: Localized }[] = [
  { href: '/inspiration', title: { zh: '找参考', en: 'Find references' }, body: { zh: '按任务筛选外部作品，写下想借鉴和避免的内容，复制一份带来源的 brief。', en: 'Filter outside work by task, note what to borrow and avoid, and copy a brief with its sources.' } },
  { href: '/skills', title: { zh: '选技能', en: 'Pick a skill' }, body: { zh: '只列我们在一次性项目里实际跑过、并公开了记录的设计技能。', en: 'Only design skills we have run in throwaway projects, with public records.' } },
  { href: '#works', title: { zh: '看案例', en: 'Study cases' }, body: { zh: '同一个任务的三个方向，标明是技能产出还是概念作品。', en: 'Three directions for one brief, labelled as skill output or concept study.' } },
  { href: '#directories', title: { zh: '找素材与代码', en: 'Find assets and code' }, body: { zh: '外部目录，只给链接。复用前查看每个条目自己的许可。', en: 'Outside directories, linked only. Check each item’s own license before reuse.' } },
];

export function HomeHero({ language }: { language: Language }) {
  const [shelf, setShelf] = useState<Shelf>('reference');
  const counts = t({zh:`目前有 ${inspirationItems.length} 个参考、${skills.length} 个实测技能和 ${entries.length} 个案例。`,en:`So far: ${inspirationItems.length} references, ${skills.length} tried skill and ${entries.length} cases.`},language);
  return <>
    <header className="site-shell home-hero">
      <div className="home-show">
        <div className="home-shelves" role="group" aria-label={t(m.switchShowcase,language)}>{shelves.filter(s => s.id !== 'skill' || skill).map(s => <button key={s.id} type="button" aria-pressed={shelf === s.id} onClick={() => transition(() => setShelf(s.id))}>{shelf === s.id && <span className="home-shelf-pill" aria-hidden="true"/>}<span style={{ viewTransitionName: `home-shelf-${s.id}` }}>{t(s.label,language)}</span></button>)}</div>
        <div aria-live="polite"><Showcase shelf={shelf} language={language}/></div>
      </div>
      <div className="home-claim">
        <h1>{t({zh:<>设计导航，<br/>只收核对过的。</>,en:<>A design guide,<br/>checked before it’s listed.</>},language)}</h1>
        <p>{t(m.forPeopleBuildingProducts,language)} <span className="home-counts">{counts}</span></p>
        <div className="home-actions"><a className="home-action-primary" href={localePath('/inspiration',language)}>{t(m.browseReferences,language)}</a>{skill && <a className="home-action-secondary" href="#featured-skill">{t(m.featuredSkillVariantDesign,language)}</a>}</div>
      </div>
    </header>
    <HomePractice language={language}/>
    <section className="site-shell home-tasks" aria-labelledby="home-tasks-title">
      <h2 id="home-tasks-title">{t(m.startWithWhatYou,language)}</h2>
      <ul>{tasks.map(task => <li key={task.href}><a href={localePath(task.href,language)}>{t(task.title,language)}</a><p>{t(task.body,language)}</p></li>)}</ul>
    </section>
    {skill && <section className="site-shell home-featured" id="featured-skill" aria-labelledby="home-featured-title">
      <h2 id="home-featured-title">{t(m.featuredSkill,language)}<code>{skill.name}</code></h2><p>{t(fromPair(skill.summary),language)}</p>
      <p><code>{skill.install}</code> <a href={localePath('/docs',language)}>{t(m.installGuide,language)}</a></p>
    </section>}
  </>;
}

// The newest Best practice posts, playing as on the inspiration page; each opens its own detail with our notes.
const practice = inspirationItems.flatMap(i => { const post = (i as typeof i & { post?: Post }).post, media = mediaOf(i.id); return i.category === 'practice' && post && media ? [{ item: i, post, media }] : []; })
  .sort((a, b) => b.post.date.localeCompare(a.post.date));
const pm = { title: { zh: '最近的 Best practice', en: 'Recent best practice' },
  body: { zh: 'X 上公开分享的界面、动效和品牌作品，静音循环播放。点开看我们写的笔记：研究什么、用在哪里。', en: 'Interface, motion and brand work shared publicly on X, playing muted on a loop. Open one for our notes on what to study and where to use it.' },
  all: { zh: `查看全部 ${practice.length} 个`, en: `See all ${practice.length}` }, openOnX: { zh: '在 X 上打开', en: 'Open on X' } } satisfies Record<string, Localized>;
export function HomePractice({ language, count = 6 }: { language: Language; count?: number }) {
  const l = (k: keyof typeof pm) => t(pm[k], language);
  if (!practice.length) return null;
  return <section className="site-shell home-practice" aria-labelledby="home-practice-title">
    <div className="home-practice-head"><h2 id="home-practice-title">{l('title')}</h2><p>{l('body')}</p><a href={localePath('/inspiration?category=practice',language)}>{l('all')}</a></div>
    <ul className="insp-videos home-practice-videos">{practice.slice(0, count).map(({ item, post, media }) => <li key={item.id} className="insp-card insp-vcard">
      <a className="insp-vcard-open" href={localePath(`/inspiration/${item.id}`,language)} style={{ aspectRatio: `${media.width}/${media.height}` }} aria-label={`${item.name}：${t(item.focus, language)}（${post.author} @${post.handle}）`}><XVideo media={media}/></a>
      {media.avatar && <img className="insp-vcard-avatar" src={media.avatar} width="44" height="44" alt={`${post.author} @${post.handle}`} title={`${post.author} @${post.handle}`} referrerPolicy="no-referrer"/>}
      <a className="insp-card-out" href={item.url} target="_blank" rel="noreferrer" aria-label={`${l('openOnX')}：${item.name}`}><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 11 11 5M6 5h5v5"/></svg></a></li>)}</ul>
  </section>;
}

const groups: { kind: string; title: Localized }[] = [{ kind: 'references', title: { zh: '设计参考', en: 'Design references' } }, { kind: 'code', title: { zh: '素材与代码', en: 'Assets and code' } }, { kind: 'skills', title: { zh: '技能目录', en: 'Skill directories' } }];
export function HomeDirectories({ language }: { language: Language }) {
  return <section className="site-shell home-directories" id="directories" aria-labelledby="home-directories-title">
    <h2 id="home-directories-title">{t(m.moreDesignDirectories,language)}</h2>
    <p>{t(m.outsideDirectoriesLinkedOnly,language)}</p>
    <div>{groups.map(g => <div key={g.kind}><h3>{t(g.title,language)}</h3><ul>{inspirationSources.filter(s => s.kind === g.kind).map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.name}</a><span>{t(s.type, language)}</span></li>)}</ul></div>)}</div>
  </section>;
}
