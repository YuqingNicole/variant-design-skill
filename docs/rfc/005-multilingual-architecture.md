# RFC-005 · 网站多语言架构

- 状态：已接受，P0 已实施（`website/src/i18n/`）；P1 逐页推进，灵感页已完成（2026-11-02：`inspiration-data.ts` 改为按语言取值，`InspirationPage.tsx` 的三元表达式和位置读取清零，中英文页面文字与 `aria-label` 前后对比一致）；首页、作品页、分类页和 `/docs` 也已完成（2026-11-02，同样做了前后对比）。先把结构定下来，再按 §5 的阶段推进。维护者 2026-11-02 决定：英文是第一个可独立收录的语言版本，试点页面为首页、`/docs`、`/inspiration`、作品页、分类页和 `/guides`。
- 日期：2026-11-01。
- 关联：RFC-002（方向库路由、预渲染、方向卡）、RFC-003 §5（多语言、SEO 与 GEO 的目标和验收）、`docs/design-system.md`。
- 范围：`website/` 的文案模型、语言状态、路由、预渲染、字体和测试。技能本身（`SKILL.md`、`skills/`、`references/`）不在范围内。

## 1. 为什么现在写

网站已经中英双语，但现在的写法只适合"恰好两种语言、只有中文被搜索引擎看到"。再加一种语言，或者让英文页面能被独立收录，都要先改结构。RFC-003 §5 写了要观察什么、怎么验收，并要求"必要时单独提交架构 RFC"；本文就是这份架构，只定方案，不改代码。

## 2. 现状（2026-11-01，master `01f0709`）

| 方面 | 现在的做法 | 加第三种语言或让英文可收录时的问题 |
|---|---|---|
| 数据里的文案 | 位置数组 `[中文, 英文]`：`inspiration-data.ts`、`website/content/entries/*.json`、`DocsGuide.tsx` 等 | 第三种语言只能追加到第 3 位，读的地方都写死了 `[0]`、`[1]` 或 `[ix]`；缺译时没有办法表示 |
| 组件里的文案 | 17 个文件里约 400 处 `zh?'…':'…'` 三元表达式，另有约 170 处按位置读 `[ix]`、`[0]`、`[1]`（`node website/scripts/i18n-inventory.mjs` 统计，2026-11-01 为 404 / 177） | 只能表达两种语言；文案散在 JSX 里，翻译时找不全 |
| 语言状态 | 9 个页面各自读 `localStorage` 的 `variant-language`，各自设置 `document.documentElement.lang`；工作台另外读 `?language=` | 同一个地址显示两种语言，搜索引擎和分享出去的链接只能看到一种；页面之间靠本地存储同步 |
| 预渲染 | `prerender.mjs` 只输出中文正文、标题、描述；每页一个 canonical；sitemap 只有中文地址；没有 `hreflang` | 英文内容对不执行 JavaScript 的抓取器和 AI 不可见 |
| 字体 | 标题中文用霞鹜新致宋（简体字形，按 `unicode-range` 切片），页脚有 IPA 授权说明 | 日文、繁体需要不同字形；授权说明只有中英两种 |
| 第三方内容 | X 帖子保存原文和 `lang`；外部参考只链接 | 原文不应被翻译，但我们的笔记要翻译 |
| 日期、数字 | 部分用 `toLocaleDateString(zh?'zh-CN':'en-US')`，部分手写 | 需要统一从语言表取 |

## 3. 设计决定

### 3.1 语言表

新建 `website/src/i18n/locales.ts`，作为唯一的语言清单：

```ts
export const locales = {
  zh: { htmlLang: 'zh-CN', label: '中文', path: '', fallback: null, dateLocale: 'zh-CN', published: true },
  en: { htmlLang: 'en', label: 'English', path: '/en', fallback: 'zh', dateLocale: 'en-US', published: true },
  // ja: { htmlLang: 'ja', label: '日本語', path: '/ja', fallback: 'en', dateLocale: 'ja-JP', published: false },
} as const;
export type Locale = keyof typeof locales;
```

