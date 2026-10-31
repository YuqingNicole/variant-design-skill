import { useState } from 'react';
import { transition } from './view-transition';
import type { Language } from './direction-engine';
import { entries, mediaUrl } from './library-data';
import { inspirationItems, inspirationSources, inspirationTopics } from './inspiration-data';
import { skills } from './SkillsPage';
import './home.css';
type Copy = [string, string];
type Shelf = 'reference' | 'skill' | 'case';
// The home page is a design navigation site (RFC-004, revised 2026-10-29): references, tried skills and recorded cases.
// Every showcase value comes from the same data the section pages use; nothing here is written for the home page alone.
const verified = entries.filter(e => e.source === 'own' && e.kind === 'verified');
const topic = inspirationTopics[0], reference = inspirationItems.find(i => i.id === topic.items[0])!;
const skill = skills[0] as typeof skills[number] | undefined, pulse = verified.find(e => e.slug === 'pulse') ?? verified[0];
const facts = (list: string[]) => <p className="home-show-facts">{list.join(' · ')}</p>;

function Showcase({ shelf, zh, ix }: { shelf: Shelf; zh: boolean; ix: number }) {
  if (shelf === 'reference') return <article className="home-show-card" data-shelf="reference">
    <h3>{reference.name}</h3><p className="home-show-body">{reference.focus[ix]}</p><p className="home-show-body home-show-apply">{zh ? '用在：' : 'Apply: '}{reference.application[ix]}</p>
    {facts(zh ? [`${reference.publisher} 官网`, '仅链接', `核对于 ${reference.checkedAt}`, '设计者未知'] : [`${reference.publisher} site`, 'Link only', `Checked ${reference.checkedAt}`, 'Designer unknown'])}
    <p className="home-show-links"><a href={reference.url} target="_blank" rel="noreferrer">{zh ? '打开来源' : 'Open source'}</a><a href={`/inspiration?topic=${topic.id}`}>{zh ? `看「${topic.title[0]}」专题的 ${topic.items.length} 条` : `See all ${topic.items.length} in ${topic.title[1]}`}</a></p></article>;
  if (shelf === 'skill' && skill) return <article className="home-show-card" data-shelf="skill">
    <h3><code>{skill.name}</code></h3><p className="home-show-body">{skill.summary[ix]}</p>
    <code className="home-show-code">{skill.install}</code>
    {facts(zh ? ['在 Claude Code 和 Codex 中实测', `公开记录 ${skill.records.length} 份`] : ['Tried in Claude Code and Codex', `${skill.records.length} public records`])}
    <p className="home-show-links"><a href="#featured-skill">{zh ? '试一下 A/B/C' : 'Try A/B/C'}</a><a href="/skills">{zh ? '我们怎么试的' : 'How we tried it'}</a></p></article>;
  const cover = pulse.directions.find(d => d.id === pulse.recommendation?.variant) ?? pulse.directions[0], image = cover.media[0];
  return <article className="home-show-card" data-shelf="case">
    <img src={mediaUrl(pulse, image.file)} width={image.width} height={image.height} alt={image.alt[ix]}/>
    {facts(zh ? [pulse.title[0].split('：')[0], '技能产出，已验证', pulse.recommendation ? `推荐 ${pulse.recommendation.variant}，没有替你选定` : '未推荐'] : [pulse.title[1].split(':')[0], 'Skill output, verified', pulse.recommendation ? `Recommends ${pulse.recommendation.variant}, not chosen for you` : 'No recommendation'])}
    <p className="home-show-links"><a href={`/d/${pulse.slug}`}>{zh ? '看三个方向' : 'See all three'}</a><a href="#works">{zh ? `全部 ${entries.length} 个案例` : `All ${entries.length} cases`}</a></p></article>;
}

const shelves: { id: Shelf; label: Copy }[] = [{ id: 'reference', label: ['参考', 'References'] }, { id: 'skill', label: ['技能', 'Skills'] }, { id: 'case', label: ['案例', 'Cases'] }];
const tasks: { href: string; title: Copy; body: Copy }[] = [
  { href: '/inspiration', title: ['找参考', 'Find references'], body: ['按任务筛选外部作品，写下想借鉴和避免的内容，复制一份带来源的 brief。', 'Filter outside work by task, note what to borrow and avoid, and copy a brief with its sources.'] },
  { href: '/skills', title: ['选技能', 'Pick a skill'], body: ['只列我们在一次性项目里实际跑过、并公开了记录的设计技能。', 'Only design skills we have run in throwaway projects, with public records.'] },
  { href: '#works', title: ['看案例', 'Study cases'], body: ['同一个任务的三个方向，标明是技能产出还是概念作品。', 'Three directions for one brief, labelled as skill output or concept study.'] },
  { href: '#directories', title: ['找素材与代码', 'Find assets and code'], body: ['外部目录，只给链接。复用前查看每个条目自己的许可。', 'Outside directories, linked only. Check each item’s own license before reuse.'] },
];

