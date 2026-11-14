# 关键词备选：带搜索量的六个英文词（2026-11-14）

接着 `2026-11-09-keyword-candidates.md`。那份清单没有任何搜索量数据；这份记录的是维护者 2026-11-14 提供的六个词，带月搜索量和难度。它们起初是**备选**；同一天维护者决定“意图可以引导到我们的产品，开始行动”，第 4 节记录了随后改的页面。第 2 节是改动之前的状态。

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

## 2. 改动之前，每个词有没有页面承接

下面是我对照仓库里现有英文页面的标题做的判断（`website/scripts/prerender.mjs`、`website/src/docs-articles.ts`、`website/src/guides-content.ts`），不是搜索结果里的排名。

| 关键词 | 现有最接近的页面 | 标题里有没有这个词 |
|---|---|---|
| `frontend design skill` | `/en/skills`（Design skills）、`/en/docs/install`（Install & get started） | 没有 "frontend" |
| `claude design skills` | `/en/skills` | 有 "Design skills"，没有 "Claude" |
| `claude code design` | `/en/docs/design-exploration-with-ai-coding-agents`、`/en/guides/compare-design-directions` | 没有 "Claude Code" |
| `vibe coding ui` | `/en/guides/avoid-generic-ai-ui` | 没有 "vibe coding" |
| `website design audit` | `/en/docs/check-ai-generated-ui-before-you-ship` | 没有 "audit" |
| `codex frontend design` | `/en/docs/install` | 没有 "Codex"，也没有 "frontend" |

改动之前，六个词都没有一个标题对得上的页面。英文首页的标题是 "Variant Design — The best design inspiration in the AI era"，主打设计灵感，不承接这一组技能类的词。

## 3. 我的看法（推断，未核实）

- **搜索意图可能指向别人的产品。** 我的印象是 Anthropic 发布过一个名叫 frontend-design 的 Claude 技能；如果属实，`frontend design skill` 和 `claude design skills` 的搜索里有一部分是在找那个技能，不是在找同类产品。这是凭记忆的判断，写页面之前要先打开搜索结果页看前十名是什么。KD 低只说明排上去不难，不说明排上去的访客是我们要的人。
- **涉及 Claude 的对比内容有限制。** `AGENTS.md` 规定不对条款禁止的服务做测评（点名了 Claude）。承接这两个词的页面只能写我们自己的技能怎么用、和公开可查的事实，不做对比评测。
- **量小但意图对得上的词更稳。** `website design audit`（KD 0）和 `codex frontend design`（KD 3）量很小，但现有文章只差标题和小标题里的用词；`vibe coding ui`（KD 6）对应已有的“避免千篇一律”指南。
- **`claude code design` 难度最高（KD 35）**，现有两篇文章内容对得上，但要不要把 "Claude Code" 写进标题，取决于文章是否真的只讲 Claude Code；现在它们同时适用于 Codex。

## 4. 做了什么（2026-11-14，同一个 PR）

维护者的决定：这些词的搜索意图可以引导到我们的产品。第 3 节的顾虑没有被核实，也没有被推翻，只是不再作为不动手的理由。

| 页面 | 改动 | 对应的词 |
|---|---|---|
| `/skills` | 标题从“设计技能”改为“Claude Code 和 Codex 的前端设计技能”（英文 "Frontend design skills for Claude Code and Codex"），描述同步；页面里的大标题不变 | `frontend design skill`、`claude design skills` |
| `/docs/install` | 标题从“安装与开始使用”改为“在 Claude Code 和 Codex 里安装设计技能”（英文 "Install the design skill in Claude Code and Codex"）；大标题不变 | `codex frontend design`、`claude code design` |
| `/docs/check-ai-generated-ui-before-you-ship` | 标题加“：三层设计审查”（英文 ": a three-layer design audit"） | `website design audit` |
| `/docs/design-exploration-with-ai-coding-agents` | 开头一句写明“在 Claude Code 或 Codex 里”；标题不变，因为 11 月 9 日的清单把它对着 "design exploration with ai coding agents" | `claude code design` |
| `/guides/avoid-generic-ai-ui` | 开头一句先说 vibe coding 的情况；标题不变 | `vibe coding ui` |
| `/docs/frontend-design-in-codex`（新文章） | “在 Codex 里做前端设计：安装技能、比较三个方向、在沙箱里预览”，五节：安装、发任务、沙箱里预览、试改撤回接入、检查过什么没检查什么 | `codex frontend design` |

中英文在同一次提交里一起改。没有写任何与其他产品的对比。

没有做的：

关于新文章：

- **依据是旧记录，不是新的运行。** 内容来自 `2026-10-26-cli-dogfood.md`、`2026-10-27-eval-baseline.md`、`2026-10-27-skill-distribution.md` 和 `references/workflow/preview.md`，当时用的是 Codex CLI 0.163.0。写文章时本机没有安装 Codex（`codex` 不在 `PATH` 里），所以没有重跑；文章第 5 节写明了这一点。
- **英文是草稿。** 英文是代理写的，没有人审过，标了 `translations: { en: { status: 'draft' } }`：生产环境只出中文页，`/en/docs/frontend-design-in-codex` 不出，预览部署能看到。这个词是英文词，所以在英文审过之前，这篇文章承接不了它。

没有做的：

- 标题里没有逐字放进每个词：`website design audit` 只对上了 "design audit"，`vibe coding ui` 和 `claude code design` 只进了开头一句（也就是描述），没有进标题。
- 英文首页仍然主打设计灵感。

检查：`npm test --prefix website` 100 个通过；构建后读了这些页面的 `<title>` 和描述；落地页浏览器回归的结果见 PR。**没有**检查搜索结果里的任何变化，也不声称对排名有效果。

## 5. 下一步

1. 【维护者】补上数据来源：工具名和取数日期。
2. 打开每个词的搜索结果页，记下前十名是什么类型的页面（官方文档、目录站、教程、对比文），核对第 3 节的顾虑。
3. 【维护者】审 `/docs/frontend-design-in-codex` 的英文，审过后去掉草稿标记。装上 Codex 以后用 `node evals/run.mjs --agent codex --fixture pulse` 重跑一次，按结果修订文章第 5 节。
4. Search Console 有数据以后，看这些词有没有展示，再回来修订这份记录。
