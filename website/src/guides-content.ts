// Answer pages at /guides, shared by GuidesPage and the prerendered metadata (scripts/prerender.mjs).
// Plain data only: the prerender imports this file without a TS loader for JSX.
// Every claim here must trace to the skill's own docs or a dated record in docs/research/.
import type { Localized } from './i18n/localized';
import { deliver, installCommand, prompts, repository, refine } from './docs-content';

export type GuideSection = { id: string; heading: Localized; body: Localized[]; list?: Localized[]; code?: Localized; link?: { href: string; label: Localized } };
export type Guide = { slug: string; title: Localized; answer: Localized; publishedAt: string; sections: GuideSection[] };

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
        code: same(installCommand), link: { href: '/docs', label: { zh: '查看完整安装指南', en: 'Read the full install guide' } } },
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
          { zh: '1.1 之前的快照没有记录修改后的基准，自动撤回会拒绝，要用 recover 处理。', en: 'Snapshots from before 1.1 lack the post-edit baseline, so automatic undo refuses them. Use recover instead.' },
        ],
        link: { href: `${records}/2026-10-27-integration-baseline.md`, label: { zh: '查看接入实测记录', en: 'Read the integration record' } } },
    ],
  },
  {
    slug: 'avoid-generic-ai-ui',
    publishedAt: '2026-11-02',
    title: { zh: '怎么让 AI 生成的界面不千篇一律', en: 'How to keep AI-generated interfaces from looking the same' },
    answer: {
      zh: '不要只让 AI 出一版。先写清真实任务和不能变的约束，再让它做几个在取舍上真正不同的方向，比较后由你决定。下面是我们的做法，用 Pulse 案例说明。它来自实际运行记录，但我们没有做过用户对照实验，不能证明它一定更好。',
      en: 'Do not ask AI for one version. State the real task and the constraints that cannot change, have it build directions that differ in their tradeoffs, then compare them and decide yourself. Below is how we do it, using the Pulse case. It comes from recorded runs, but we have not run a controlled user study, so it does not prove the result is better.',
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
        link: { href: '/inspiration', label: { zh: '浏览设计参考', en: 'Explore references' } } },
      { id: 'decide', heading: { zh: '5. 要推荐，但自己决定', en: '5. Ask for a recommendation, then decide yourself' },
        body: [{ zh: '让 AI 说明每个方向优化什么、牺牲什么、适合什么场景，再给出有理由的推荐。推荐不等于选定，最终选择应该由了解产品的人来做。', en: 'Have AI state what each direction optimizes, what it gives up and where it fits, then recommend one with reasons. A recommendation is not a choice; that belongs to someone who knows the product.' }] },
    ],
  },
];