`published: false` 的语言可以在本地和预览环境里看，但不进路由表、sitemap 和语言切换器。加一种语言就是在这里加一行，再补文案。

### 3.2 文案模型：从位置数组改成按语言取值

```ts
export type Localized<T = string> = { zh: T } & Partial<Record<Exclude<Locale, 'zh'>, T>>;
export function t<T>(value: Localized<T>, locale: Locale): T   // 按 fallback 链取值
export function has(value: Localized<unknown>, locale: Locale): boolean
```

- 中文是源语言，必须有；其他语言可以缺，缺的时候按 `fallback` 链取，并能被测试和页面识别出来。
- 数据文件（参考、方向库条目、文档、演示）改成 `{ "zh": "…", "en": "…" }`。迁移期间提供 `fromPair([zh, en])`，读旧格式不改行为。
- 组件里的三元表达式改成就近的消息对象，保持仓库现在"大段文案放数据结构"的写法：

  ```ts
  const m = { title: { zh: '灵感参考', en: 'Inspiration' }, count: { zh: (n: number) => `${n} 个参考`, en: (n: number) => `${n} references` } };
  ```

  不引入 i18n 库：现在只有简单插值，复数用 `Intl.PluralRules` 就够。这也符合 `website/` 依赖要少、版本要锁定的约定。

### 3.3 地址与语言状态

候选方案对比：

| 方案 | 做法 | 优点 | 代价 |
|---|---|---|---|
| A（推荐） | 中文保持现有无前缀地址；其他语言加前缀：`/en/inspiration`、`/en/d/forma` | 现有链接、书签、方向卡地址都不变；不需要 301 | 中文与其他语言的写法不对称 |
| B | 所有语言都加前缀：`/zh/…`、`/en/…` | 对称 | 所有现有地址都要 301，方向卡、已分享链接、Search Console 都受影响 |
| C | 只用查询参数或本地存储 | 改动最小 | 搜索引擎无法区分语言版本，不满足 RFC-003 §5 |

决定采用 A，具体规则：

- **地址决定语言。** `main.tsx` 先解析前缀得到 `locale`，再交给页面；新建一个 `LocaleProvider` 和 `useLocale()`，替换 9 处各自读 `localStorage` 的代码。
- **切换语言 = 跳到对应地址。** 语言按钮链接到同一页面的另一语言地址，没有对应译文时跳到该语言的首页，并提示"这一页还没有英文版"。
- **本地存储只用来提示，不用来跳转。** 记下用户上次选的语言；访客打开的地址语言与记录不一致时，在页面顶部给一条可关闭的提示，不自动跳转，也不按 IP 或浏览器语言跳转。
- **方向卡 JSON（`/d/:slug.json`）不分语言**，继续在同一个文件里带所有语言的字段，保证已经发出去的方向卡不失效。
- `/lab/*`、工作台、画布这些实验页面不加语言前缀，继续用页面内切换；它们不进 sitemap。

### 3.4 预渲染与索引

- `renderSite(entries, template, site, references, locale)` 按语言各跑一遍。只有某一页在该语言下内容完整（§3.5）时才输出该语言的 HTML。
- 每个输出页面：`<html lang>` 取语言表、正文为该语言、`canonical` 指向自己、`hreflang` 列出所有已发布的语言版本（包括自己），`x-default` 指向中文地址。
- `sitemap.xml` 每个地址带 `xhtml:link` 的语言对照；RSS 先只出中文。
- 浏览器加载后，React 读到的语言必须与预渲染的语言一致，避免内容闪动、语言错乱。

### 3.5 翻译完整度

- 每个数据条目可以写 `translations: { en: { status: 'complete' | 'draft', reviewedAt: '2026-11-01' } }`。只有 `complete` 的语言版本会被预渲染、写入 sitemap 和出现在语言切换器里。
- 机器翻译只能标 `draft`，人工审过才能改成 `complete`；`draft` 在本地和预览环境可见，线上不可收录。
- 界面消息（按钮、导航）用测试保证所有 `published` 语言都齐全，缺一条测试就失败。

