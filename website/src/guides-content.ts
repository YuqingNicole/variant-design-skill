// Answer pages at /guides, shared by GuidesPage and the prerendered metadata (scripts/prerender.mjs).
// Plain data only: the prerender imports this file without a TS loader for JSX.
// Every claim here must trace to the skill's own docs or a dated record in docs/research/.
import type { Localized } from './i18n/localized';
import type { Translations } from './i18n/translations';
import { deliver, installCommand, prompts, repository, refine } from './docs-content';

// `media` is our own output, served from public/: a still (image) or a short clip (video, with a poster still).
export type GuideMedia = { src: string; poster?: string; width: number; height: number; alt: Localized; caption?: Localized };
export type GuideSection = { id: string; heading: Localized; body: Localized[]; list?: Localized[]; code?: Localized; media?: GuideMedia[]; link?: { href: string; label: Localized } };
// `base` is the route a page lives under: the Q&A answers at /guides, the longer articles at /docs.
export type Guide = { slug: string; base?: '/guides' | '/docs'; title: Localized; answer: Localized; publishedAt: string; sections: GuideSection[]; translations?: Translations };
export const guideRoute = (g: Pick<Guide, 'slug' | 'base'>) => `${g.base ?? '/guides'}/${g.slug}`;

const records = `${repository}/blob/master/docs/research`;
const shorthand = (rows: typeof refine, names: string[]) => names.map(name => {
  const row = rows.find(([command]) => command === name);
  if (!row) throw new Error(`Unknown command ${name}`);
  return { zh: `${name}：${row[1].zh}`, en: `${name}: ${row[1].en}` };
});
const same = (value: string): Localized => ({ zh: value, en: value });

