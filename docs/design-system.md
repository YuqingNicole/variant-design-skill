# Variant Design 网站设计系统

本文是 `website/` 的设计规范，写给改网站的人和 Agent。数值以代码为准：变量定义在 `website/src/site-system.css`，首页在 `home.css`，内容页在 `content-pages.css`。代码和本文不一致时，先改代码或本文中错的那一方，不要各写各的。

最后核对：2026-10-31，master `c71d25d`。

## 1. 定位和语气

网站是一个**设计导航站**：收录外部参考、实测过的设计技能和真实的 A/B/C 案例。Variant Design 技能是其中一个精选条目，不是整个网站。首页的主张是"设计导航，只收核对过的"。

视觉上像一本认真排印的目录：纸色底、墨色字、一种深绿、衬线标题、细线分隔。可信比热闹重要。每个条目都要能回答三个问题：来源是谁、什么时候核对的、还有什么不知道。

## 2. 颜色

只有浅色主题，`html` 声明 `color-scheme: light`。

| 变量 | 值 | 用途 | 对比度 |
|---|---|---|---|
| `--site-paper` | `#f7f7f2` | 页面底色 | — |
| `--site-surface` | `#efefe8` | 次级底：切换器底槽、代码块、图片占位 | — |
| （卡片底） | `#fdfdf9` | 浮在纸面上的卡片：首页展示卡、切换器选中块 | — |
| `--site-ink` | `#232622` | 正文和标题 | 纸面上 14.2:1 |
| `--site-muted` | `#62665f` | 次要文字：说明、计数、页脚 | 纸面上 5.45:1，surface 上 5.07:1 |
| （正文深灰） | `#41463d` | 首页长段落 | 纸面上 9.0:1 |
| `--site-line` | `#d7d9d1` | 分隔线、卡片边框 | 只做装饰线，不承担信息 |
| `--site-accent` | `#e1e9d8` | 浅绿底，少量强调 | — |
| （品牌绿） | `#2e4325` | 主按钮底、链接、焦点环、输入光标、表单控件 | 纸面上 10.0:1；白字在其上 10.8:1 |
| （选中文字底） | `#d6e2c8` | `::selection` 底色，配 `--site-ink` | 品牌绿在其上 8.0:1 |

规则：

- 文字至少 4.5:1。新写的颜色只能从上表取，不要再加新的灰绿色。
- 品牌绿只用于"可以点的东西"和焦点状态，不用来装饰。
- 不用渐变，不用纯黑和纯白做大面积底色（主按钮上的白字除外）。

## 3. 字体

| 角色 | 变量 | 字体栈 | 来源 |
|---|---|---|---|
| 标题 | `--font-display` | Libre Caslon Display → 霞鹜新致宋 → Songti SC | Caslon 来自 `@fontsource/libre-caslon-display`；新致宋由 `website/scripts/subset-zhisong.py` 切片 |
| 正文 | `--font-serif`（名字是历史遗留，实际是无衬线） | Hanken Grotesk → PingFang SC → Microsoft YaHei | `@fontsource-variable/hanken-grotesk` |
| 代码 | `--font-mono` | IBM Plex Mono → SFMono-Regular → Consolas | `@fontsource/ibm-plex-mono` |

所有字体都打包在网站里自己提供，不从 Google Fonts 加载，因为国内访问不到。

**霞鹜新致宋的授权义务**：它使用 IPA Font License 1.0。每个页面的页脚必须保留：

- 授权说明；
- "改用 IPA 原版字体"开关；
- 指向 `/fonts/LICENSES.txt` 的链接。

这些都在 `SiteChrome.tsx` 的 `FontNote` 里，由 `tests/landing.spec.mjs` 和 `website/scripts/fonts.test.mjs` 检查。删掉其中任何一项都会违反授权。

### 字号

| 用途 | 选择器 | 大小 | 行高 |
|---|---|---|---|
| 首页主标题 | `.home-claim h1` | `clamp(40px, 4.6vw, 66px)` | 1.08 |
| 内容页主标题 | `.content-hero h1` | `clamp(36px, 4.8vw, 64px)`，手机 36px | 1.18 |
| 首页区块标题 | `.home-tasks h2` | `clamp(30px, 3.4vw, 46px)` | — |
| 展示卡标题 | `.home-show-card h3` | 44px，手机 34px | 1.05 |
| 引导段落 | `.home-claim > p` | 17px | 1.75 |
| 正文 | `.content-reading p` | 15px | 1.9 |
| 卡片说明 | `.home-show-body` | 16px | 1.7 |
| 次要说明 | `.home-tasks li p` | 14px | 1.7 |
| 小字 | 页脚、出处行 | 12–13px | 1.6 |