export function HomeHero({ language }: { language: Language }) {
  const zh = language === 'zh', ix = zh ? 0 : 1, [shelf, setShelf] = useState<Shelf>('reference');
  const counts = zh ? `目前有 ${inspirationItems.length} 个参考、${skills.length} 个实测技能和 ${entries.length} 个案例。` : `So far: ${inspirationItems.length} references, ${skills.length} tried skill and ${entries.length} cases.`;
  return <>
    <header className="site-shell home-hero">
      <div className="home-show">
        <div className="home-shelves" role="group" aria-label={zh ? '切换展示' : 'Switch showcase'}>{shelves.filter(s => s.id !== 'skill' || skill).map(s => <button key={s.id} type="button" aria-pressed={shelf === s.id} onClick={() => transition(() => setShelf(s.id))}>{shelf === s.id && <span className="home-shelf-pill" aria-hidden="true"/>}<span style={{ viewTransitionName: `home-shelf-${s.id}` }}>{s.label[ix]}</span></button>)}</div>
        <div aria-live="polite"><Showcase shelf={shelf} zh={zh} ix={ix}/></div>
      </div>
      <div className="home-claim">
        <h1>{zh ? <>设计导航，<br/>只收核对过的。</> : <>A design guide,<br/>checked before it’s listed.</>}</h1>
        <p>{zh ? '给用 AI 做产品的人：精选外部参考、实测过的设计技能和真实的 A/B/C 案例。参考写明来源、核对日期和还不知道的事，技能附实测记录，案例附产出记录。' : 'For people building products with AI: selected outside references, design skills we have actually tried, and recorded A/B/C cases. References state their source, when they were checked and what is still unknown; skills link their trial records and cases their output records.'} <span className="home-counts">{counts}</span></p>
        <div className="home-actions"><a className="home-action-primary" href="/inspiration">{zh ? '浏览设计参考' : 'Browse references'}</a>{skill && <a className="home-action-secondary" href="#featured-skill">{zh ? '精选技能：Variant Design' : 'Featured skill: Variant Design'}</a>}</div>
      </div>
    </header>
    <section className="site-shell home-tasks" aria-labelledby="home-tasks-title">
      <h2 id="home-tasks-title">{zh ? '从你要做的事开始。' : 'Start with what you need to do.'}</h2>
      <ul>{tasks.map(t => <li key={t.href}><a href={t.href}>{t.title[ix]}</a><p>{t.body[ix]}</p></li>)}</ul>
    </section>
    {skill && <section className="site-shell home-featured" id="featured-skill" aria-labelledby="home-featured-title">
      <h2 id="home-featured-title">{zh ? '精选技能：' : 'Featured skill: '}<code>{skill.name}</code></h2><p>{skill.summary[ix]}</p>
      <p><code>{skill.install}</code> <a href="/docs">{zh ? '安装说明' : 'Install guide'}</a></p>
    </section>}
  </>;
}

const groups: { kind: string; title: Copy }[] = [{ kind: 'references', title: ['设计参考', 'Design references'] }, { kind: 'code', title: ['素材与代码', 'Assets and code'] }, { kind: 'skills', title: ['技能目录', 'Skill directories'] }];
export function HomeDirectories({ language }: { language: Language }) {
  const zh = language === 'zh', ix = zh ? 0 : 1;
  return <section className="site-shell home-directories" id="directories" aria-labelledby="home-directories-title">
    <h2 id="home-directories-title">{zh ? '更多设计目录' : 'More design directories'}</h2>
    <p>{zh ? '这些是外部目录，只给链接，不代表我们试过或推荐其中的每一项。复用素材和代码前，请查看具体条目的许可。' : 'Outside directories, linked only. Listing one does not mean we tried or recommend everything in it. Check each item’s license before reusing assets or code.'}</p>
    <div>{groups.map(g => <div key={g.kind}><h3>{g.title[ix]}</h3><ul>{inspirationSources.filter(s => s.kind === g.kind).map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.name}</a><span>{s.type[ix]}</span></li>)}</ul></div>)}</div>
  </section>;
}