export const guides: Guide[] = [
  {
    slug: 'compare-design-directions',
    publishedAt: '2026-11-02',
    title: { zh: '怎么在现有项目里比较三个设计方向', en: 'How to compare three design directions in an existing project' },
    answer: {
      zh: '在 Claude Code 或 Codex 里安装 Variant Design，然后把任务发给 Agent。它先检查项目的页面结构和设计系统，再在你的项目里生成 A/B/C 三个完整版本，并给出比较页。三版的核心任务、数据和必要功能相同，差别在设计取舍。',
      en: 'Install Variant Design in Claude Code or Codex, then give your agent the brief. It inspects your page structure and design system first, then builds three complete versions, A/B/C, in your project with a comparison page. All three keep the same core task, data and necessary functions; they differ in their design tradeoffs.',
    },
    sections: [
      { id: 'install', heading: { zh: '1. 安装完整技能目录', en: '1. Install the complete directory' },
        body: [{ zh: '需要 Git 和 Node.js 22 或以上。仅复制 SKILL.md 不够。Claude Code 的安装路径不同，见安装指南。', en: 'You need Git and Node.js 22 or later. Copying SKILL.md alone is not enough. Claude Code uses a different path; see the install guide.' }],
        code: same(installCommand), link: { href: '/docs/install', label: { zh: '查看完整安装指南', en: 'Read the full install guide' } } },
      { id: 'brief', heading: { zh: '2. 在项目里发出任务', en: '2. Give the brief inside your project' },
        body: [{ zh: '在 Agent 中打开你的代码项目，粘贴下面的指令。第一次可以只做一个页面或 hero 区域。模型由你的 Agent 提供。', en: 'Open your code project in your agent and paste this prompt. Start with one page or hero. Your agent provides the model.' }],
        code: prompts.first },
      { id: 'compare', heading: { zh: '3. 比较和试改', en: '3. Compare and try edits' },
        body: [{ zh: '试改一版不等于选定它。下面的简写可以直接发给 Agent，也可以用自然语言描述。', en: 'Trying an edit on a version does not select it. Send these shorthands to your agent, or say the same thing in plain language.' }],
        list: shorthand(refine, ['compare', 'B vary subtle — hero', 'Mix A + B', 'undo B']) },
      { id: 'pick', heading: { zh: '4. 选定并接入', en: '4. Pick and integrate' },
        body: [{ zh: '只有你明确选定时，才会记录最终方案。接入前会备份目标文件，之后可以回滚。', en: 'A final choice is recorded only when you say so. Integration backs up the target files first, so you can roll it back.' }],
        list: shorthand(deliver, ['pick B']), code: prompts.integrate },
      { id: 'evidence', heading: { zh: '实测记录', en: 'Recorded runs' },
        body: [{ zh: '2026-10-27，我们在 3 个示例项目上分别用 Claude Code 和 Codex 跑了第一次生成，共 6 次，自动检查全部通过。Claude Code 每次用时 589–1026 秒，费用 $1.82–2.46；Codex 每次用时 309–513 秒。这些项目是我们自己写的，数字来自当时的版本，不代表你的项目。', en: 'On 2026-10-27 we ran the first generation with Claude Code and Codex on 3 sample projects, 6 runs in total, and every automated check passed. Claude Code took 589–1026 seconds and $1.82–2.46 per run; Codex took 309–513 seconds. We wrote those projects ourselves, and the numbers come from that version, so they do not predict your project.' }],
        link: { href: `${records}/2026-10-27-eval-baseline.md`, label: { zh: '查看完整记录', en: 'Read the full record' } } },
    ],
  },
  {
    slug: 'undo-ai-design-changes',
    translations: { en: { status: 'draft' } },
    publishedAt: '2026-11-02',
    title: { zh: '怎么撤回 AI 对设计的修改', en: 'How to undo design changes made by AI' },
    answer: {
      zh: '用 Variant Design 修改方向时，发 undo B 就能恢复 B 上一次的文件和 tokens，A/C 和最终选择不受影响。方案接入项目后，用 rollback 恢复接入前的文件。如果文件在修改后又被人动过，这两个操作都会拒绝执行，不会覆盖你的改动。',
      en: 'When you edit a direction with Variant Design, send undo B to restore B’s previous files and tokens; A/C and the final selection stay unchanged. After integrating into your project, rollback restores the files from before. If a file was changed afterwards, both refuse to run rather than overwrite that work.',
    },
    sections: [
      { id: 'undo', heading: { zh: '撤回一个方向的修改', en: 'Undo an edit to a direction' },
        body: [{ zh: '修改前会保存快照，并确认快照已写入，然后才动文件。一次请求就算一次撤回：如果一个请求分了几步才改完，undo B 会把这几步一起撤回。', en: 'The snapshot is saved and verified before any file changes. One request is one undo: if a request took several steps, undo B reverts them together.' }],
        code: same('undo B') },
      { id: 'rollback', heading: { zh: '撤回一次接入', en: 'Roll back an integration' },
        body: [{ zh: '接入前，技能把每个目标文件的原始内容保存到 variant-output/.integrations/。回滚时恢复这些文件，并删除接入时新建的文件。接入 ID 可以用 list 查到。', en: 'Before integrating, the skill saves the original bytes of every target file in variant-output/.integrations/. Rollback restores them and deletes files the integration created. Find the integration ID with list.' }],
        code: same('node <skill-root>/scripts/variant-integrate.mjs list variant-output\nnode <skill-root>/scripts/variant-integrate.mjs rollback variant-output <integration-id>') },
      { id: 'refused', heading: { zh: '撤回被拒绝时怎么办', en: 'When undo refuses' },
        body: [
          { zh: '拒绝通常说明文件在修改后又被编辑过。这是有意设计的，也没有强制参数：撤回可能丢掉你没看过的改动。', en: 'A refusal usually means a file was edited after the change. This is deliberate, and there is no force flag, because undoing could discard work nobody has reviewed.' },
          { zh: '这时可以把上一个快照取到一个新目录，当前文件和历史都不会变。对比后，把要保留的改动合进新的候选版本。', en: 'Instead, extract the last snapshot into a new directory, which leaves live files and history unchanged. Compare it with your files, then reconcile what you want to keep into a new candidate.' },
        ],
        code: same('node <skill-root>/scripts/variant-history.mjs recover variant-output B .variant-work/recovered-B') },
      { id: 'limits', heading: { zh: '已知限制', en: 'Known limits' },
        body: [],
        list: [
          { zh: '外部编辑器不遵守技能的操作锁。提交过程中不要同时编辑这些文件。', en: 'External editors do not honor the skill’s operation lock. Avoid editing these files while a change is being committed.' },
          { zh: '多个文件的替换不是全局原子操作。进程中断后，可能需要手动检查。', en: 'Replacing several files is not globally atomic. After an interrupted process, you may need to check by hand.' },
          { zh: '旧快照如果没有记录修改后的基准，自动撤回会拒绝，要用 recover 取出后对比。', en: 'Automatic undo refuses a legacy snapshot that lacks the post-edit baseline. Extract it with recover and compare it with your files.' },
        ],
        link: { href: `${records}/2026-10-27-integration-baseline.md`, label: { zh: '查看接入实测记录', en: 'Read the integration record' } } },
    ],
  },
  {
    slug: 'avoid-generic-ai-ui',
    publishedAt: '2026-11-02',
    title: { zh: '怎么让 AI 生成的界面不千篇一律', en: 'How to keep AI-generated interfaces from looking the same' },
    answer: {
      zh: '如果用 AI 直接写出来的界面（vibe coding）看起来千篇一律，不要只让 AI 出一版。先写清真实任务和不能变的约束，再让它做几个在取舍上真正不同的方向，比较后由你决定。下面是我们的做法，用 Pulse 案例说明。它来自实际运行记录，但我们没有做过用户对照实验，不能证明它一定更好。',
      en: 'If a vibe-coded UI looks like every other AI-built interface, do not ask AI for one version. State the real task and the constraints that cannot change, have it build directions that differ in their tradeoffs, then compare them and decide yourself. Below is how we do it, using the Pulse case. It comes from recorded runs, but we have not run a controlled user study, so it does not prove the result is better.',
    },
    sections: [
      { id: 'task', heading: { zh: '1. 写清读者和任务', en: '1. Name the reader and the task' },
        body: [{ zh: '“做一个数据看板”没有给 AI 任何判断依据。Pulse 的任务是：为订阅类产品的每周数据报告重新设计，读者是周一早上的产品负责人。', en: '“Build a dashboard” gives AI nothing to decide with. The Pulse brief reads: redesign the weekly analytics report of a subscription app for the product lead on Monday morning.' }] },
      { id: 'constraints', heading: { zh: '2. 写清不能变的东西', en: '2. State what cannot change' },
        body: [{ zh: 'Pulse 在 src/tokens.css 里注明品牌已锁定。2026-10-27 的实测里，Claude Code 和 Codex 都识别出这一点，变体文件没有声明其他字体。差异因此落在结构上，而不是换一套配色。', en: 'Pulse marks its brand as locked in src/tokens.css. In the 2026-10-27 runs, both Claude Code and Codex recognized this, and the variant files declared no other fonts. The differences then land in structure, not in a new color scheme.' }],
        link: { href: `${records}/2026-10-27-eval-baseline.md`, label: { zh: '查看实测记录', en: 'Read the record' } } },
      { id: 'tradeoffs', heading: { zh: '3. 让每个方向优化不同的东西', en: '3. Make each direction optimize something different' },
        body: [{ zh: '只换视觉风格的三版，往往还是同一个方案。Pulse 用同一周的数据和同一个品牌，做出三种读法：', en: 'Three versions that only change visual style are often one idea three times. Pulse uses the same week of data and the same brand for three ways of reading:' }],
        list: [
          { zh: '先列出要处理的事', en: 'Lead with what to act on' },
          { zh: '并排比较指标', en: 'Compare metrics side by side' },
          { zh: '追查异常的原因', en: 'Trace why something changed' },
        ],
        link: { href: '/d/pulse', label: { zh: '查看 Pulse 的三个方向', en: 'See the three Pulse directions' } } },
      { id: 'references', heading: { zh: '4. 借鉴结构，不复制外观', en: '4. Borrow structure, not appearance' },
        body: [{ zh: '给参考时，写明想研究什么、要避免什么。可以研究信息层级和取舍，不要照搬别人的品牌、文案和素材。', en: 'When you give a reference, say what to study and what to avoid. Study its information hierarchy and tradeoffs; do not copy its brand, text or assets.' }],
        link: { href: '/', label: { zh: '浏览设计参考', en: 'Explore references' } } },
      { id: 'decide', heading: { zh: '5. 要推荐，但自己决定', en: '5. Ask for a recommendation, then decide yourself' },
        body: [{ zh: '让 AI 说明每个方向优化什么、牺牲什么、适合什么场景，再给出有理由的推荐。推荐不等于选定，最终选择应该由了解产品的人来做。', en: 'Have AI state what each direction optimizes, what it gives up and where it fits, then recommend one with reasons. A recommendation is not a choice; that belongs to someone who knows the product.' }] },
    ],
  },
  {
    slug: 'git-or-snapshot-undo',
    translations: { en: { status: 'draft' } },
    publishedAt: '2026-11-02',
    title: { zh: 'Agent 改了仓库里的设计，用 git 撤回还是用快照撤回', en: 'Undoing an agent’s design edits in your repository: git or snapshots' },
    answer: {
      zh: '两者配合使用。git 记录仓库历史；Variant Design 的 undo B 按请求撤回 B，rollback 撤回一次接入，发现文件后来又被编辑就拒绝执行。让 Agent 动手前先检查并保存自己的工作；探索时用 undo，确认接入结果后再提交。使用 git restore 前要看清恢复来源和目标，它可能覆盖尚未保存的编辑。',
      en: 'Use both. Git records repository history; Variant Design’s undo B reverts B by request, and rollback reverses an integration. Both refuse when files were edited afterwards. Inspect and save your work before the agent starts, use undo while exploring, and commit the integration once reviewed. Before using git restore, check its source and destination: it can overwrite edits you have not saved.',
    },
    sections: [
      { id: 'differences', heading: { zh: '两者的区别', en: 'How they differ' },
        body: [],
        list: [
          { zh: '范围：git 可以记录整个仓库，也能按路径操作；undo B 只动 B 自己的文件和 tokens，A/C 和最终选择不变。', en: 'Scope: git can record a whole repository or operate on chosen paths; undo B touches only B’s own files and tokens, leaving A/C and the final selection unchanged.' },
          { zh: '单位：git revert 针对提交，git restore 针对路径；undo 针对一次请求，一个请求分几步改完，也会一起撤回。', en: 'Unit: git revert targets commits and git restore targets paths; undo reverts one request, including its separate steps.' },
          { zh: '恢复来源：默认 git restore 从暂存区恢复工作文件；--staged 改动暂存区，默认来源是 HEAD。它们不会根据 Agent 请求区分编辑。', en: 'Restore source: by default git restore copies the index into working files. With --staged it changes the index, using HEAD by default. Neither distinguishes agent requests.' },
          { zh: '记录位置：git 在 .git/；快照在 variant-output/ 的历史里，接入前的备份在 variant-output/.integrations/。', en: 'Where records live: git in .git/; snapshots in the variant-output/ history, and pre-integration backups in variant-output/.integrations/.' },
        ] },
      { id: 'before', heading: { zh: '1. Agent 动手前：先提交自己的改动', en: '1. Before the agent starts: commit your own work' },
        body: [{ zh: '先检查改动，再提交需要保留的文件，或确认 stash 的范围。下面的 -u 会包含未跟踪的新文件，但不包含被忽略的文件；需要的忽略文件另行备份。stash 会从工作区移走保存的改动，恢复时可能有冲突。技能的 .variant-work/ 含项目源码副本，不要提交，也不要用 -a 不加区分地收进仓库对象。', en: 'Inspect changes, then commit the files you need or check the stash scope. Below, -u includes untracked files but excludes ignored files; back those up separately when needed. Stash removes saved changes from the working tree, and restoring may conflict. The skill’s .variant-work/ holds source copies: do not commit it or indiscriminately include it with -a.' }],
        code: same('git status --short\ngit stash push -u -m "before design exploration"') },
      { id: 'explore', heading: { zh: '2. 探索阶段：用 undo', en: '2. While exploring: use undo' },
        body: [{ zh: '三个方向都在 variant-output/ 里，还没进入你的源码。这时改坏了一版，发 undo B 就行，不用回退整个仓库，其他两版的修改也保得住。', en: 'All three directions live in variant-output/ and have not touched your source yet. If an edit to one goes wrong, send undo B. You do not have to roll back the repository, and the edits to the other two survive.' }],
        code: same('undo B'),
        link: { href: '/guides/undo-ai-design-changes', label: { zh: '撤回的细节和被拒绝时怎么办', en: 'Undo in detail, and what to do when it refuses' } } },
      { id: 'integrate', heading: { zh: '3. 接入之后：先 rollback，再交给 git', en: '3. After integrating: rollback first, then git' },
        body: [
          { zh: '接入会改你的源码。技能先备份每个目标文件，再写入。只要这些文件之后没被改过，rollback 就能恢复原样，提交与否不影响这个判断。', en: 'Integration changes your source. The skill backs up every target file before writing. As long as those files have not been edited since, rollback restores them, whether or not you committed in between.' },
          { zh: '确认要保留之后，像平常一样提交。撤销已提交的接入时，可以检查 git revert：它新增一个反向提交，可能需要处理冲突；应先确认目标提交只包含你要撤销的内容。', en: 'Commit after review. For a committed integration, consider git revert: it records a new reversing commit and may need conflict resolution. First check that the target commit contains only what you intend to reverse.' },
        ],
        code: same('node <skill-root>/scripts/variant-integrate.mjs list variant-output\nnode <skill-root>/scripts/variant-integrate.mjs rollback variant-output <integration-id>') },
      { id: 'limits', heading: { zh: '保存与恢复的边界', en: 'Limits of saving and recovery' },
        body: [],
        list: [
          { zh: '从未进入 Git 对象、快照或其他备份的内容，覆盖后不能指望这些记录找回。', en: 'These records cannot be relied on to recover overwritten content they never captured.' },
          { zh: '技能快照不覆盖 Agent 在流程之外直接改的文件；这部分需要版本控制、编辑器历史或其他备份。', en: 'Skill snapshots do not cover files changed outside their workflow; use version control, editor history or another backup for those.' },
          { zh: '在提交过程中挡住外部编辑器的写入。技能的锁只对它自己的操作有效。', en: 'Block an external editor from writing during a commit. The skill’s lock only coordinates its own operations.' },
        ],
        link: { href: 'https://git-scm.com/docs/git-restore', label: { zh: '查看 Git 官方 restore 文档', en: 'Read the official git restore documentation' } } },
    ],
  },
  {
    slug: 'design-references-with-sources',
    translations: { en: { status: 'draft' } },
    publishedAt: '2026-11-02',
    title: { zh: '哪里能找到标注了来源和核对日期的设计参考', en: 'Where to find design references with sources and check dates' },
    answer: {
      zh: 'Variant Design 的设计参考页记录出处、类型、设计者（已知时）、核对日期和手机版测试状态。链接参考不代表我们取得作品授权；作者授权展示的媒体会单独标明授权记录和范围。本站展示许可不等于允许你下载或复用，使用前仍要核对原作条款或另行取得许可。',
      en: 'Variant Design’s reference pages record the source, kind, designer when known, check date and mobile testing status. A link reference does not mean we hold a license to the work. Media displayed with author permission has a separate record and scope. Permission for display here does not grant you download or reuse rights; check the original terms or obtain permission before using it.',
    },
    sections: [
      { id: 'fields', heading: { zh: '每条参考记录什么', en: 'What each reference records' },
        body: [],
        list: [
          { zh: '出处：发布者，以及它是官网、产品页、文档还是社交媒体帖子。', en: 'Source: the publisher, and whether it is an official site, a product page, documentation or a social post.' },
          { zh: '核对日期：链接参考记录打开原页面的日期；作者授权条目记录人工审核日期。来源可能是官网、文档、公开帖子或作者投稿。', en: 'Check date: when a link reference’s original page was opened, or an author submission was manually reviewed. Sources include official sites, documentation, public posts and author submissions.' },
          { zh: '研究什么、用在哪里：每条都写了值得学的结构，以及适合解决的问题。', en: 'What to study and where to use it: each entry names the structure worth learning and the problem it suits.' },
          { zh: '还不知道的：设计者不明、手机版没测、复用权限未知，都会直接写出来。', en: 'What is still unknown: an unnamed designer, an untested mobile layout and unknown reuse rights are stated, not hidden.' },
        ],
        link: { href: '/', label: { zh: '浏览设计参考', en: 'Explore references' } } },
      { id: 'dates', heading: { zh: '为什么要看核对日期', en: 'Why the check date matters' },
        body: [{ zh: '网页会改版，帖子会删除。核对日期只是最近一次查看或审核的记录，不证明今天的内容、手机版表现或复用权限仍然有效。使用前打开原页面，再核对与你有关的信息。', en: 'Sites change and posts disappear. The check date records a viewing or review; it does not prove that today’s content, mobile behavior or reuse permission is current. Open the original and recheck the details you need.' }] },
      { id: 'agent', heading: { zh: '把参考交给 Agent', en: 'Hand a reference to your agent' },
        body: [{ zh: '在参考页可以复制一段说明，里面带出处、核对日期、要借鉴和要避免的东西，以及未知项。Variant Design 技能会把参考记进任务：用途（灵感、代码或素材）、核对状态，代码和素材还要写明许可证状态。没有核实过的就记为未核实，不会被当成已确认。', en: 'From the references page you can copy a note with the source, check date, what to borrow, what to avoid and what is unknown. The Variant Design skill records each reference in the task: its use (inspiration, code or asset) and review status, plus license status for code and assets. Anything not checked is recorded as unverified, not as confirmed.' }],
        code: same('{"title":"Reference title","url":"https://example.com/pricing","usage":"inspiration",\n "borrow":"Compare feature differences beside each plan","directions":["A"],\n "review":{"status":"unverified"}}') },
      { id: 'own', heading: { zh: '自己收集参考时也记下这些', en: 'Record the same when you collect your own' },
        body: [{ zh: '不论参考来自哪里，至少记下原始链接、发布者、你打开它的日期，以及你打算借鉴的是结构、代码还是素材。复制代码、图片或文案之前，先找到原作的许可证。', en: 'Wherever a reference comes from, record at least the original link, the publisher, the date you opened it, and whether you mean to borrow its structure, its code or its assets. Before copying code, images or text, find the original’s license.' }] },
    ],
  },
  {
    // From the skill's own rules: references/workflow/project-discovery.md (the task brief), design-declaration.md and
    // adjective-translation.md; the examples are the prompts in evals/fixtures (pulse, premium).
    slug: 'write-a-design-brief-for-ai',
    translations: { en: { status: 'draft' } },
    publishedAt: '2026-11-21',
    title: { zh: '怎么给 AI 写设计需求', en: 'How to write a design brief for AI' },
    answer: {
      zh: '给 AI 的设计需求至少写清六件事：给谁用、要完成哪一件事；哪些任务、数据和操作不能丢；可以改哪些地方；品牌约束和它写在哪里；“高级”“简洁”这类词具体指什么；做完怎么验收。下面每一条都来自 Variant Design 技能在生成之前要整理的任务简报，最后附一份可以直接填的模板。这是我们的做法，没有做过对照实验证明写成这样效果一定更好。',
      en: 'A design brief for AI should state at least six things: who it is for and the one job it must do; which tasks, data and actions must survive; what may be changed; the brand constraints and where they are written; what words like "premium" or "clean" actually mean; and how the result will be checked. Each point below comes from the task brief the Variant Design skill writes before it generates anything, and a template to fill in closes the page. This is how we work; we have not run a controlled study showing that briefs written this way give better results.',
    },
    sections: [
      { id: 'job', heading: { zh: '1. 写给谁、完成哪一件事', en: '1. Who it is for and the one job it must do' },
        body: [
          { zh: '先写读者在什么情况下打开这个页面，以及页面必须帮他完成的那一件事。技能把这叫“设计声明”，里面还有一项“成功的时刻”：读者做到了什么，才算页面成功。', en: 'Start with the situation in which the reader opens the page and the one job the page must do for them. The skill calls this the design declaration, and it includes a "success moment": what the reader does that tells you the page worked.' },
          { zh: '技能自带的例子是投资研究看板：读者是开盘前的买方分析师，要完成的事是把有证据的信号和需要核实的噪音分开；成功的时刻是分析师打开来源、记下下一步研究，而不是只凭 AI 打的分就行动。', en: 'The skill’s own example is an investment-research dashboard: the reader is a buy-side analyst before market open, the job is to separate evidence-backed signals from noise that needs checking, and the success moment is the analyst opening the source and recording a next research step, rather than acting on an AI score alone.' },
        ],
        link: { href: '/guides/avoid-generic-ai-ui', label: { zh: '另一个例子：Pulse 的读者和任务', en: 'Another example: the reader and task in Pulse' } } },
      { id: 'preserve', heading: { zh: '2. 列出不能丢的东西', en: '2. List what must survive' },
        body: [{ zh: '写明哪些核心任务、共享数据和必要操作在每个方向里都要保留。设计可以改结构和取舍，不能顺手删掉一个功能。我们的一个测试项目里，修改请求是这样写的：', en: 'Name the core tasks, shared data and necessary actions that every direction must keep. A design can change structure and tradeoffs; it must not quietly drop a feature. In one of our test projects, an edit request reads:' }],
        code: { zh: '把 B 做得更高级、更有质感。保留现有品牌、书目与搜索、分类、收藏功能；只改 B，不要替我选定最终方案。', en: 'Make B more premium and refined. Keep the existing brand, the book list with search, categories and favorites; change only B, and do not pick the final version for me.' } },
      { id: 'scope', heading: { zh: '3. 写清可以改哪里', en: '3. Say what may be changed' },
        body: [{ zh: '上面那句里的“只改 B”就是范围。写明目标页面或路由，以及允许改的区域和文件。技能把这些记进任务简报，只在授权的范围里写入；读项目本身不等于获得了修改的许可。', en: '"Change only B" in that request is the scope. Name the target page or route and the regions and files that may change. The skill records these in its task brief and writes only inside them; reading the project does not grant permission to change it.' }],
        link: { href: '/guides/compare-design-directions', label: { zh: '在现有项目里比较三个方向', en: 'Compare three directions in an existing project' } } },
      { id: 'brand', heading: { zh: '4. 写清品牌约束，以及写在哪里', en: '4. State the brand constraints and where they live' },
        body: [{ zh: '如果字体、颜色已经定了，说出来，并指出写在哪个文件里。我们的 Pulse 测试项目在 src/tokens.css 里注明品牌已锁定。反过来，项目里找不到设计 token，不代表可以换掉品牌；技能会把“没有检测到”和“允许替换”分开记。', en: 'If fonts and colors are settled, say so and point to the file that holds them. Our Pulse test project marks its brand as locked in src/tokens.css. The reverse does not hold: finding no design tokens in a project is not permission to replace the brand, and the skill records "none detected" separately from "may replace".' }] },
      { id: 'adjectives', heading: { zh: '5. 把形容词换成能检查的东西', en: '5. Turn adjectives into things you can check' },
        body: [{ zh: '“高级”“简洁”“有科技感”说的是印象，不是做法。AI 照字面理解，常常给出最便宜的版本：深色背景配金色，或者霓虹渐变。写需求时把词拆开，例如：', en: '"Premium", "clean" and "techy" name an impression, not a method. Read literally, they often produce the cheapest version: a dark background with gold, or neon gradients. Break the word down when you write the brief, for example:' }],
        list: [
          { zh: '高级：字号不超过 7 种，只用一个强调色，圆角最多 3 种、阴影最多 2 种，留白更多', en: 'Premium: no more than 7 type sizes, one accent color, at most 3 radii and 2 shadows, more space' },
          { zh: '简洁：每屏元素更少、容器更少，只有一个主要操作', en: 'Clean: fewer elements and containers per screen, one primary action' },
          { zh: '科技感：精确对齐和真实的产品数据，等宽字体只用于数据，不用霓虹渐变', en: 'Techy: precise alignment and real product data, monospace for data only, no neon gradients' },
        ],
        link: { href: '/docs/make-ai-ui-look-premium', label: { zh: '把“高级”拆成能数的东西', en: 'Turn "premium" into things you can count' } } },
      { id: 'references', heading: { zh: '6. 给参考时写借鉴什么、避免什么', en: '6. With a reference, say what to borrow and what to avoid' },
        body: [{ zh: '只贴一个链接，AI 不知道你看中的是结构、节奏还是配色。写明要借鉴什么、要避开什么，并说明来源只是参考材料，不复制它的文案、商标和素材。本站参考页的“生成参考指令”就是按这个格式写的：出处、核对日期、参考、避免、权限和未知项。', en: 'A bare link does not tell AI whether you like its structure, its rhythm or its colors. Say what to borrow and what to avoid, and that the source is reference material only, with no copying of its text, marks or assets. The "Create brief" button on this site’s reference pages writes exactly that: source, check date, use for, avoid, rights and unknowns.' }],
        link: { href: '/', label: { zh: '浏览设计参考', en: 'Explore references' } } },
      { id: 'acceptance', heading: { zh: '7. 写清怎么验收', en: '7. Say how it will be checked' },
        body: [{ zh: '最后写几条做完以后能检查的标准，例如手机和桌面都能完成主要操作、对比度达标、不出现虚构的数据。也写出你还不知道、但可能影响结果的事。技能只追问会改变任务或范围的问题，最多两个；其余的先按项目里的证据推断，并标明是推断。', en: 'End with a few criteria you can check afterwards, such as the main action working on phone and desktop, passing contrast, and no invented data. Also name what you do not know yet but that could change the result. The skill only asks about missing facts that change the task or its scope, at most two questions; the rest it infers from the project and marks as inferred.' }],
        link: { href: '/docs/check-ai-generated-ui-before-you-ship', label: { zh: '上线前怎么检查 AI 生成的界面', en: 'How to check AI-generated UI before you ship' } } },
      { id: 'template', heading: { zh: '可以直接填的模板', en: 'A template to fill in' },
        body: [{ zh: '把下面这段复制给 Agent，填上你的内容。没有把握的项写“不确定”，不要空着。', en: 'Copy this to your agent and fill it in. Write "not sure" instead of leaving a line empty.' }],
        code: {
          zh: '页面：<路由或文件>\n读者和场景：<谁、在什么情况下打开>\n要完成的事：<一件事>\n成功的时刻：<读者做到什么算成功>\n必须保留：<核心任务、数据、操作>\n可以改：<区域和文件；其余不动>\n品牌约束：<字体、颜色、写在哪个文件>\n想要的感觉：<形容词，以及它具体指什么>\n参考：<链接；借鉴什么；避免什么>\n验收：<做完怎么检查>\n还不知道：<可能影响结果的事>\n请先检查项目结构和设计系统，再做三个在取舍上不同的方向；说明每个方向优化什么、牺牲什么，给出有理由的推荐，但不要替我选定。',
          en: 'Page: <route or file>\nReader and situation: <who, opening it when>\nThe one job: <one thing>\nSuccess moment: <what the reader does when it works>\nMust keep: <core tasks, data, actions>\nMay change: <regions and files; leave the rest>\nBrand constraints: <fonts, colors, and the file they are in>\nThe feel: <the adjective, and what it means here>\nReferences: <links; what to borrow; what to avoid>\nAcceptance: <how to check it when done>\nNot known yet: <anything that could change the result>\nInspect the project structure and design system first, then build three directions that differ in their tradeoffs; say what each optimizes and gives up, and recommend one with reasons, but do not pick for me.',
        } },
    ],
  },
  {
    // From skills/variant-generate/zones.md and references/workflow/history.md; the checks are the zone tests in
    // scripts/variant-loop.test.mjs; the request-id fix and the scoped run are in the 2026-10-26 and 2026-10-27 records.
    slug: 'edit-one-part-of-a-ui-with-ai',
    translations: { en: { status: 'draft' } },
    publishedAt: '2026-11-23',
    title: { zh: '怎么让 AI 只改界面的一部分，不动别的', en: 'How to have AI change one part of a UI without touching the rest' },
    answer: {
      zh: '用 Variant Design 时，在命令后面加上区域名，例如 B vary subtle — hero，就只改 B 的首屏。区域在代码里用一对起止标记划出来；修改先在一份候选副本里做，写回时工具会检查：标记以外的改动直接拒绝，没有这个区域标记的文件必须一个字节都不变。改完能用 undo B 撤回，A、C 和最终选择都不受影响。字节没变不等于页面看起来没变，所以还要对比改动前后渲染出来的其他区域。',
      en: 'With Variant Design, add a region name after the command, for example B vary subtle — hero, and only B’s hero changes. A region is marked in the code with a pair of start and end markers. The edit is made in a candidate copy first, and when it is written back the tool checks it: a change outside the markers is rejected, and every file without that region’s markers must stay byte-for-byte identical. undo B reverts it, and A, C and the final pick are untouched. Unchanged bytes do not prove the page looks unchanged, so the other regions are also compared before and after rendering.',
    },
    sections: [
      { id: 'say', heading: { zh: '1. 在命令里说清改哪一块', en: '1. Name the region in the request' },
        body: [{ zh: '格式是“方向 动作 — 区域”。区域按它在页面里的作用来叫，不是 CSS 类名：首屏、导航、卡片、侧栏、页脚、表单、图表、行动按钮、弹窗，也可以用你自己的叫法，比如“价格表”。', en: 'The form is "direction action — region". A region is named by its role on the page, not by a CSS class: hero, nav, card, sidebar, footer, form, chart, cta, modal, or a name of your own such as "pricing table".' }],
        code: same('B vary subtle — hero\nA remix colors — card\nC shuffle layout — sidebar\nzones A') },
      { id: 'markers', heading: { zh: '2. 区域怎么划出来', en: '2. How a region is marked' },
        body: [
          { zh: '第一次生成时，技能就给每个主要区域加上一对起止标记，结构里一对，样式里一对，名字形如 zone:hero:start 和 zone:hero:end。zones A 会列出 A 里有哪些区域。', en: 'On the first generation the skill brackets each main region with start and end markers, one pair in the markup and one in the styles, named like zone:hero:start and zone:hero:end. zones A lists the regions in A.' },
          { zh: '已有的页面如果没有标记，先单独做一步“只加标记、外观不变”，确认渲染没变，再做你要的修改。找不到你说的区域时，技能会列出现有的区域让你选，不会猜。', en: 'If an existing page has no markers, adding them is a separate step, "mark the hero, no visual change", checked to render the same before the edit you asked for. If the region you name is not there, the skill lists the regions it found and asks; it does not guess.' },
        ] },
      { id: 'check', heading: { zh: '3. 工具怎么保证别处不动', en: '3. How the tool keeps the rest unchanged' },
        body: [{ zh: '修改不直接写进你的文件。技能先把 B 的文件复制成一份候选副本，记下每个文件原来的内容，在副本里改完再写回。写回时会检查：', en: 'The edit is not written straight into your files. The skill copies B’s files into a candidate, records each file’s original contents, edits the copy, then writes it back. Writing back checks that:' }],
        list: [
          { zh: '改动都在这对标记之间；超出的整次拒绝，你的文件不动', en: 'every change sits between the markers; anything outside rejects the whole edit and your files stay as they were' },
          { zh: '没有这个区域标记的文件，每个字节都和原来一样', en: 'every file without that region’s markers is byte-for-byte identical' },
          { zh: '共享的颜色、字体等变量不能被一次局部修改改掉，覆盖只能写在区域里', en: 'shared variables such as colors and fonts cannot be changed by a local edit; overrides stay inside the region' },
          { zh: '准备副本之后你又在编辑器里改过文件，这份副本作废，不会盖掉你的改动', en: 'if you edited the files in your editor after the copy was made, the copy is refused rather than written over your work' },
        ],
        link: { href: `${records}/2026-10-27-progressive-loading.md`, label: { zh: '查看一次只改首屏的实测记录', en: 'Read the record of a hero-only run' } } },
      { id: 'render', heading: { zh: '4. 字节没变，不等于看起来没变', en: '4. Unchanged bytes do not prove an unchanged page' },
        body: [{ zh: '一个区域可能用到共享组件或共享样式，改它也会影响别处。所以技能在局部修改前，先记下几处其他区域在浏览器里的样子和行为，改完再用同样的检查跑一遍。在用配置驱动的 React 页面上，外层代码不变更不能说明页面范围没变，共享组件在这次修改里只读。', en: 'A region can use shared components or styles, so changing it can reach elsewhere. Before a scoped edit the skill records how a few other regions look and behave in the browser, then runs the same checks after the edit. On configuration-driven React pages, unchanged wrapper code proves even less, and shared components stay read-only during the edit.' }] },
      { id: 'undo', heading: { zh: '5. 一次请求，一次撤回', en: '5. One request, one undo' },
        body: [{ zh: '一个请求有时要分几步写回：先补标记，再改，再修一个发现的问题。这几步用同一个请求编号，undo B 会把它们一起撤回。我们 2026-10-26 实测时，一次只改首屏的请求产生了 3 个版本，undo B 当时只撤回了最后一个修复；之后加上了请求编号来解决。', en: 'A request sometimes takes several write-backs: add markers, make the edit, fix a problem found after rendering. They share one request id, and undo B reverts them together. In our 2026-10-26 runs, one hero-only request produced three versions and undo B reverted only the last fix; the request id was added to fix that.' }],
        link: { href: '/guides/undo-ai-design-changes', label: { zh: '怎么撤回 AI 对设计的修改', en: 'How to undo design changes made by AI' } } },
      { id: 'pick', heading: { zh: '6. 改了不等于选了', en: '6. Editing is not picking' },
        body: [{ zh: '修改和撤回只记录你最近在看哪个方向，不会替你选定。只有你明确说 pick B，B 才成为最终方案。', en: 'Edits and undos only record which direction you last worked on; they never pick for you. B becomes the final choice only when you say pick B.' }],
        code: same('pick B') },
      { id: 'limits', heading: { zh: '已知限制', en: 'Known limits' },
        body: [],
        list: [
          { zh: '检查的是文件内容，不是每一个渲染结果；共享组件和样式的影响要靠前后对比渲染来发现。', en: 'The check covers file contents, not every rendered result; effects through shared components and styles show up only in the before-and-after rendering comparison.' },
          { zh: '外部编辑器不遵守技能的操作锁，写回过程中不要同时编辑这些文件。', en: 'External editors do not honor the skill’s operation lock; do not edit these files while a change is being written back.' },
          { zh: '要在一次修改里新增文件，得在准备副本之前先登记这个文件。', en: 'To add a new file in an edit, register it before the candidate is prepared.' },
        ],
        link: { href: `${records}/2026-10-26-cli-dogfood.md`, label: { zh: '查看 2026-10-26 的实测记录', en: 'Read the 2026-10-26 record' } } },
    ],
  },
  {
    // From our own runs on 2026-11-27 (docs/research/2026-11-27-ai-animation-four-tools.md): one brief, four tools,
    // then the same brief plus a style paragraph. The idea comes from Mimo's comparison video, now a library entry.
    slug: 'choose-a-tool-for-ai-animation',
    translations: { en: { status: 'draft' } },
    publishedAt: '2026-11-27',
    title: { zh: '让 AI 做动画，选 Python、Motion Canvas、Three.js 还是 Blender', en: 'Python, Motion Canvas, Three.js or Blender: which tool to have AI animate with' },
    answer: {
      zh: '我们用同一句需求让 Claude Code 在四种工具里各做一段 4 秒的纸飞机动画。只写内容不写风格时，工具决定了默认的样子：Python 和 Motion Canvas 都给出扁平的剪贴画，Three.js 和 Blender 给出有光照的 3D。加上一段具体的风格要求后，Python 和 Three.js 做出来几乎一样。所以工具主要决定成本和能做什么，画面的质感要靠需求写出来。下面是原样的需求、成品、用时和选择建议。',
      en: 'We gave Claude Code the same brief in four tools and had each make a 4-second paper-plane animation. With content but no style, the tool set the default look: Python and Motion Canvas both gave flat clip art, Three.js and Blender gave lit 3D. With one specific style paragraph added, Python and Three.js came out almost the same. So the tool mostly decides cost and what is possible, and the look has to be written into the brief. Below are the exact brief, the results, the times and how to choose.',
    },
    sections: [
      { id: 'why', heading: { zh: '起因', en: 'Where this came from' },
        body: [{ zh: 'Mimo 发过一段四栏对比视频：同一个纸飞机掠过山坡的场景，用 Claude 分别在 Python、Motion Canvas、Three.js 和 Blender 里做，一栏像水彩，一栏像描边插画，一栏是通透的实时 3D，一栏是完整渲染的 3D。她的帖子里没有给出提示词，所以我们看不出差别有多少来自工具、多少来自写法，就自己跑了一遍。', en: 'Mimo posted a four-panel comparison: one scene, a paper plane over hills, made with Claude in Python, Motion Canvas, Three.js and Blender. One panel looks like watercolour, one like outlined illustration, one like airy real-time 3D, one like fully rendered 3D. Her post does not include the prompts, so we could not tell how much of the difference came from the tool and how much from the wording, and we ran it ourselves.' }],
        link: { href: '/inspiration/x-aura_uniiiii-234774', label: { zh: '看 Mimo 的对比视频', en: 'See Mimo’s comparison video' } } },
      { id: 'setup', heading: { zh: '1. 我们怎么跑的', en: '1. How we ran it' },
        body: [
          { zh: '一台 M2、8 GB 内存的 Mac mini，Claude Code 2.1.331，模型 Opus 5.5，无头运行。每个工具一个空目录，依赖事先装好：Python 带 numpy、matplotlib 和 Pillow，Motion Canvas 3.17.2，three 0.180.0，Blender 5.3.0；需要浏览器的用本机 Chrome。四次只换需求里写工具的那半句：', en: 'An M2 Mac mini with 8 GB of memory, Claude Code 2.1.331 with Opus 5.5, run headless. Each tool got an empty folder with its dependencies installed: Python with numpy, matplotlib and Pillow, Motion Canvas 3.17.2, three 0.180.0, Blender 5.3.0, and the local Chrome where a browser was needed. Only the half-sentence naming the tool changed between the four runs:' },
        ],
        code: same('Make a 4-second animation, 960x540, 24 fps: a paper plane flies across the frame from left to right over rolling green hills, two or three clouds drift slowly, and a windmill on one of the hills turns its blades. Build it with <TOOL> and render it to out.mp4 in this directory (ffmpeg is installed). Work only inside this directory. Do not ask me questions; make reasonable choices. When you finish, list the commands that render it.'),
        list: [
          same('Python (the .venv here has numpy, matplotlib and Pillow; draw the frames yourself)'),
          same('Motion Canvas (its packages are already in node_modules; Google Chrome is in /Applications and playwright-core is installed if you need to drive a browser)'),
          same('Three.js (three is already in node_modules; Google Chrome is in /Applications and playwright-core is installed if you need to drive a browser)'),
          same('Blender, scripted with its Python API (bpy) and run headless (Blender is at ./Blender.app/Contents/MacOS/Blender)'),
        ] },
      { id: 'look', heading: { zh: '2. 不写风格时：工具决定默认的样子', en: '2. Without a style: the tool sets the default look' },
        body: [
          { zh: '四段都按要求做出来了：960×540、24 帧每秒、96 帧。两种 2D 工具几乎撞了脸：Python 用 Pillow 画出扁平的渐变天空和三层山坡，Motion Canvas 多了描边和一个太阳。两种 3D 工具也很像：Three.js 做了带雾和投影的低多边形山坡，还自己加了几十棵树；Blender 是柔和的玩具感 3D，云在山上投下影子，纸飞机远看只是一个白色三角片。', en: 'All four came out to spec: 960×540, 24 fps, 96 frames. The two 2D tools nearly matched: Python drew a flat gradient sky and three layers of hills with Pillow, and Motion Canvas added outlines and a sun. The two 3D tools were close too: Three.js made low-poly hills with fog and shadows and added dozens of trees on its own; Blender gave soft, toy-like 3D with cloud shadows on the hills and a plane that reads as a white wedge.' },
          { zh: '没有一段像 Mimo 视频里的水彩或电影感渲染。不写风格，Agent 会给出这个工具最省事的样子。', en: 'None looks like the watercolour or the cinematic render in Mimo’s video. Without a style, the agent gives the cheapest look the tool offers.' },
        ],
        media: [
          { src: '/guide-media/ai-animation-tools/python.mp4', poster: '/guide-media/ai-animation-tools/python.jpg', width: 640, height: 360, alt: { zh: 'Python 版：扁平渐变天空、三层绿色山坡、白色风车，纸飞机拖着虚线飞过', en: 'Python version: flat gradient sky, three layers of green hills, a white windmill, a paper plane trailing a dashed line' }, caption: { zh: 'Python（Pillow）：Agent 91 秒，渲染 4.7 秒', en: 'Python (Pillow): agent 91 s, render 4.7 s' } },
          { src: '/guide-media/ai-animation-tools/motion-canvas.mp4', poster: '/guide-media/ai-animation-tools/motion-canvas.jpg', width: 640, height: 360, alt: { zh: 'Motion Canvas 版：带描边的扁平插画，风车、太阳和底边被切平的云', en: 'Motion Canvas version: outlined flat illustration with a windmill, a sun and clouds cut flat at the bottom' }, caption: { zh: 'Motion Canvas：Agent 286 秒，渲染 6.9 秒', en: 'Motion Canvas: agent 286 s, render 6.9 s' } },
          { src: '/guide-media/ai-animation-tools/threejs.mp4', poster: '/guide-media/ai-animation-tools/threejs.jpg', width: 640, height: 360, alt: { zh: 'Three.js 版：有光照的低多边形山坡，散布着树，风车和纸飞机', en: 'Three.js version: lit low-poly hills dotted with trees, a windmill and a paper plane' }, caption: { zh: 'Three.js：Agent 197 秒，渲染 5.1 秒', en: 'Three.js: agent 197 s, render 5.1 s' } },
          { src: '/guide-media/ai-animation-tools/blender.mp4', poster: '/guide-media/ai-animation-tools/blender.jpg', width: 640, height: 360, alt: { zh: 'Blender 版：柔和的 3D 圆形山坡，云投下影子，白色三角形的纸飞机', en: 'Blender version: soft rounded 3D hills, clouds casting shadows, a white triangular paper plane' }, caption: { zh: 'Blender（EEVEE）：Agent 218 秒，渲染 59 秒', en: 'Blender (EEVEE): agent 218 s, render 59 s' } },
        ] },
      { id: 'style', heading: { zh: '3. 写了风格时：写法压过工具', en: '3. With a style: the wording outweighs the tool' },
        body: [{ zh: '我们在 Python 和 Three.js 的需求后面加了同一段风格要求，写清材质、边缘、阴影、颜色和节奏：', en: 'We added the same style paragraph to the Python and Three.js briefs, naming the material, edges, shadows, colours and timing:' }],
        code: same('Style: paper-cut collage. Every shape is a flat piece of cut paper with a slightly irregular edge, a soft drop shadow underneath and a faint paper grain; no gradients and no glossy shading. Palette: sage and moss greens, cream, warm terracotta, faded sky blue. Motion is stepped like stop-motion: hold each drawing for two frames (12 drawings per second) and let the plane wobble a little.'),
        media: [
          { src: '/guide-media/ai-animation-tools/python-styled.mp4', poster: '/guide-media/ai-animation-tools/python-styled.jpg', width: 640, height: 360, alt: { zh: 'Python 加风格要求：剪纸拼贴的山坡、奶油色的云、陶土色太阳和风车', en: 'Python with the style paragraph: cut-paper hills, cream clouds, a terracotta sun and windmill' }, caption: { zh: 'Python + 风格段落：Agent 381 秒', en: 'Python + style paragraph: agent 381 s' } },
          { src: '/guide-media/ai-animation-tools/threejs-styled.mp4', poster: '/guide-media/ai-animation-tools/threejs-styled.jpg', width: 640, height: 360, alt: { zh: 'Three.js 加风格要求：同样的剪纸拼贴，平面纸片，没有 3D 光照', en: 'Three.js with the style paragraph: the same cut-paper collage, flat paper pieces, no 3D lighting' }, caption: { zh: 'Three.js + 风格段落：Agent 237 秒', en: 'Three.js + style paragraph: agent 237 s' } },
        ],
        list: [
          { zh: '两段都做出了不规则的纸边、纸纹、软阴影和那几种颜色，也都每两帧才换一张画', en: 'Both have irregular paper edges, grain, soft shadows and the named colours, and both hold each drawing for two frames' },
          { zh: 'Three.js 放弃了光照，把每样东西做成平面纸片，用五层半透明副本叠出阴影', en: 'Three.js dropped its lighting, made every object a flat paper piece and built shadows from five translucent copies' },
          { zh: '两段放在一起，比没写风格时的 Python 和 Three.js 更像；Agent 用时变长了，Python 从 91 秒到 381 秒', en: 'Side by side they look more alike than the unstyled Python and Three.js did; the agent took longer, Python going from 91 s to 381 s' },
        ] },
      { id: 'motion', heading: { zh: '4. 动起来的感觉也要写', en: '4. Motion feel has to be written too' },
        body: [{ zh: '四段不写风格的版本，运动都是一个匀速时钟加正弦波：飞机匀速横穿、上下起伏，风车匀速转，云匀速飘。没有起步、减速、停顿或弹性。Motion Canvas 擅长缓动和分段动画，这次也只用了一个 linear 的时钟。想要“飞机先冲出来再慢慢滑”“风车被风吹得一顿一顿”，得写在需求里，或者写出缓动曲线的名字。', en: 'In all four unstyled versions the motion is one constant clock plus sine waves: the plane crosses at a steady speed and bobs, the windmill turns evenly, the clouds drift evenly. There is no ease-in, slow-down, pause or bounce. Motion Canvas is built for easing and sequenced animation, and this run still used a single linear clock. If you want the plane to dart in and then glide, or the windmill to turn in gusts, write it in the brief, or name the easing curve.' }],
        link: { href: '/docs/motion-rules-for-ai-generated-ui', label: { zh: '给 AI 生成的界面定动效规则', en: 'Motion rules for AI-generated UI' } } },
      { id: 'effort', heading: { zh: '5. 工具真正决定的：成本和坑', en: '5. What the tool really decides: cost and gotchas' },
        body: [{ zh: '“渲染”是全部跑完后，机器空闲时我们按 Agent 给的命令再跑一次的用时。', en: '"Render" is the time to run the agent’s own render command again afterwards, on an idle machine.' }],
        list: [
          { zh: 'Python：最快、最好预测。逐帧画好直接交给 ffmpeg，渲染不到 5 秒。缺点是什么都得自己画，默认就是剪贴画。', en: 'Python: the fastest and most predictable. It draws each frame and pipes it to ffmpeg, rendering in under 5 seconds. The catch is that everything is drawn by hand, and the default is clip art.' },
          { zh: 'Motion Canvas：没有无头渲染命令，只能在编辑器里点 Render。Agent 去读界面代码找到按钮，再用 playwright 在无头 Chrome 里点它；它输出了 98 帧，要截成 96 帧。前一轮它在 30 分钟里一直在找出片的办法，没有做出成品。', en: 'Motion Canvas: there is no headless render command, only the Render button in its editor. The agent read the UI code to find the button and clicked it with playwright in headless Chrome; it output 98 frames that had to be cut to 96. In an earlier round it spent 30 minutes looking for a way to render and produced nothing.' },
          { zh: 'Three.js：要一个浏览器出片，走哪条图形路径差很多。这一轮用 GPU，渲染 5 秒；前一轮 Agent 选了软件渲染，整次用了约 16 分钟。它会自己加需求里没有的东西，比如树和影子。', en: 'Three.js: it needs a browser to render, and the graphics path matters a lot. This round used the GPU and rendered in 5 seconds; in an earlier round the agent picked software rendering and the whole run took about 16 minutes. It adds things nobody asked for, such as trees and shadows.' },
          { zh: 'Blender：渲染慢一个数量级，也最吃机器。空闲时 96 帧 59 秒；前一轮和别的任务同时跑，每帧 6.5 到 33 秒，整段约 19 分钟，而 Agent 把渲染放到后台就给出了最后的回复，没有等它跑完。默认的 EEVEE 画面是玩具感，不是电影感，Mimo 说她的 Blender 每次迭代要等三四十分钟。', en: 'Blender: an order of magnitude slower to render, and the heaviest on the machine. Idle, 96 frames took 59 seconds; in an earlier round, sharing the machine with other jobs, each frame took 6.5 to 33 seconds, about 19 minutes in all, and the agent moved the render to the background and gave its final reply without waiting for it to finish. The default EEVEE look is toy-like, not cinematic; Mimo says each Blender iteration of hers took 30 to 40 minutes.' },
        ],
        link: { href: `${records}/2026-11-27-ai-animation-four-tools.md`, label: { zh: '查看完整记录', en: 'Read the full record' } } },
      { id: 'pick', heading: { zh: '6. 怎么选', en: '6. Which to pick' },
        body: [],
        list: [
          { zh: '要快、要能反复改、画面是 2D 插画、图表或手绘质感：Python。风格写清楚，它几乎什么都能画。', en: 'Fast, many revisions, a 2D illustration, chart or hand-drawn look: Python. With the style written out, it can draw almost anything.' },
          { zh: '讲解视频、要精确的时间轴和缓动：Motion Canvas，但先准备好出片的办法，或者能接受在编辑器里手动点 Render。批量做模板化视频，Mimo 提到同类的 Remotion 更合适，我们没有试。', en: 'Explainers that need a precise timeline and easing: Motion Canvas, but sort out how to render first, or accept clicking Render in the editor. For templated videos in bulk, Mimo points to Remotion; we did not try it.' },
          { zh: '要真的 3D 空间、镜头运动，或者同一个场景还要放在网页上交互：Three.js。确认无头浏览器走的是 GPU。', en: 'Real 3D space, camera moves, or a scene that should also run interactively on a page: Three.js. Check that the headless browser uses the GPU.' },
          { zh: '要电影级的光影和材质，并且能等：Blender。先渲一两帧看构图，再渲整段；内存小的机器上不要和别的渲染一起跑。', en: 'Cinematic light and materials, and time to wait: Blender. Render a frame or two to check the composition before the whole clip, and on a machine with little memory do not run it alongside other renders.' },
        ] },
      { id: 'brief', heading: { zh: '7. 和 Variant Design 的关系', en: '7. How this relates to Variant Design' },
        body: [
          { zh: 'Variant Design 要解决的就是这个问题：AI 不被告知要什么样，就给出最省事、最常见的样子。动画和界面一样，选工具只决定从哪个默认值出发，质感、颜色、节奏要写成能检查的要求。我们的技能在生成之前先把形容词拆成具体的做法，并让三个方向在取舍上真正不同，而不是同一个默认值换三种颜色。', en: 'This is the problem Variant Design exists for: told nothing about the look, AI gives the cheapest, most common one. Animation is no different from interfaces here. The tool only decides which default you start from; texture, colour and timing have to be written as requirements you can check. Before generating, our skill turns adjectives into concrete methods and makes the three directions differ in their tradeoffs, not one default in three colours.' },
          { zh: '技能本身生成的是界面，不生成视频；这里借的是写需求的方法。', en: 'The skill itself generates interfaces, not video; what carries over is how to write the brief.' },
        ],
        link: { href: '/guides/write-a-design-brief-for-ai', label: { zh: '怎么给 AI 写设计需求', en: 'How to write a design brief for AI' } } },
      { id: 'limits', heading: { zh: '没有验证的', en: 'Not verified' },
        body: [],
        list: [
          { zh: '每个工具、每种写法只跑了一次；前后两轮的用时差别很大，数字只能看量级。', en: 'Each tool and wording ran once; times differed a lot between the two rounds, so read them as orders of magnitude.' },
          { zh: '只试了 Claude Code 和 Opus 5.5，没有试 Codex 或别的模型。', en: 'Only Claude Code with Opus 5.5; not Codex or other models.' },
          { zh: '没有试 manim、Remotion，也没有试 Blender 的 Cycles 渲染器；风格段落只在 Python 和 Three.js 上试过。', en: 'No manim, no Remotion and no Blender Cycles; the style paragraph was tried only with Python and Three.js.' },
          { zh: '没有找人盲评哪一段更好看。', en: 'No blind rating of which clip looks better.' },
        ] },
    ],
  },
];