规则：

- 标题用 `--font-display`，字重 500，`font-synthesis: none`，字距 -0.01em。衬线标题不要再收紧字距，也绝不能小于 -0.04em。
- 衬线只用于标题，正文、按钮和表单一律用无衬线。
- 小于 12px 的字不要再加。
- 等宽字体只用于代码、命令和日期。不要用等宽字体做眉标、分类标签或装饰。

## 4. 布局和间距

- **容器**：`.site-shell` 宽度为 `min(1280px, 100% - 96px)`。800px 以下改为 `100% - 40px`，480px 以下改为 `100% - 32px`。
- **断点**：1000px（首页首屏改单列，主张在前）、800px（导航变紧凑）、650px（导航可横向滚动）、480px（页脚竖排）。
- **区块**：首页各区块 `padding-block: 72px`，之间用一条 `--site-line` 顶线分隔。首屏 `padding-block: 64px 80px`。
- **间距**：区块内用 `gap`，不要逐个元素加 margin。常用值：
  - 按钮组 12px；
  - 链接组 20px；
  - 卡片内 12–14px；
  - 两栏之间 64–72px。
- **防溢出**：网格子元素要加 `min-width: 0`，长文本才会换行。每个页面在 320 / 390 / 1440 宽度下都不能横向滚动，测试会检查。
- **行宽**：正文不超过 68ch，引导段落不超过 46ch。

## 5. 圆角、边框、阴影

| 值 | 用于 |
|---|---|
| 999px | 胶囊：首页切换器和它的选中块 |
| 12px | 首页展示卡 |
| 6px | 按钮、代码块、图片、价格卡 |
| 4–5px | 历史值，见第 9 节，新组件不要用 |

规则：

- 物体之间优先用 1px 细线分隔，少用卡片。
- 卡片只用边框，不同时用边框加阴影。
- 全站唯一的阴影是切换器选中块的 `0 1px 2px rgba(35,38,34,.14)`。

## 6. 动效

（PR #88 合并后生效。）

- **切换**：所有状态切换都调用 `website/src/view-transition.ts` 的 `transition()`。浏览器不支持 View Transitions 或用户开了"减少动态效果"时，直接切换。
- **用在哪里**：只给用户主动操作的切换加动画，包括切换器、筛选、中英切换和字体开关。不加滚动入场、数字滚动或循环动画。
- **时长和曲线**：元素移动 0.34s，整页淡入淡出 0.18s，曲线 `cubic-bezier(.22,1,.36,1)`。
- **悬停**：只在 `(hover: hover)` 且不减少动效时生效。悬停只改线的粗细或颜色，不位移、不缩放。
- **元素命名**：需要跟着移动的元素设 `view-transition-name`，名字必须唯一，参考卡片用 `ref-<id>`。

## 7. 组件

| 组件 | 位置 | 要点 |
|---|---|---|
| 导航 | `SiteHeader`（`SiteChrome.tsx`） | 品牌字标、6 个链接、语言按钮。当前页用下划线标出，偏移 6px |
| 页脚 | `SiteFooter` + `FontNote` | 品牌、站内链接、字体授权行（见第 3 节，不能删） |
| 主按钮 | `.home-action-primary` | 品牌绿底、白字、6px 圆角、内边距 12px 20px、15px 字 |
| 次按钮 | `.home-action-secondary` | 透明底、品牌绿 1px 边框、品牌绿字 |
| 切换器 | `.home-shelves` | surface 色胶囊底槽，选中项是卡片底色的胶囊块，带唯一阴影。按钮用 `aria-pressed`，标签固定不变 |
| 展示卡 | `.home-show-card` | 卡片底、细边框、12px 圆角。顺序：标题 → 说明 → 出处一行 → 底部链接组（上方一条细线） |
| 任务列表 | `.home-tasks` | 两栏列表，每行有顶线：链接 + 一句说明。不编号 |
| 筛选按钮 | `.content-filters button` | 4px 边框按钮，选中态由 `aria-pressed` 表示 |
| 参考卡片 | `.inspiration-grid article` | 标题链接到来源，`dl` 依次写：研究什么 / 用在哪里 / 出处 / 设计者。"仅链接"标记必须保留 |
| 代码块 | `.home-show-code` | Plex Mono 13px，surface 底，6px 圆角，`overflow-wrap: anywhere` |

