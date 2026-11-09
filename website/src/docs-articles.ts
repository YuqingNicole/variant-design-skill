// Long-form articles at /docs/<slug>, in the same shape as the answers at /guides (see guides-content.ts).
// Plain data only: the prerender imports this file without a TS loader for JSX.
// Every claim here must trace to a file in this repository (a reference, a script, or a dated record in docs/research/ or CHANGELOG.md).
// The English is machine-assisted and unreviewed, so it is marked draft: production leaves it out until someone reviews it (RFC-005 §3.5).
import type { Guide } from './guides-content';
import { repository } from './docs-content';

const blob = `${repository}/blob/master`;
const draft = { en: { status: 'draft' as const } };

export const docsArticles: Guide[] = [
  {
    slug: 'design-exploration-with-ai-coding-agents',
    base: '/docs',
    publishedAt: '2026-11-09',
    translations: draft,
    title: { zh: '用 AI 编码 Agent 做设计探索：一个可以撤回的流程', en: 'Design exploration with AI coding agents: a loop you can undo' },
    answer: {
      zh: '让 Agent 在你自己的项目里一次做出三个取舍不同的方向，并排比较，只改你选中的那一个，改坏了能撤回，选定后再接入。关键不是生成得更快，而是每一步都不会覆盖你没看过的改动。下面是这个流程和它保证的边界。',
      en: 'Have the agent build three directions with different tradeoffs inside your own project, compare them side by side, edit only the one you choose, and undo what goes wrong. Integrate only after you pick. The point is not faster generation; it is that no step overwrites work you have not seen. Below are the loop and the limits of what it promises.',
    },
    sections: [
      { id: 'why', heading: { zh: '为什么一版不够', en: 'Why one version is not enough' },
        body: [
          { zh: '第一版往往只是模型最顺手的那个答案。要判断它好不好，需要另外两个在取舍上真正不同的方案作对照：一个先处理要行动的事，一个并排比较，一个追查原因，是三种不同的读法，而不是三套配色。', en: 'The first version is usually the answer the model finds easiest. To judge it you need two others that differ in their tradeoffs: one that leads with what to act on, one that compares side by side, one that traces causes. That is three ways of reading, not three palettes.' },
        ],
        link: { href: '/guides/avoid-generic-ai-ui', label: { zh: '怎么写任务，让三个方向真的不同', en: 'How to brief so the three directions really differ' } } },
      { id: 'loop', heading: { zh: '流程：生成、比较、试改、选定、接入', en: 'The loop: generate, compare, refine, pick, integrate' },
        body: [
          { zh: '技能装进项目后，直接用自然语言发任务。它在项目的 variant-output/ 里生成 A/B/C，每个方向写明优化什么、牺牲什么、适合什么场景。之后可以用简短的指令继续：', en: 'With the skill installed, send the brief in plain language. It writes A/B/C to variant-output/ in your project, and each direction states what it optimizes, what it gives up and where it fits. After that, short commands continue the work:' },
        ],
        list: [
          { zh: 'compare：重新打开三版比较页', en: 'compare: reopen the side-by-side comparison' },
          { zh: 'B vary subtle — hero：只精修 B 的 hero，先存快照，不会选定 B', en: 'B vary subtle — hero: refine only B’s hero, snapshot first, never selects B' },
          { zh: 'Mix A + B：合并两版，并说明冲突时的取舍', en: 'Mix A + B: merge two versions and explain tradeoffs where they conflict' },
          { zh: 'undo B：恢复 B 上一次的文件和 tokens，A/C 与最终选择不受影响', en: 'undo B: restore B’s previous files and tokens; A/C and the final selection stay unchanged' },
          { zh: 'pick B：把 B 记为最终方案，再接入项目', en: 'pick B: record B as the final choice, then integrate it' },
        ],
        link: { href: '/docs/install', label: { zh: '安装并走一遍完整流程', en: 'Install and run the full loop' } } },
      { id: 'promises', heading: { zh: '它保证什么', en: 'What the loop promises' },
        body: [
          { zh: '这些是技能自带脚本的约束，由测试检查，不是对模型行为的保证：', en: 'These are constraints of the skill’s bundled scripts, enforced by tests. They are not promises about model behavior:' },
        ],
        list: [
          { zh: '修改不等于选定：只有你明确说 pick B，才会记录最终选择；导出和接入都不会替你选。', en: 'Editing is not selecting: only an explicit pick B records the final choice. Export and integration never select for you.' },
          { zh: '不覆盖没看过的改动：改动前先存快照；如果文件在记录之后又被改过，撤回会拒绝，并且没有强制选项。', en: 'No overwriting of unseen work: a snapshot is written before an edit, and undo refuses if files changed after the recorded revision. There is no force option.' },
          { zh: '一个请求对应一次撤回：同一个请求产生的多处修改会一起撤回。', en: 'One request is one undo: edits made for the same request are reverted together.' },
          { zh: '接入可以回滚：回滚同样会在接入后的文件被改过时拒绝。', en: 'Integration can be rolled back, and rollback also refuses if the integrated files were edited afterwards.' },
        ],
        link: { href: '/guides/git-or-snapshot-undo', label: { zh: '快照撤回和 Git 怎么配合', en: 'How snapshot undo and Git fit together' } } },
      { id: 'limits', heading: { zh: '它不保证什么', en: 'What it does not promise' },
        body: [
          { zh: '技能不评分，也不证明某个方向更好；它让比较变得容易，决定仍然是你的。我们也没有做过用户对照实验。生成的质量取决于你的 Agent 和模型，所以下面两篇文章讲怎么在交付前检查。', en: 'The skill does not score anything or prove that one direction is better; it makes comparing easy, and the decision stays yours. We have not run a controlled user study either. Quality depends on your agent and model, which is why the next two articles cover checking before you ship.' },
        ],
        link: { href: '/docs/check-ai-generated-ui-before-you-ship', label: { zh: '交付前怎么检查', en: 'How to check before you ship' } } },
    ],
  },
  {
    slug: 'check-ai-generated-ui-before-you-ship',
    base: '/docs',
    publishedAt: '2026-11-09',
    translations: draft,
    title: { zh: '交付前怎么检查 AI 生成的界面', en: 'How to check AI-generated UI before you ship' },
    answer: {
      zh: '分三层：先跑脚本做机械检查，再看渲染出来的页面，最后用键盘和减弱动效设置真的操作一遍。脚本只能发现已知的缺陷，一个设计是否连贯、有没有个性，要靠看。下面是技能里写明的检查项，以及每一层不能说明什么。',
      en: 'Check in three layers: run the scanner, look at the rendered page, then actually operate it with a keyboard and with reduced motion on. The scanner only finds known defects; whether a design is coherent and has a point of view takes a look. Below are the checks the skill states, and what each layer cannot tell you.',
    },
    sections: [
      { id: 'mechanical', heading: { zh: '1. 机械检查', en: '1. The mechanical gate' },
        body: [
          { zh: '技能自带一个零依赖的扫描脚本，检查 HTML、CSS、JSX、TSX、Vue、Svelte 和 Astro 里常见的无障碍、健壮性、文案和“AI 套路”问题。严格模式下，警告也会让它失败。', en: 'The skill ships a zero-dependency scanner. It checks HTML, CSS, JSX, TSX, Vue, Svelte and Astro files for common accessibility, resilience, copy and AI-pattern problems. In strict mode a warning also fails the run.' },
          { zh: '它基于文本模式，会有误报，改代码前先看匹配的那一行。例如我们自己就遇到过：日期格式化里的 padStart(2, \'0\') 曾被当成“装饰性数字”，后来改成读到日期代码时跳过。', en: 'It matches text patterns, so it can be wrong; read the matched line before changing code. We hit this ourselves: padStart(2, \'0\') in a date formatter was reported as a decorative number, and the scanner now skips it when the file formats dates.' },
        ],
        code: { zh: 'node <skill-root>/scripts/quality-gate.mjs <文件或目录> --strict', en: 'node <skill-root>/scripts/quality-gate.mjs <file-or-directory> --strict' },
        link: { href: `${blob}/references/workflow/quality-baseline.md`, label: { zh: '阅读完整的质量基线', en: 'Read the full quality baseline' } } },
      { id: 'visual', heading: { zh: '2. 看渲染结果', en: '2. Look at the rendered result' },
        body: [{ zh: '源码通过不等于页面好看。打开渲染后的页面，逐项过一遍：', en: 'Passing source checks does not make a page good. Open the rendered page and go through these:' }],
        list: [
          { zh: '眯起眼睛看，层级是否一眼清楚；', en: 'Squint: is the hierarchy obvious?' },
          { zh: '间距、字号来自一小组 token，而不是每处各写一个值；', en: 'Do spacing and type come from a small token set instead of one-off values?' },
          { zh: '手机上是重新排布的，不是把桌面版缩小；', en: 'Is mobile recomposed rather than shrunk?' },
          { zh: '按钮有悬停、焦点、按下、加载、错误和成功的反馈；', en: 'Do actions give hover, focus, active, loading, error and success feedback?' },
          { zh: '真实的长文本、空状态和失败内容不会撑坏版面。', en: 'Do realistic long, empty and failure content survive the layout?' },
        ] },
      { id: 'habits', heading: { zh: '3. 找生成器的惯用手法', en: '3. Look for generator habits' },
        body: [{ zh: '不管产品是什么，生成的界面常常收敛到同一批做法。技能的基线要求每一个都要有“关于这个产品任务”的理由，“看起来有设计感”不算理由。常见的有：', en: 'Whatever the product, generated interfaces converge on the same moves. The skill’s baseline asks that each one have a reason about this product’s task; “it looks designed” is not one. Common ones:' }],
        list: [
          { zh: '标题上方全大写、加字距的小标签；', en: 'Uppercase, letter-spaced eyebrow labels above headings;' },
          { zh: '装饰性数字：补零的计数、步骤编号、答不出任何问题的大号统计；', en: 'Decorative numbers: zero-padded counts and step numbers, oversized stats that answer no question;' },
          { zh: '工具页里的口号和推广卡片；', en: 'Slogans and promotional cards inside a tool page;' },
          { zh: '每个区块都是带边框、圆角、阴影的卡片，卡片里套卡片；', en: 'Every block in a bordered, rounded, shadowed card, with cards inside cards;' },
          { zh: '三个方向共用一个骨架，只换配色。', en: 'Three directions sharing one skeleton and differing only in palette.' },
        ] },
      { id: 'behavior', heading: { zh: '4. 真的操作一遍', en: '4. Operate it for real' },
        body: [
          { zh: '扫描通过只是静态预检。用键盘逐个按 Tab，看实际算出来的焦点样式；在 prefers-reduced-motion: reduce 下再试一次。记录你检查的页面、视口、操作、预期和实际结果，以及没测的部分。', en: 'A passing scan is only a static preflight. Tab through the real controls and inspect the computed focus style, then try again under prefers-reduced-motion: reduce. Record the page, viewport, action, expected and actual result, and what you did not test.' },
          { zh: '不要把“我们测了几个夹具”说成“验证了所有以后生成的页面”，也不要凭检查脚本声称符合 WCAG。', en: 'Do not describe a few fixtures as validating every future page, and do not claim WCAG conformance from a scan.' },
        ] },
    ],
  },
  {
    slug: 'motion-rules-for-ai-generated-ui',
    base: '/docs',
    publishedAt: '2026-11-09',
    translations: draft,
    title: { zh: '给 AI 生成的界面定动效规则', en: 'Motion rules for AI-generated interfaces' },
    answer: {
      zh: '先问用户多久遇到这个元素一次，再决定要不要动。高频的操作不加动效，只留颜色变化；偶尔出现的弹层用 150–300 毫秒；只有第一次或很少发生的时刻才可以夸张。下面是技能里的动效规则，以及我们对它做过的一次检查和这次检查的局限。',
      en: 'Ask how often the user meets the element before deciding whether it moves. Frequent actions get no motion beyond a colour change; occasional overlays get 150–300ms; only rare or first-time moments may be expressive. Below are the skill’s motion rules, plus the one check we ran on them and its limits.',
    },
    sections: [
      { id: 'frequency', heading: { zh: '1. 先按频率决定', en: '1. Decide by frequency' },
        body: [{ zh: '频率比品味更能决定动效预算：', en: 'Frequency decides the budget more than taste does:' }],
        list: [
          { zh: '键盘触发或每分钟多次（命令面板、快捷键）：不加动效；', en: 'Keyboard-initiated or many times a minute (command palette, shortcuts): none;' },
          { zh: '每天很多次（悬停、列表导航、筛选）：只做颜色、透明度或下划线变化，140 毫秒以内，不要位移、倾斜或滑动；', en: 'Many times a day (hover, list navigation, filters): a colour, opacity or underline change, 140ms or less, with no lift, tilt or slide;' },
          { zh: '偶尔出现（菜单、对话框、提示条、抽屉）：标准的 150–300 毫秒进入，退出更短；', en: 'Now and then (menu, dialog, toast, drawer): the standard 150–300ms entrance, with a shorter exit;' },
          { zh: '很少或第一次（引导、完成任务、庆祝）：可以更有表现力。', en: 'Rare or first time (onboarding, a finished task, a celebration): may be expressive.' },
        ] },
      { id: 'rules', heading: { zh: '2. 写进代码的规则', en: '2. Rules that go into the code' },
        body: [{ zh: '这些是技能里 motion-rules.md 的要点：', en: 'The essentials of the skill’s motion-rules.md:' }],
        list: [
          { zh: '用户触发的反馈不超过 300 毫秒；按下反馈 100–160 毫秒；', en: 'UI feedback stays within 300ms; press feedback 100–160ms;' },
          { zh: '时长和曲线放进 :root 上的变量，处处使用，不手写；', en: 'Put durations and the curve in tokens on :root and use them everywhere instead of typing values;' },
          { zh: '不要从 scale(0) 出现，从 scale(0.95)–scale(0.98) 加透明度 0 开始；', en: 'Nothing appears from scale(0); start at scale(0.95)–scale(0.98) with opacity 0;' },
          { zh: '只动画 transform、opacity 和颜色，永远不写 transition: all，把属性写出来；', en: 'Animate transform, opacity and colour; never transition: all, list the properties;' },
          { zh: '能重复触发的东西用 transition（可以从当前位置转向），只触发一次的挂载才用关键帧；', en: 'Use transitions for anything that can be triggered again, and keyframes only for one-shot mounts;' },
          { zh: '悬停动效放进 @media (hover: hover) and (pointer: fine)，触屏上点一下会误触发悬停。', en: 'Put hover motion inside @media (hover: hover) and (pointer: fine); a tap on a touch screen fires a false hover.' },
        ],
        link: { href: `${blob}/references/design-system/motion-rules.md`, label: { zh: '阅读完整规则', en: 'Read the full rules' } } },
      { id: 'reduced', heading: { zh: '3. 减弱动效不等于全部关掉', en: '3. Reduced motion means fewer and gentler, not none' },
        body: [{ zh: '去掉位移、缩放、视差、自动播放视频和循环效果，保留解释状态的反馈：透明度和颜色变化、焦点样式、进度，以及对话框的淡入。把所有时长设成 0.01 毫秒会连这些反馈一起去掉，所以更好的做法是限定哪些属性可以过渡。', en: 'Remove movement, scaling, parallax, autoplaying video and looping effects. Keep the feedback that explains state: opacity and colour changes, focus indicators, progress and a dialog’s fade-in. Setting every duration to 0.01ms removes that feedback too, so limit which properties may transition instead.' }] },
      { id: 'check', heading: { zh: '4. 我们检查过什么，没检查什么', en: '4. What we checked and what we did not' },
        body: [
          { zh: '2026-11-09，我们用 Claude Code 在一个烘焙店页面上跑了一次带动效要求的任务（一次运行，一个 Agent，一个模型）。技能按路由读到了 motion-rules.md，三个方向都通过了五项静态文本检查：没有 transition: all，没有从 scale(0) 开始，悬停位移只出现在 (hover: hover) 里，有动效的地方都有 prefers-reduced-motion 规则，并且确实有动效。同一次运行里质量扫描报了一个误报，已修复。', en: 'On 2026-11-09 we ran one task with a motion brief on a bakery page using Claude Code (one run, one agent, one model). The skill read motion-rules.md by its route, and all three directions passed five static text checks: no transition: all, nothing started from scale(0), hover movement only inside (hover: hover), a prefers-reduced-motion rule wherever there was motion, and some motion present. The same run showed one false positive in the quality scan, since fixed.' },
          { zh: '这不能证明是这些规则带来了这个结果：没有去掉规则文件的对照运行，一次运行也分不清文件和模型本身的习惯。这些检查只看文本，不检验动效好不好看、节奏对不对、是否流畅，那次记录里也没有人打开预览。', en: 'It does not show that the rules caused the result: there is no run without the file to compare with, and one run cannot separate the file from the model’s own habits. The checks read text only. They do not test how the motion looks, its timing or smoothness, and nobody opened the previews for that record.' },
        ],
        link: { href: `${blob}/docs/research/2026-11-09-motion-eval.md`, label: { zh: '阅读这次运行的记录', en: 'Read the record of that run' } } },
    ],
  },
  {
    slug: 'measure-layout-shift-in-ai-built-pages',
    base: '/docs',
    publishedAt: '2026-11-09',
    translations: draft,
    title: { zh: '测一测 AI 做的页面会不会跳：版面位移实例', en: 'Measure whether an AI-built page jumps: a layout shift case' },
    answer: {
      zh: '看起来没问题的页面，也可能在内容晚到时把读者正在看的东西推走。浏览器的 layout-shift 记录能量出这个位移，预算是 0.1。我们自己的网站就遇到过：一条来自 X 的嵌入内容让桌面端首页在生产环境测得 0.36。下面是怎么量、原因、怎么改，以及这些数字的局限。',
      en: 'A page that looks fine can still push away what the reader is looking at when late content arrives. The browser’s layout-shift entries measure it, with a budget of 0.1. Our own site hit this: an embedded X post made the desktop home page measure 0.36 on production. Below are how we measured, the cause, the fix and the limits of these numbers.',
    },
    sections: [
      { id: 'measure', heading: { zh: '1. 怎么量', en: '1. How to measure' },
        body: [
          { zh: '在真实的 Chrome 里加载页面，用 PerformanceObserver 收集 layout-shift 记录，把没有用户输入紧随其后的位移值加起来。输入之后 500 毫秒内的位移不计入，所以要像读者那样真的点开一张卡片、等内容到齐再看。我们的 tests/perf-lab.mjs 就是这样做的，它是单机的实验室数据，不是读者实际体验到的数据。', en: 'Load the page in real Chrome, collect layout-shift entries with a PerformanceObserver and add up the shifts that did not closely follow a user input. A shift within 500ms of an input is not counted, so open a card the way a reader would and wait for content to arrive. Our tests/perf-lab.mjs does this. It is lab data from one machine, not what readers experience.' },
        ],
        link: { href: `${blob}/tests/perf-lab.mjs`, label: { zh: '查看测量脚本', en: 'Read the measuring script' } } },
      { id: 'cause', heading: { zh: '2. 我们的原因', en: '2. Our cause' },
        body: [
          { zh: '灵感库里有来自 X 的帖子，打开后由 X 的官方嵌入组件加载完整内容。真实的嵌入约 1,270 像素高（含被引用的帖子），比它替换的那段文字高得多。「访问原站」按钮和加载提示排在它下面，嵌入到达时被整体推走。', en: 'The inspiration library includes posts from X, loaded in full by X’s official embed when you open one. The real embed is about 1,270px tall (it includes the quoted post), far taller than the text it replaces. The “visit original” button and the loading notice sat below it, and were pushed away when it arrived.' },
          { zh: '2026-11-09 在生产环境的实验室测量（三次取中位数）：改动前桌面端首页 0.36，改动后 0.043；手机端 /browse/interaction 先后测得 0.16、0.059、0.085。最后两个手机数字说明真实嵌入的波动不小，所以它离预算并不远。', en: 'Lab runs on production on 2026-11-09 (median of three): the desktop home page measured 0.36 before the change and 0.043 after. The phone /browse/interaction page measured 0.16, then 0.059, then 0.085. The last two show that the real embed varies, so it is not far from the budget.' },
        ],
        link: { href: `${repository}/blob/master/CHANGELOG.md`, label: { zh: '查看更新记录', en: 'Read the changelog' } } },
      { id: 'fix', heading: { zh: '3. 怎么改', en: '3. The fix' },
        body: [
          { zh: '规则只有一条：会变高的东西放在最后，任何读者能看到的内容都不要排在它下面。我们把链接和提示移到帖子上方，帖子的存档文字和嵌入内容在同一帧里替换，弹层在桌面上改为靠近顶部对齐，这样变高时向下增长，而不是整体上移。', en: 'There is one rule: put what can grow last, and leave nothing a reader can see below it. We moved the link and the notice above the post, swap the stored text and the embed in the same frame, and anchor the dialog near the top on desktop so it grows downward instead of shifting up.' },
          { zh: '图片也是同一个道理：给它们写明 width 和 height，或者 aspect-ratio，浏览器才能在图片到达之前留出位置。', en: 'Images follow the same rule: give them explicit width and height, or an aspect-ratio, so the browser reserves room before they arrive.' },
        ] },
      { id: 'guard', heading: { zh: '4. 用测试守住它', en: '4. Guard it with a test' },
        body: [
          { zh: '我们让测试用一个来得晚、又很高的假嵌入代替 X 的脚本，检查链接和提示的位置在嵌入到达前后没有变，并设了 0.1 的预算。把修复还原后，这个测试会失败，这是我们确认它真的在起作用的方式。', en: 'Our tests replace X’s script with a late, tall stand-in and check that the link and the notice do not move when it arrives, under a 0.1 budget. With the fix reverted the test fails, which is how we confirmed it checks anything.' },
          { zh: '局限：假嵌入的高度是固定的，真实组件的高度和到达次数会变，所以生产环境的数字还要单独量，上面的数字也只是三次运行的中位数。', en: 'Limits: the stand-in has a fixed height, while the real widget varies in height and in how many times it changes the page, so production still needs its own measurement, and the figures above are medians of three runs.' },
        ] },
    ],
  },
];
