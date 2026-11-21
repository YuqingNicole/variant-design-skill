// Answer pages at /guides, shared by GuidesPage and the prerendered metadata (scripts/prerender.mjs).
// Plain data only: the prerender imports this file without a TS loader for JSX.
// Every claim here must trace to the skill's own docs or a dated record in docs/research/.
import type { Localized } from './i18n/localized';
import type { Translations } from './i18n/translations';
import { deliver, installCommand, prompts, repository, refine } from './docs-content';

export type GuideSection = { id: string; heading: Localized; body: Localized[]; list?: Localized[]; code?: Localized; link?: { href: string; label: Localized } };
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
];
