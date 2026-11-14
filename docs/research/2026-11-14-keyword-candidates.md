# 关键词备选：带搜索量的六个英文词（2026-11-14）

接着 `2026-11-09-keyword-candidates.md`。那份清单没有任何搜索量数据；这份记录的是维护者 2026-11-14 提供的六个词，带月搜索量和难度。它们是**备选**，还没有决定主攻哪个，也没有为它们改任何页面。

## 1. 数据

维护者原样提供的表，没有改动数字：

| 关键词 | 美国/月 | 英国/月 | 美国 KD | 适合承接的内容（维护者填） |
|---|---:|---:|---:|---|
| `frontend design skill` | 1,900 | 260 | 4 | 产品介绍、安装与能力演示 |
| `claude design skills` | 1,600 | 480 | 16 | 技能选型、工作流教程 |
| `claude code design` | 880 | 140 | 35 | 用 Claude Code 改善界面的实操 |
| `vibe coding ui` | 110 | 20 | 6 | AI 界面改造前后对比 |
| `website design audit` | 50 | 10 | 0 | 设计检查清单、审阅案例 |
| `codex frontend design` | 30 | 未返回 | 3 | Codex 安装及使用教程 |

局限：

- **来源工具和取数日期没有记录。** 表是维护者贴过来的，没有注明是哪个工具（Ahrefs、Semrush 或别的）、哪一天查的。KD 的算法各家不同，不能和别的工具的数字直接比。
- 我没有独立核对过任何一个数字，也没有打开过这些词的搜索结果页。
- 没有中文词，没有美国、英国以外的地区。

## 2. 每个词现在有没有页面承接

下面是我对照仓库里现有英文页面的标题做的判断（`website/scripts/prerender.mjs`、`website/src/docs-articles.ts`、`website/src/guides-content.ts`），不是搜索结果里的排名。

| 关键词 | 现有最接近的页面 | 标题里有没有这个词 |
|---|---|---|
| `frontend design skill` | `/en/skills`（Design skills）、`/en/docs/install`（Install & get started） | 没有 "frontend" |
| `claude design skills` | `/en/skills` | 有 "Design skills"，没有 "Claude" |
| `claude code design` | `/en/docs/design-exploration-with-ai-coding-agents`、`/en/guides/compare-design-directions` | 没有 "Claude Code" |
| `vibe coding ui` | `/en/guides/avoid-generic-ai-ui` | 没有 "vibe coding" |
| `website design audit` | `/en/docs/check-ai-generated-ui-before-you-ship` | 没有 "audit" |
| `codex frontend design` | `/en/docs/install` | 没有 "Codex"，也没有 "frontend" |

六个词现在都没有一个标题对得上的页面。英文首页的标题是 "Variant Design — The best design inspiration in the AI era"，主打设计灵感，不承接这一组技能类的词。

## 3. 我的看法（推断，未核实）

- **搜索意图可能指向别人的产品。** 我的印象是 Anthropic 发布过一个名叫 frontend-design 的 Claude 技能；如果属实，`frontend design skill` 和 `claude design skills` 的搜索里有一部分是在找那个技能，不是在找同类产品。这是凭记忆的判断，写页面之前要先打开搜索结果页看前十名是什么。KD 低只说明排上去不难，不说明排上去的访客是我们要的人。
- **涉及 Claude 的对比内容有限制。** `AGENTS.md` 规定不对条款禁止的服务做测评（点名了 Claude）。承接这两个词的页面只能写我们自己的技能怎么用、和公开可查的事实，不做对比评测。
- **量小但意图对得上的词更稳。** `website design audit`（KD 0）和 `codex frontend design`（KD 3）量很小，但现有文章只差标题和小标题里的用词；`vibe coding ui`（KD 6）对应已有的“避免千篇一律”指南。
- **`claude code design` 难度最高（KD 35）**，现有两篇文章内容对得上，但要不要把 "Claude Code" 写进标题，取决于文章是否真的只讲 Claude Code；现在它们同时适用于 Codex。

## 4. 备选的做法（都没有做）

1. 给 `/en/skills` 的标题和描述补上 "Claude Code" 和 "Codex"（它本来就只列在这两个工具里跑过的技能）。
2. 给 `/en/docs/install` 的标题补上 "Claude Code and Codex"。
3. 给检查清单那篇文章加 "design audit" 的说法。
4. 新写一篇 Codex 的安装和使用教程，承接 `codex frontend design`。

中文和英文是互为翻译的，改英文标题时中文要在同一次提交里一起改。

## 5. 下一步

1. 【维护者】补上数据来源：工具名和取数日期。
2. 打开每个词的搜索结果页，记下前十名是什么类型的页面（官方文档、目录站、教程、对比文），再决定主攻哪几个。
3. Search Console 有数据以后，看这些词有没有展示，再回来修订这份记录。