### 3.6 第三方内容和引文

- X 帖子的正文、外部网站的名称和原文引用保持原文，并带 `lang` 属性，不翻译。
- 我们自己写的「研究什么」「用在哪里」要翻译；链接预览里对方自己的标题和描述保持原文。

### 3.7 字体

- 字体栈按语言选：`:root[lang|="zh"]` 用现在的组合；日文要另选标题字体，并在 `fonts.test.mjs` 里检查对应的切片和授权文件。
- 霞鹜新致宋的 IPA 授权说明和"改用 IPA 原版字体"开关在每个语言的页脚都要有，文案进消息对象。

### 3.8 日期、数字和排序

- 统一用 `Intl.DateTimeFormat`、`Intl.NumberFormat` 和 `Intl.Collator`，参数从语言表的 `dateLocale` 取，不再手写日期格式。

## 4. 测试要求（实施时）

- 单元测试：每个 `Localized` 值都有 `zh`；`complete` 的条目在对应语言下字段齐全；语言表里每个已发布语言都有完整的界面消息。
- 预渲染测试：每个已发布语言页面的 `lang`、`canonical`、`hreflang` 互相对应且包含自己；sitemap 的语言对照与页面一致；`draft` 内容不出现在线上构建里。
- 浏览器测试：直接打开 `/en/...` 是英文且无闪动；语言切换跳到对应地址；旧的中文地址和 `/d/:slug.json` 不变；320 / 390 / 1440 宽度下各语言都不出现横向滚动；不执行 JavaScript 时正文是对应语言。

## 5. 实施阶段（不排期）

| 阶段 | 内容 | 用户可见的变化 | 完成标志 |
|---|---|---|---|
| P0 | 语言表、`Localized`、`t()`、`fromPair()`、日期数字格式、测试、迁移清单脚本；不改任何页面 | 无 | 测试通过，构建产物不变（2026-11-01 已完成） |
| P1 | 数据文件改成按语言取值；组件三元表达式改成消息对象 | 无 | `i18n-inventory.mjs` 的三元表达式和位置读取清零（脚本只认现有写法，计数是下限），再人工搜一遍其他按位置取文案的写法；中英文页面的文字和 `aria-label` 前后对比不变 |
| P2 | `LocaleProvider`、地址前缀、语言切换改成跳转、提示条 | 英文有独立地址 | 旧地址全部可用；浏览器测试通过 |
| P3 | 按语言预渲染、`hreflang`、sitemap 语言对照 | 英文页面可被收录 | 无 JavaScript 检查和 Search Console 实际检查（不以 HTTP 200 为准） |
| P4 | 按 RFC-003 §5 选定的第三种语言试点 | 新语言的少量完整页面 | RFC-003 §5 的观察记录 |

P0 和 P1 对用户没有影响，可以在不决定试点语言的情况下先做；P2 起要先完成 RFC-003 §5 的"实施前决策"第 1、2 条。

## 6. 待决问题

1. 第三种语言选哪一种、服务谁（RFC-003 §5 要求先确定受众和任务）。
2. ~~英文版是否要作为独立可收录版本（P3），还是只保留页面内切换。~~ 已决定：要（2026-11-02）。
3. 翻译和审核由谁负责、更新频率怎么定；机器翻译草稿是否允许在预览环境给外部审阅者看。
4. 工作台和实验页面是否最终也要跟随地址语言。

## 7. 不做的事

- 不引入 i18n 框架或翻译服务依赖。
- 不按 IP、浏览器语言或地区自动跳转。
- 不把没审过的机器翻译放到可收录的页面。
- 不翻译第三方原文和条款原文。
- 不在本 RFC 里改代码；实现另开 PR，按 §5 的阶段一步一步做。