可交互的元素都要有可见的焦点状态。目标是统一用 2px 品牌绿描边、偏移 2px。现在内容页的链接和按钮仍是蓝色描边，见第 10 节第 3 条。

## 8. 文案

- **双语**：所有文案都提供中英两份，数据里按 `[中文, 英文]` 的顺序写。大段文案放在数据结构里，不直接写在 JSX 中。
- **写法**：直接、具体，句首大写、其余小写（sentence case）。不用全大写标签，不用表情符号，首页的链接和按钮里不放 `→ ↗ ↓` 这类箭头。
- **数字**：从数据算出来，比如"26 个参考"由 `inspirationItems.length` 得出，不要手写。
- **诚实**：不知道的事直接写出来，比如"设计者：未知""登录后操作未实测"。没测过的东西不写成"支持"。
- **第三方内容**：只放链接和我们自己写的研究笔记，不复制对方的文案、商标和截图。

## 9. 不要做

这些做法会让网站像 AI 批量生成的页面。依据是 Impeccable 的 craft floor 和检测器，可以用 `npx -y impeccable@4.8.0 detect --json <url>` 检查：

- 眉标或小标题标签，比如 `REFERENCE LIBRARY / 001`；
- 给不是步骤的内容编号，比如 `01 / 02 / 03`；
- 一排外观完全相同的卡片网格当作主视觉；
- 卡片同时用边框和阴影；
- 用字形符号当图标；
- 用等宽字体做装饰；
- 渐变和发光效果；
- 过度使用的字体：Inter、Roboto、Arial、Fraunces、Instrument Serif、Instrument Sans、Geist、Space Grotesk 等。

## 10. 已知偏差

下面这些是现有代码里不符合上述规范的地方，改到相关页面时顺手修掉：

1. **对比度不足**（纸面或卡片底上）：

   | 颜色 | 位置 | 对比度 |
   |---|---|---|
   | `#757d6b` | 页脚 | 3.99:1 |
   | `#83867e` | 字标 "design" 部分 | 3.44:1 |
   | `#7a846f` | 眉标 | 3.65:1 |
   | `#879976`、`#87977b`、`#8a9a7d` | 参考卡片的小字 | 2.96–3.07:1 |
   | `#7e8e73` | 计数 | 3.25:1 |
   | `#758769` | 搜索标签 | 3.60:1 |

   改成 `--site-muted` 即可。
2. **灰绿色太多**：`inspiration.css` 和 `content-pages.css` 里有十几个一次性的灰绿色，比如 `#536648`、`#65745a`、`#5d6e4f`、`#ced6c4`、`#d5ddcc`，应该收进第 2 节的颜色。
3. **焦点环两种颜色**：导航、页脚和部分内容页用的是蓝色 `#325ecb`，应统一成品牌绿。
4. **非首页还有眉标**：`/inspiration`、`/skills`、`/docs`、`/pricing`、`/lab`、`/about` 页面顶部仍有等宽眉标，`/docs` 的章节编号 `00.` 到 `05.` 也是同一类问题。另外参考卡片里还有 `↗` 符号。
5. **圆角不统一**：还有 4px 和 5px 的圆角（筛选按钮、参考卡片、输入框），应向 6px 靠拢。

## 11. 修改流程

1. 先改 `site-system.css` 里的变量，不要在组件里写新的颜色值。
2. 跑测试：

   ```sh
   npm test --prefix website && npm run build --prefix website
   cd tests && PLAYWRIGHT_CHANNEL=chrome npx playwright test -c landing.config.mjs
   ```

3. 视觉改动要在 320 / 390 / 1440 三个宽度、中英两种语言下截图检查，再用 Impeccable 检测器检查一遍首页。
4. 改了本文描述的数值，要在同一个 PR 里同步更新本文。
